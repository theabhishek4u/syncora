import { createServer } from 'http'
import { Server, Socket } from 'socket.io'

// ============================================================
// Type Definitions
// ============================================================

interface SongData {
  id: string
  title: string
  artist: string
  album?: string
  duration: number
  coverUrl?: string
  audioUrl?: string
}

interface MemberState {
  socketId: string
  userId: string
  userName: string
  userImage?: string
  joinedAt: number
  isMuted: boolean
}

interface PlaybackState {
  isPlaying: boolean
  currentSong: SongData | null
  position: number // in milliseconds
  lastSyncTime: number // timestamp of last sync
  startedAt: number // when playback started (for sync calculation)
}

interface QueueItem {
  song: SongData
  addedBy: string
  addedAt: number
}

interface RoomState {
  id: string
  name: string
  hostId: string
  members: Map<string, MemberState>
  playback: PlaybackState
  queue: QueueItem[]
  voiceMembers: Set<string>
}

// ============================================================
// Room & Socket Tracking
// ============================================================

const rooms = new Map<string, RoomState>()
const socketToRoom = new Map<string, string>() // socketId -> roomId
const socketToUser = new Map<string, string>() // socketId -> userId

function getOrCreateRoom(roomId: string, roomName: string, hostId: string): RoomState {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      id: roomId,
      name: roomName,
      hostId,
      members: new Map(),
      playback: {
        isPlaying: false,
        currentSong: null,
        position: 0,
        lastSyncTime: 0,
        startedAt: 0,
      },
      queue: [],
      voiceMembers: new Set(),
    })
  } else if (roomName && roomName !== `Room ${roomId}`) {
    // Update room name if a proper name is provided
    const room = rooms.get(roomId)!
    room.name = roomName
  }
  return rooms.get(roomId)!
}

function getRoomForSocket(socket: Socket): RoomState | null {
  const roomId = socketToRoom.get(socket.id)
  if (!roomId) return null
  return rooms.get(roomId) ?? null
}

function removeMemberFromRoom(socket: Socket): { roomId: string; userId: string; userName: string } | null {
  const roomId = socketToRoom.get(socket.id)
  const userId = socketToUser.get(socket.id)
  if (!roomId || !userId) return null

  const room = rooms.get(roomId)
  if (!room) return null

  const member = room.members.get(userId)
  const userName = member?.userName ?? 'Unknown'

  room.members.delete(userId)
  room.voiceMembers.delete(userId)
  socketToRoom.delete(socket.id)
  socketToUser.delete(socket.id)

  // If room is empty, clean it up
  if (room.members.size === 0) {
    rooms.delete(roomId)
    console.log(`Room ${roomId} deleted (empty)`)
  } else {
    // If the host left, assign a new host (earliest member)
    if (room.hostId === userId) {
      const earliestMember = Array.from(room.members.values()).sort(
        (a, b) => a.joinedAt - b.joinedAt
      )[0]
      if (earliestMember) {
        room.hostId = earliestMember.userId
        // Notify room about host change
        io.to(roomId).emit('room:host-change', {
          roomId,
          newHostId: earliestMember.userId,
          newHostName: earliestMember.userName,
        })
        console.log(`Host transferred to ${earliestMember.userName} in room ${roomId}`)
      }
    }
  }

  return { roomId, userId, userName }
}

function serializeRoom(room: RoomState) {
  return {
    id: room.id,
    name: room.name,
    hostId: room.hostId,
    members: Array.from(room.members.values()).map((m) => ({
      userId: m.userId,
      userName: m.userName,
      userImage: m.userImage,
      joinedAt: m.joinedAt,
      isMuted: m.isMuted,
    })),
    playback: {
      isPlaying: room.playback.isPlaying,
      currentSong: room.playback.currentSong,
      position: room.playback.position,
      lastSyncTime: room.playback.lastSyncTime,
      startedAt: room.playback.startedAt,
    },
    queue: room.queue,
    voiceMembers: Array.from(room.voiceMembers),
  }
}

function calculateCurrentPosition(room: RoomState): number {
  if (!room.playback.isPlaying || room.playback.startedAt === 0) {
    return room.playback.position
  }
  const elapsed = Date.now() - room.playback.startedAt
  return room.playback.position + elapsed
}

// ============================================================
// HTTP & Socket.io Server Setup
// ============================================================

const httpServer = createServer()
const io = new Server(httpServer, {
  path: '/',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 45000,
})

// ============================================================
// Connection Handler
// ============================================================

io.on('connection', (socket: Socket) => {
  console.log(`[CONNECT] Socket ${socket.id} connected`)

  // ----------------------------------------------------------
  // Room Management
  // ----------------------------------------------------------

  socket.on('room:join', (data: { roomId: string; roomName?: string; userId: string; userName: string; userImage?: string }) => {
    try {
      const { roomId, roomName, userId, userName, userImage } = data

      if (!roomId || !userId || !userName) {
        socket.emit('error', { message: 'Missing required fields: roomId, userId, userName' })
        return
      }

      // Leave previous room if in one
      const prevRoomId = socketToRoom.get(socket.id)
      if (prevRoomId) {
        const leaveInfo = removeMemberFromRoom(socket)
        if (leaveInfo) {
          socket.leave(prevRoomId)
          io.to(prevRoomId).emit('room:member-left', {
            roomId: prevRoomId,
            userId: leaveInfo.userId,
            userName: leaveInfo.userName,
          })
          const prevRoom = rooms.get(prevRoomId)
          if (prevRoom) {
            io.to(prevRoomId).emit('room:update', serializeRoom(prevRoom))
          }
        }
      }

      // Get or create room
      const room = getOrCreateRoom(roomId, roomName ?? `Room ${roomId}`, userId)

      // Add member to room
      const member: MemberState = {
        socketId: socket.id,
        userId,
        userName,
        userImage,
        joinedAt: Date.now(),
        isMuted: false,
      }
      room.members.set(userId, member)

      // Track socket
      socketToRoom.set(socket.id, roomId)
      socketToUser.set(socket.id, userId)

      // Join socket.io room
      socket.join(roomId)

      // Send current room state to the joining user
      socket.emit('room:joined', {
        room: serializeRoom(room),
        currentPosition: calculateCurrentPosition(room),
      })

      // Notify others in the room
      socket.to(roomId).emit('room:member-joined', {
        roomId,
        member: {
          userId,
          userName,
          userImage,
          joinedAt: member.joinedAt,
          isMuted: member.isMuted,
        },
      })

      // Broadcast updated room state
      io.to(roomId).emit('room:update', serializeRoom(room))

      console.log(`[ROOM:JOIN] ${userName} (${userId}) joined room ${roomId}. Members: ${room.members.size}`)
    } catch (error) {
      console.error('[ROOM:JOIN] Error:', error)
      socket.emit('error', { message: 'Failed to join room' })
    }
  })

  socket.on('room:leave', (data: { roomId: string; userId: string }) => {
    try {
      const { roomId, userId } = data
      const currentRoomId = socketToRoom.get(socket.id)

      if (currentRoomId !== roomId) {
        socket.emit('error', { message: 'You are not in this room' })
        return
      }

      socket.leave(roomId)
      const leaveInfo = removeMemberFromRoom(socket)

      if (leaveInfo) {
        io.to(roomId).emit('room:member-left', {
          roomId,
          userId: leaveInfo.userId,
          userName: leaveInfo.userName,
        })
        const room = rooms.get(roomId)
        if (room) {
          io.to(roomId).emit('room:update', serializeRoom(room))
        }
      }

      socket.emit('room:left', { roomId })
      console.log(`[ROOM:LEAVE] ${userId} left room ${roomId}`)
    } catch (error) {
      console.error('[ROOM:LEAVE] Error:', error)
      socket.emit('error', { message: 'Failed to leave room' })
    }
  })

  // ----------------------------------------------------------
  // Music Sync (THE CORE FEATURE)
  // ----------------------------------------------------------

  socket.on('music:play', (data: { roomId: string; songId?: string; position?: number; timestamp: number }) => {
    try {
      const { roomId, position, timestamp } = data
      const room = rooms.get(roomId)
      if (!room) {
        socket.emit('error', { message: 'Room not found' })
        return
      }

      // Only host can control playback (or allow any member for flexibility)
      const userId = socketToUser.get(socket.id)
      const member = userId ? room.members.get(userId) : null
      if (!member) {
        socket.emit('error', { message: 'You are not a member of this room' })
        return
      }

      const currentPosition = position ?? room.playback.position
      room.playback.isPlaying = true
      room.playback.position = currentPosition
      room.playback.startedAt = Date.now()
      room.playback.lastSyncTime = timestamp

      // Broadcast to all other room members
      socket.to(roomId).emit('music:play', {
        roomId,
        songId: room.playback.currentSong?.id,
        position: currentPosition,
        timestamp,
        startedAt: room.playback.startedAt,
      })

      console.log(`[MUSIC:PLAY] Room ${roomId} - Position: ${currentPosition}ms`)
    } catch (error) {
      console.error('[MUSIC:PLAY] Error:', error)
      socket.emit('error', { message: 'Failed to play music' })
    }
  })

  socket.on('music:pause', (data: { roomId: string; position?: number; timestamp: number }) => {
    try {
      const { roomId, position, timestamp } = data
      const room = rooms.get(roomId)
      if (!room) {
        socket.emit('error', { message: 'Room not found' })
        return
      }

      const userId = socketToUser.get(socket.id)
      const member = userId ? room.members.get(userId) : null
      if (!member) {
        socket.emit('error', { message: 'You are not a member of this room' })
        return
      }

      // Calculate current position at pause time
      const currentPosition = position ?? calculateCurrentPosition(room)
      room.playback.isPlaying = false
      room.playback.position = currentPosition
      room.playback.startedAt = 0
      room.playback.lastSyncTime = timestamp

      socket.to(roomId).emit('music:pause', {
        roomId,
        position: currentPosition,
        timestamp,
      })

      console.log(`[MUSIC:PAUSE] Room ${roomId} - Position: ${currentPosition}ms`)
    } catch (error) {
      console.error('[MUSIC:PAUSE] Error:', error)
      socket.emit('error', { message: 'Failed to pause music' })
    }
  })

  socket.on('music:seek', (data: { roomId: string; position: number; timestamp: number }) => {
    try {
      const { roomId, position, timestamp } = data
      const room = rooms.get(roomId)
      if (!room) {
        socket.emit('error', { message: 'Room not found' })
        return
      }

      const userId = socketToUser.get(socket.id)
      const member = userId ? room.members.get(userId) : null
      if (!member) {
        socket.emit('error', { message: 'You are not a member of this room' })
        return
      }

      room.playback.position = position
      room.playback.lastSyncTime = timestamp

      if (room.playback.isPlaying) {
        room.playback.startedAt = Date.now()
      }

      socket.to(roomId).emit('music:seek', {
        roomId,
        position,
        timestamp,
      })

      console.log(`[MUSIC:SEEK] Room ${roomId} - Position: ${position}ms`)
    } catch (error) {
      console.error('[MUSIC:SEEK] Error:', error)
      socket.emit('error', { message: 'Failed to seek' })
    }
  })

  socket.on('music:track-change', (data: { roomId: string; song: SongData; position?: number; timestamp: number }) => {
    try {
      const { roomId, song, position = 0, timestamp } = data
      const room = rooms.get(roomId)
      if (!room) {
        socket.emit('error', { message: 'Room not found' })
        return
      }

      const userId = socketToUser.get(socket.id)
      const member = userId ? room.members.get(userId) : null
      if (!member) {
        socket.emit('error', { message: 'You are not a member of this room' })
        return
      }

      room.playback.currentSong = song
      room.playback.position = position
      room.playback.lastSyncTime = timestamp

      if (room.playback.isPlaying) {
        room.playback.startedAt = Date.now()
      }

      // Broadcast track change to room
      io.to(roomId).emit('music:track-change', {
        roomId,
        song,
        position,
        timestamp,
        changedBy: userId,
      })

      console.log(`[MUSIC:TRACK-CHANGE] Room ${roomId} - Now playing: ${song.title} by ${song.artist}`)
    } catch (error) {
      console.error('[MUSIC:TRACK-CHANGE] Error:', error)
      socket.emit('error', { message: 'Failed to change track' })
    }
  })

  socket.on('music:sync', (data: { roomId: string; position: number; timestamp: number; isPlaying: boolean }) => {
    try {
      const { roomId, position, timestamp, isPlaying } = data
      const room = rooms.get(roomId)
      if (!room) {
        socket.emit('error', { message: 'Room not found' })
        return
      }

      // Update server-side playback state
      room.playback.position = position
      room.playback.isPlaying = isPlaying
      room.playback.lastSyncTime = timestamp

      if (isPlaying && room.playback.startedAt === 0) {
        room.playback.startedAt = Date.now()
      } else if (!isPlaying) {
        room.playback.startedAt = 0
      }

      // Broadcast sync to other room members
      socket.to(roomId).emit('music:sync', {
        roomId,
        position,
        timestamp,
        isPlaying,
        startedAt: room.playback.startedAt,
      })

      console.log(`[MUSIC:SYNC] Room ${roomId} - Position: ${position}ms, Playing: ${isPlaying}`)
    } catch (error) {
      console.error('[MUSIC:SYNC] Error:', error)
      socket.emit('error', { message: 'Failed to sync music' })
    }
  })

  socket.on('music:sync-request', (data: { roomId: string }) => {
    try {
      const { roomId } = data
      const room = rooms.get(roomId)
      if (!room) {
        socket.emit('error', { message: 'Room not found' })
        return
      }

      const currentPosition = calculateCurrentPosition(room)

      socket.emit('music:sync-response', {
        roomId,
        isPlaying: room.playback.isPlaying,
        currentSong: room.playback.currentSong,
        position: currentPosition,
        startedAt: room.playback.startedAt,
        lastSyncTime: room.playback.lastSyncTime,
        timestamp: Date.now(),
      })

      console.log(`[MUSIC:SYNC-REQUEST] Room ${roomId} - Sent sync response (position: ${currentPosition}ms)`)
    } catch (error) {
      console.error('[MUSIC:SYNC-REQUEST] Error:', error)
      socket.emit('error', { message: 'Failed to get sync state' })
    }
  })

  // ----------------------------------------------------------
  // Queue Management
  // ----------------------------------------------------------

  socket.on('queue:add', (data: { roomId: string; song: SongData; addedBy: string }) => {
    try {
      const { roomId, song, addedBy } = data
      const room = rooms.get(roomId)
      if (!room) {
        socket.emit('error', { message: 'Room not found' })
        return
      }

      const queueItem: QueueItem = {
        song,
        addedBy,
        addedAt: Date.now(),
      }

      room.queue.push(queueItem)

      // Broadcast updated queue to room
      io.to(roomId).emit('queue:update', {
        roomId,
        queue: room.queue,
        action: 'add',
        songId: song.id,
        addedBy,
      })

      console.log(`[QUEUE:ADD] Room ${roomId} - Added "${song.title}" by ${song.artist}`)
    } catch (error) {
      console.error('[QUEUE:ADD] Error:', error)
      socket.emit('error', { message: 'Failed to add song to queue' })
    }
  })

  socket.on('queue:remove', (data: { roomId: string; songId: string }) => {
    try {
      const { roomId, songId } = data
      const room = rooms.get(roomId)
      if (!room) {
        socket.emit('error', { message: 'Room not found' })
        return
      }

      const index = room.queue.findIndex((item) => item.song.id === songId)
      if (index === -1) {
        socket.emit('error', { message: 'Song not found in queue' })
        return
      }

      const removed = room.queue.splice(index, 1)[0]

      io.to(roomId).emit('queue:update', {
        roomId,
        queue: room.queue,
        action: 'remove',
        songId,
      })

      console.log(`[QUEUE:REMOVE] Room ${roomId} - Removed "${removed.song.title}"`)
    } catch (error) {
      console.error('[QUEUE:REMOVE] Error:', error)
      socket.emit('error', { message: 'Failed to remove song from queue' })
    }
  })

  socket.on('queue:reorder', (data: { roomId: string; queue: QueueItem[] }) => {
    try {
      const { roomId, queue } = data
      const room = rooms.get(roomId)
      if (!room) {
        socket.emit('error', { message: 'Room not found' })
        return
      }

      room.queue = queue

      io.to(roomId).emit('queue:update', {
        roomId,
        queue: room.queue,
        action: 'reorder',
      })

      console.log(`[QUEUE:REORDER] Room ${roomId} - Queue reordered (${queue.length} items)`)
    } catch (error) {
      console.error('[QUEUE:REORDER] Error:', error)
      socket.emit('error', { message: 'Failed to reorder queue' })
    }
  })

  // ----------------------------------------------------------
  // WebRTC Signaling (for voice chat)
  // ----------------------------------------------------------

  socket.on('webrtc:join-voice', (data: { roomId: string; userId: string }) => {
    try {
      const { roomId, userId } = data
      const room = rooms.get(roomId)
      if (!room) {
        socket.emit('error', { message: 'Room not found' })
        return
      }

      room.voiceMembers.add(userId)

      // Notify room that user joined voice
      io.to(roomId).emit('webrtc:user-joined-voice', {
        roomId,
        userId,
      })

      // Send list of existing voice members to the joining user
      const existingVoiceMembers = Array.from(room.voiceMembers).filter((id) => id !== userId)
      socket.emit('webrtc:voice-members', {
        roomId,
        voiceMembers: existingVoiceMembers,
      })

      console.log(`[WEBRTC:JOIN-VOICE] ${userId} joined voice in room ${roomId}. Voice members: ${room.voiceMembers.size}`)
    } catch (error) {
      console.error('[WEBRTC:JOIN-VOICE] Error:', error)
      socket.emit('error', { message: 'Failed to join voice chat' })
    }
  })

  socket.on('webrtc:leave-voice', (data: { roomId: string; userId: string }) => {
    try {
      const { roomId, userId } = data
      const room = rooms.get(roomId)
      if (!room) {
        socket.emit('error', { message: 'Room not found' })
        return
      }

      room.voiceMembers.delete(userId)

      io.to(roomId).emit('webrtc:user-left-voice', {
        roomId,
        userId,
      })

      console.log(`[WEBRTC:LEAVE-VOICE] ${userId} left voice in room ${roomId}. Voice members: ${room.voiceMembers.size}`)
    } catch (error) {
      console.error('[WEBRTC:LEAVE-VOICE] Error:', error)
      socket.emit('error', { message: 'Failed to leave voice chat' })
    }
  })

  socket.on('webrtc:offer', (data: { roomId: string; targetUserId: string; offer: RTCSessionDescriptionInit }) => {
    try {
      const { roomId, targetUserId, offer } = data
      const room = rooms.get(roomId)
      if (!room) {
        socket.emit('error', { message: 'Room not found' })
        return
      }

      const senderId = socketToUser.get(socket.id)
      if (!senderId) {
        socket.emit('error', { message: 'Not authenticated' })
        return
      }

      // Find target user's socket
      const targetMember = room.members.get(targetUserId)
      if (!targetMember) {
        socket.emit('error', { message: 'Target user not found in room' })
        return
      }

      io.to(targetMember.socketId).emit('webrtc:offer', {
        roomId,
        senderUserId: senderId,
        offer,
      })

      console.log(`[WEBRTC:OFFER] ${senderId} -> ${targetUserId} in room ${roomId}`)
    } catch (error) {
      console.error('[WEBRTC:OFFER] Error:', error)
      socket.emit('error', { message: 'Failed to send WebRTC offer' })
    }
  })

  socket.on('webrtc:answer', (data: { roomId: string; targetUserId: string; answer: RTCSessionDescriptionInit }) => {
    try {
      const { roomId, targetUserId, answer } = data
      const room = rooms.get(roomId)
      if (!room) {
        socket.emit('error', { message: 'Room not found' })
        return
      }

      const senderId = socketToUser.get(socket.id)
      if (!senderId) {
        socket.emit('error', { message: 'Not authenticated' })
        return
      }

      const targetMember = room.members.get(targetUserId)
      if (!targetMember) {
        socket.emit('error', { message: 'Target user not found in room' })
        return
      }

      io.to(targetMember.socketId).emit('webrtc:answer', {
        roomId,
        senderUserId: senderId,
        answer,
      })

      console.log(`[WEBRTC:ANSWER] ${senderId} -> ${targetUserId} in room ${roomId}`)
    } catch (error) {
      console.error('[WEBRTC:ANSWER] Error:', error)
      socket.emit('error', { message: 'Failed to send WebRTC answer' })
    }
  })

  socket.on('webrtc:ice-candidate', (data: { roomId: string; targetUserId: string; candidate: RTCIceCandidateInit }) => {
    try {
      const { roomId, targetUserId, candidate } = data
      const room = rooms.get(roomId)
      if (!room) {
        socket.emit('error', { message: 'Room not found' })
        return
      }

      const senderId = socketToUser.get(socket.id)
      if (!senderId) {
        socket.emit('error', { message: 'Not authenticated' })
        return
      }

      const targetMember = room.members.get(targetUserId)
      if (!targetMember) {
        // Target might have disconnected, silently ignore
        return
      }

      io.to(targetMember.socketId).emit('webrtc:ice-candidate', {
        roomId,
        senderUserId: senderId,
        candidate,
      })

      // Don't log ICE candidates (too noisy)
    } catch (error) {
      console.error('[WEBRTC:ICE-CANDIDATE] Error:', error)
      socket.emit('error', { message: 'Failed to send ICE candidate' })
    }
  })

  // ----------------------------------------------------------
  // User Presence & Utility
  // ----------------------------------------------------------

  socket.on('user:mute', (data: { roomId: string; userId: string; isMuted: boolean }) => {
    try {
      const { roomId, userId, isMuted } = data
      const room = rooms.get(roomId)
      if (!room) return

      const member = room.members.get(userId)
      if (member) {
        member.isMuted = isMuted
        io.to(roomId).emit('user:mute-update', { roomId, userId, isMuted })
      }
    } catch (error) {
      console.error('[USER:MUTE] Error:', error)
    }
  })

  socket.on('room:get-state', (data: { roomId: string }) => {
    try {
      const { roomId } = data
      const room = rooms.get(roomId)
      if (!room) {
        socket.emit('error', { message: 'Room not found' })
        return
      }

      socket.emit('room:state', {
        room: serializeRoom(room),
        currentPosition: calculateCurrentPosition(room),
      })
    } catch (error) {
      console.error('[ROOM:GET-STATE] Error:', error)
      socket.emit('error', { message: 'Failed to get room state' })
    }
  })

  socket.on('room:list', () => {
    try {
      const roomList = Array.from(rooms.values()).map((room) => ({
        id: room.id,
        name: room.name,
        memberCount: room.members.size,
        hostId: room.hostId,
        isPlaying: room.playback.isPlaying,
        currentSong: room.playback.currentSong?.title ?? null,
      }))
      socket.emit('room:list', { rooms: roomList })
    } catch (error) {
      console.error('[ROOM:LIST] Error:', error)
      socket.emit('error', { message: 'Failed to list rooms' })
    }
  })

  // ----------------------------------------------------------
  // Chat Messages (bonus feature)
  // ----------------------------------------------------------

  socket.on('chat:message', (data: { roomId: string; userId: string; userName: string; message: string }) => {
    try {
      const { roomId, userId, userName, message } = data
      const room = rooms.get(roomId)
      if (!room) {
        socket.emit('error', { message: 'Room not found' })
        return
      }

      const chatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        userId,
        userName,
        message,
        timestamp: Date.now(),
      }

      io.to(roomId).emit('chat:message', chatMessage)
    } catch (error) {
      console.error('[CHAT:MESSAGE] Error:', error)
      socket.emit('error', { message: 'Failed to send message' })
    }
  })

  // ----------------------------------------------------------
  // Disconnect & Reconnection
  // ----------------------------------------------------------

  socket.on('disconnect', (reason) => {
    try {
      const leaveInfo = removeMemberFromRoom(socket)
      if (leaveInfo) {
        const { roomId, userId, userName } = leaveInfo
        socket.leave(roomId)

        io.to(roomId).emit('room:member-left', {
          roomId,
          userId,
          userName,
          reason,
        })

        const room = rooms.get(roomId)
        if (room) {
          io.to(roomId).emit('room:update', serializeRoom(room))
        }

        console.log(`[DISCONNECT] ${userName} (${userId}) disconnected from room ${roomId}. Reason: ${reason}`)
      } else {
        console.log(`[DISCONNECT] Socket ${socket.id} disconnected. Reason: ${reason}`)
      }
    } catch (error) {
      console.error('[DISCONNECT] Error:', error)
    }
  })

  socket.on('error', (error) => {
    console.error(`[SOCKET ERROR] Socket ${socket.id}:`, error)
  })
})

// ============================================================
// Periodic Cleanup (every 5 minutes)
// ============================================================

setInterval(() => {
  const now = Date.now()
  for (const [roomId, room] of rooms.entries()) {
    // Remove stale members (no activity for 10 minutes)
    for (const [userId, member] of room.members.entries()) {
      const socketExists = io.sockets.sockets.has(member.socketId)
      if (!socketExists && now - member.joinedAt > 10 * 60 * 1000) {
        room.members.delete(userId)
        room.voiceMembers.delete(userId)
        console.log(`[CLEANUP] Removed stale member ${userId} from room ${roomId}`)
      }
    }

    // Delete empty rooms
    if (room.members.size === 0) {
      rooms.delete(roomId)
      console.log(`[CLEANUP] Deleted empty room ${roomId}`)
    }
  }
}, 5 * 60 * 1000)

// ============================================================
// Start Server
// ============================================================

const PORT = 3003

httpServer.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║   🎵 Syncora Sync Service                    ║
║   Socket.io server running on port ${PORT}       ║
║   Path: /                                    ║
║   CORS: *                                    ║
╚══════════════════════════════════════════════╝
  `)
})

// ============================================================
// Graceful Shutdown
// ============================================================

const gracefulShutdown = () => {
  console.log('\n[SHUTDOWN] Graceful shutdown initiated...')

  // Notify all connected clients
  io.emit('server:shutdown', {
    message: 'Server is shutting down',
    timestamp: Date.now(),
  })

  io.disconnectSockets(true)

  httpServer.close(() => {
    console.log('[SHUTDOWN] HTTP server closed')
    process.exit(0)
  })

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('[SHUTDOWN] Forced shutdown after timeout')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)

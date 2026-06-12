'use client'

import { useEffect, useRef, useCallback } from 'react'
import { getSocket, disconnectSocket } from '@/lib/socket'
import { useAppStore } from '@/lib/stores/useAppStore'
import { usePlayerStore } from '@/lib/stores/usePlayerStore'
import { useRoomStore } from '@/lib/stores/useRoomStore'
import type { Socket } from 'socket.io-client'

export function useSocket() {
  const { user, currentRoomId, setCurrentRoomId } = useAppStore()
  const { currentSong, isPlaying, setPosition, play, pause, seek } = usePlayerStore()
  const {
    setRoom,
    addMember,
    removeMember,
    setPlayback,
    setCurrentSong,
    setQueue,
    setHostId,
    setSyncStatus,
    addVoiceMember,
    removeVoiceMember,
    setMuted: setRoomMemberMuted,
  } = useRoomStore()

  const socketRef = useRef<Socket | null>(null)
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Simulate position advancement when playing (for demo without real audio)
  useEffect(() => {
    if (isPlaying && currentSong) {
      if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current)
      playbackIntervalRef.current = setInterval(() => {
        setPosition(usePlayerStore.getState().position + 1000)
      }, 1000)
    } else {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current)
        playbackIntervalRef.current = null
      }
    }
    return () => {
      if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current)
    }
  }, [isPlaying, currentSong, setPosition])

  // Check if song ended - use position from store subscription
  const position = usePlayerStore((s) => s.position)
  useEffect(() => {
    if (currentSong && position >= currentSong.duration * 1000) {
      usePlayerStore.getState().next()
    }
  }, [position, currentSong])

  const joinRoom = useCallback(
    (roomId: string, roomName?: string) => {
      const socket = socketRef.current
      if (!socket || !user) return

      socket.emit('room:join', {
        roomId,
        roomName: roomName || '',
        userId: user.id,
        userName: user.name,
        userImage: user.image,
      })
    },
    [user]
  )

  const leaveRoom = useCallback(
    (roomId: string) => {
      const socket = socketRef.current
      if (!socket || !user) return

      socket.emit('room:leave', {
        roomId,
        userId: user.id,
      })
    },
    [user]
  )

  const emitPlay = useCallback(
    (roomId: string, song: any, position: number) => {
      const socket = socketRef.current
      if (!socket) return
      socket.emit('music:play', { roomId, song, position, timestamp: Date.now() })
    },
    []
  )

  const emitPause = useCallback(
    (roomId: string, position: number) => {
      const socket = socketRef.current
      if (!socket) return
      socket.emit('music:pause', { roomId, position, timestamp: Date.now() })
    },
    []
  )

  const emitSeek = useCallback(
    (roomId: string, position: number) => {
      const socket = socketRef.current
      if (!socket) return
      socket.emit('music:seek', { roomId, position, timestamp: Date.now() })
    },
    []
  )

  const emitTrackChange = useCallback(
    (roomId: string, song: any, position: number) => {
      const socket = socketRef.current
      if (!socket) return
      socket.emit('music:track-change', { roomId, song, position, timestamp: Date.now() })
    },
    []
  )

  const emitAddToQueue = useCallback(
    (roomId: string, song: any, addedBy: string) => {
      const socket = socketRef.current
      if (!socket) return
      socket.emit('queue:add', { roomId, song, addedBy })
    },
    []
  )

  const emitRemoveFromQueue = useCallback(
    (roomId: string, songId: string) => {
      const socket = socketRef.current
      if (!socket) return
      socket.emit('queue:remove', { roomId, songId })
    },
    []
  )

  const requestSync = useCallback(
    (roomId: string) => {
      const socket = socketRef.current
      if (!socket) return
      socket.emit('music:sync-request', { roomId })
    },
    []
  )

  const emitJoinVoice = useCallback(
    (roomId: string, userId: string) => {
      const socket = socketRef.current
      if (!socket) return
      socket.emit('webrtc:join-voice', { roomId, userId })
    },
    []
  )

  const emitLeaveVoice = useCallback(
    (roomId: string, userId: string) => {
      const socket = socketRef.current
      if (!socket) return
      socket.emit('webrtc:leave-voice', { roomId, userId })
    },
    []
  )

  const emitMute = useCallback(
    (roomId: string, userId: string, isMuted: boolean) => {
      const socket = socketRef.current
      if (!socket) return
      socket.emit('user:mute', { roomId, userId, isMuted })
    },
    []
  )

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        disconnectSocket()
        socketRef.current = null
      }
      return
    }

    const socket = getSocket()
    socketRef.current = socket

    const onConnect = () => {
      console.log('[Socket] Connected:', socket.id)
      // Rejoin room if we were in one (use roomName from store)
      const currentRoomState = useRoomStore.getState()
      if (currentRoomState.roomId) {
        joinRoom(currentRoomState.roomId, currentRoomState.roomName || undefined)
      }
    }

    const onDisconnect = () => {
      console.log('[Socket] Disconnected')
      setSyncStatus('offline')
    }

    const onRoomState = (data: any) => {
      console.log('[Socket] Room state/update:', data)
      const roomData = data.room || data
      if (roomData && roomData.id) {
        setRoom({
          id: roomData.id,
          name: roomData.name,
          code: roomData.code,
          hostId: roomData.hostId,
          members: roomData.members,
          queue: roomData.queue,
        })
        if (roomData.playback) {
          setPlayback(roomData.playback.isPlaying, roomData.playback.position || 0, roomData.playback.currentSong)
        }
      }
    }

    const onMemberJoined = (data: any) => {
      console.log('[Socket] Member joined:', data)
      addMember(data)
    }

    const onMemberLeft = (data: any) => {
      console.log('[Socket] Member left:', data)
      removeMember(data.userId)
    }

    const onHostChange = (data: any) => {
      setHostId(data.hostId)
    }

    const onMusicPlay = (data: any) => {
      console.log('[Socket] Music play:', data)
      setSyncStatus('synced')
      if (data.song) {
        play(data.song)
        if (data.position) {
          seek(data.position)
        }
      } else {
        usePlayerStore.getState().resume()
      }
    }

    const onMusicPause = (data: any) => {
      console.log('[Socket] Music pause:', data)
      pause()
      if (data.position) {
        seek(data.position)
      }
    }

    const onMusicSeek = (data: any) => {
      seek(data.position)
    }

    const onTrackChange = (data: any) => {
      console.log('[Socket] Track change:', data)
      if (data.song) {
        play(data.song)
        if (data.position) {
          seek(data.position)
        }
      }
    }

    const onMusicSync = (data: any) => {
      console.log('[Socket] Music sync:', data)
      setSyncStatus('synced')
      if (data.currentSong) {
        setCurrentSong(data.currentSong)
      }
      setPlayback(data.isPlaying, data.position || 0, data.currentSong)
      if (data.isPlaying && data.currentSong) {
        play(data.currentSong)
        seek(data.position || 0)
      } else {
        pause()
        seek(data.position || 0)
      }
    }

    const onQueueUpdated = (data: any) => {
      setQueue(data.queue || [])
    }

    const onUserMuted = (data: any) => {
      setRoomMemberMuted(data.isMuted)
    }

    const onVoiceUserJoined = (data: any) => {
      addVoiceMember(data.userId)
    }

    const onVoiceUserLeft = (data: any) => {
      removeVoiceMember(data.userId)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('room:state', onRoomState)
    socket.on('room:joined', onRoomState)
    socket.on('room:update', onRoomState)
    socket.on('room:member-joined', onMemberJoined)
    socket.on('room:member-left', onMemberLeft)
    socket.on('room:host-change', onHostChange)
    socket.on('music:play', onMusicPlay)
    socket.on('music:pause', onMusicPause)
    socket.on('music:seek', onMusicSeek)
    socket.on('music:track-change', onTrackChange)
    socket.on('music:sync', onMusicSync)
    socket.on('queue:updated', onQueueUpdated)
    socket.on('user:muted', onUserMuted)
    socket.on('webrtc:user-joined', onVoiceUserJoined)
    socket.on('webrtc:user-left', onVoiceUserLeft)

    if (socket.connected) {
      const currentRoomState = useRoomStore.getState()
      if (currentRoomState.roomId) {
        joinRoom(currentRoomState.roomId, currentRoomState.roomName || undefined)
      }
    }

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('room:state', onRoomState)
      socket.off('room:joined', onRoomState)
      socket.off('room:update', onRoomState)
      socket.off('room:member-joined', onMemberJoined)
      socket.off('room:member-left', onMemberLeft)
      socket.off('room:host-change', onHostChange)
      socket.off('music:play', onMusicPlay)
      socket.off('music:pause', onMusicPause)
      socket.off('music:seek', onMusicSeek)
      socket.off('music:track-change', onTrackChange)
      socket.off('music:sync', onMusicSync)
      socket.off('queue:updated', onQueueUpdated)
      socket.off('user:muted', onUserMuted)
      socket.off('webrtc:user-joined', onVoiceUserJoined)
      socket.off('webrtc:user-left', onVoiceUserLeft)
    }
  }, [user])

  return {
    joinRoom,
    leaveRoom,
    emitPlay,
    emitPause,
    emitSeek,
    emitTrackChange,
    emitAddToQueue,
    emitRemoveFromQueue,
    requestSync,
    emitJoinVoice,
    emitLeaveVoice,
    emitMute,
  }
}

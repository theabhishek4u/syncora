'use client'

import SimplePeer from 'simple-peer'
import { getSocket } from '@/lib/socket'

interface PeerConnection {
  peer: InstanceType<typeof SimplePeer>
  userId: string
  stream?: MediaStream
}

const peers: Map<string, PeerConnection> = new Map()
let localStream: MediaStream | null = null
let isMuted = false

export async function initVoiceChat(
  roomId: string,
  userId: string,
  onStream: (userId: string, stream: MediaStream) => void,
  onUserLeft: (userId: string) => void
): Promise<MediaStream | null> {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    if (isMuted) {
      localStream.getAudioTracks().forEach((track) => (track.enabled = false))
    }

    const socket = getSocket()

    socket.on('webrtc:offer', async (data: { fromUserId: string; offer: RTCSessionDescriptionInit }) => {
      if (data.fromUserId === userId) return

      const peer = new SimplePeer({
        initiator: false,
        trickle: false,
        stream: localStream || undefined,
      })

      peer.on('signal', (signal) => {
        if (signal.type === 'answer') {
          socket.emit('webrtc:answer', {
            roomId,
            targetUserId: data.fromUserId,
            answer: signal,
          })
        } else if (signal.candidate) {
          socket.emit('webrtc:ice-candidate', {
            roomId,
            targetUserId: data.fromUserId,
            candidate: signal,
          })
        }
      })

      peer.on('stream', (stream: MediaStream) => {
        onStream(data.fromUserId, stream)
      })

      peer.on('close', () => {
        peers.delete(data.fromUserId)
        onUserLeft(data.fromUserId)
      })

      peer.signal(data.offer)
      peers.set(data.fromUserId, { peer, userId: data.fromUserId })
    })

    socket.on('webrtc:answer', (data: { fromUserId: string; answer: RTCSessionDescriptionInit }) => {
      const peerConnection = peers.get(data.fromUserId)
      if (peerConnection) {
        peerConnection.peer.signal(data.answer)
      }
    })

    socket.on('webrtc:ice-candidate', (data: { fromUserId: string; candidate: any }) => {
      const peerConnection = peers.get(data.fromUserId)
      if (peerConnection) {
        peerConnection.peer.signal(data.candidate)
      }
    })

    socket.emit('webrtc:join-voice', { roomId, userId })

    return localStream
  } catch (err) {
    console.error('Failed to initialize voice chat:', err)
    return null
  }
}

export function createOfferToPeer(
  roomId: string,
  targetUserId: string
) {
  if (!localStream) return

  const socket = getSocket()
  const peer = new SimplePeer({
    initiator: true,
    trickle: false,
    stream: localStream,
  })

  peer.on('signal', (signal) => {
    if (signal.type === 'offer') {
      socket.emit('webrtc:offer', {
        roomId,
        targetUserId,
        offer: signal,
      })
    } else if (signal.candidate) {
      socket.emit('webrtc:ice-candidate', {
        roomId,
        targetUserId,
        candidate: signal,
      })
    }
  })

  peer.on('stream', (stream: MediaStream) => {
    // Remote stream received
  })

  peers.set(targetUserId, { peer, userId: targetUserId })
}

export function toggleMute(): boolean {
  isMuted = !isMuted
  if (localStream) {
    localStream.getAudioTracks().forEach((track) => (track.enabled = !isMuted))
  }
  return isMuted
}

export function leaveVoiceChat(roomId: string, userId: string) {
  const socket = getSocket()

  peers.forEach((peerConnection) => {
    peerConnection.peer.destroy()
  })
  peers.clear()

  if (localStream) {
    localStream.getAudioTracks().forEach((track) => track.stop())
    localStream = null
  }

  socket.emit('webrtc:leave-voice', { roomId, userId })

  // Clean up listeners
  socket.off('webrtc:offer')
  socket.off('webrtc:answer')
  socket.off('webrtc:ice-candidate')
}

export function getIsMuted(): boolean {
  return isMuted
}

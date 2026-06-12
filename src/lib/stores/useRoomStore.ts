'use client'

import { create } from 'zustand'

export interface RoomMember {
  socketId: string
  userId: string
  userName: string
  userImage?: string
  isMuted: boolean
  isInVoice?: boolean
}

interface RoomState {
  roomId: string | null
  roomName: string | null
  roomCode: string | null
  hostId: string | null
  members: RoomMember[]
  isPlaying: boolean
  currentSong: any | null
  position: number
  voiceMembers: string[]
  isMuted: boolean
  isInVoice: boolean
  queue: { song: any; addedBy: string }[]
  syncStatus: 'synced' | 'buffering' | 'offline'

  setRoom: (room: {
    id: string
    name: string
    code?: string
    hostId: string
    members?: RoomMember[]
    queue?: { song: any; addedBy: string }[]
  }) => void
  setMembers: (members: RoomMember[]) => void
  addMember: (member: RoomMember) => void
  removeMember: (userId: string) => void
  setPlayback: (playing: boolean, position: number, song?: any) => void
  setCurrentSong: (song: any) => void
  setMuted: (muted: boolean) => void
  setInVoice: (inVoice: boolean) => void
  setVoiceMembers: (members: string[]) => void
  addVoiceMember: (userId: string) => void
  removeVoiceMember: (userId: string) => void
  setQueue: (queue: { song: any; addedBy: string }[]) => void
  addToQueue: (item: { song: any; addedBy: string }) => void
  removeFromQueue: (songId: string) => void
  setHostId: (hostId: string) => void
  setSyncStatus: (status: 'synced' | 'buffering' | 'offline') => void
  reset: () => void
}

const initialState = {
  roomId: null,
  roomName: null,
  roomCode: null,
  hostId: null,
  members: [] as RoomMember[],
  isPlaying: false,
  currentSong: null,
  position: 0,
  voiceMembers: [] as string[],
  isMuted: false,
  isInVoice: false,
  queue: [] as { song: any; addedBy: string }[],
  syncStatus: 'synced' as const,
}

export const useRoomStore = create<RoomState>((set) => ({
  ...initialState,

  setRoom: (room) =>
    set({
      roomId: room.id,
      roomName: room.name,
      roomCode: room.code || null,
      hostId: room.hostId,
      members: room.members || [],
      queue: room.queue || [],
    }),

  setMembers: (members) => set({ members }),

  addMember: (member) =>
    set((state) => ({
      members: [...state.members.filter((m) => m.userId !== member.userId), member],
    })),

  removeMember: (userId) =>
    set((state) => ({
      members: state.members.filter((m) => m.userId !== userId),
      voiceMembers: state.voiceMembers.filter((id) => id !== userId),
    })),

  setPlayback: (playing, position, song) =>
    set((state) => ({
      isPlaying: playing,
      position,
      ...(song ? { currentSong: song } : {}),
    })),

  setCurrentSong: (song) => set({ currentSong: song }),

  setMuted: (muted) => set({ isMuted: muted }),

  setInVoice: (inVoice) => set({ isInVoice: inVoice }),

  setVoiceMembers: (members) => set({ voiceMembers: members }),

  addVoiceMember: (userId) =>
    set((state) => ({
      voiceMembers: state.voiceMembers.includes(userId)
        ? state.voiceMembers
        : [...state.voiceMembers, userId],
    })),

  removeVoiceMember: (userId) =>
    set((state) => ({
      voiceMembers: state.voiceMembers.filter((id) => id !== userId),
    })),

  setQueue: (queue) => set({ queue }),

  addToQueue: (item) =>
    set((state) => ({ queue: [...state.queue, item] })),

  removeFromQueue: (songId) =>
    set((state) => ({ queue: state.queue.filter((item) => item.song.id !== songId) })),

  setHostId: (hostId) => set({ hostId }),

  setSyncStatus: (status) => set({ syncStatus: status }),

  reset: () => set(initialState),
}))

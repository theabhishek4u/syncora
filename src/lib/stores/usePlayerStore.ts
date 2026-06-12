'use client'

import { create } from 'zustand'

export interface Song {
  id: string
  title: string
  artist: string
  album?: string
  duration: number // seconds
  coverUrl?: string
  audioUrl?: string
}

interface QueueItem {
  song: Song
  addedBy: string
}

interface PlayerState {
  currentSong: Song | null
  isPlaying: boolean
  position: number // ms
  volume: number // 0-1
  queue: QueueItem[]
  queueIndex: number
  repeat: 'off' | 'one' | 'all'
  shuffle: boolean
  audioElement: HTMLAudioElement | null
  play: (song: Song) => void
  pause: () => void
  resume: () => void
  seek: (position: number) => void
  next: () => void
  previous: () => void
  setVolume: (volume: number) => void
  setQueue: (queue: QueueItem[]) => void
  addToQueue: (item: QueueItem) => void
  removeFromQueue: (songId: string) => void
  toggleRepeat: () => void
  toggleShuffle: () => void
  setPosition: (position: number) => void
  setIsPlaying: (playing: boolean) => void
  setAudioElement: (audio: HTMLAudioElement | null) => void
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  isPlaying: false,
  position: 0,
  volume: 0.7,
  queue: [],
  queueIndex: -1,
  repeat: 'off',
  shuffle: false,
  audioElement: null,

  play: (song) => {
    set({ currentSong: song, isPlaying: true, position: 0 })
    const audio = get().audioElement
    if (audio) {
      if (song.audioUrl) {
        audio.src = song.audioUrl
        audio.play().catch(() => {})
      } else {
        // Simulated playback - start a timer
        audio.pause()
      }
    }
  },

  pause: () => {
    set({ isPlaying: false })
    const audio = get().audioElement
    if (audio) {
      audio.pause()
    }
  },

  resume: () => {
    set({ isPlaying: true })
    const audio = get().audioElement
    if (audio && audio.src) {
      audio.play().catch(() => {})
    }
  },

  seek: (position) => {
    set({ position })
    const audio = get().audioElement
    if (audio && audio.src) {
      audio.currentTime = position / 1000
    }
  },

  next: () => {
    const { queue, queueIndex, repeat, shuffle } = get()
    if (queue.length === 0) return

    let nextIndex: number
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * queue.length)
    } else if (repeat === 'one') {
      nextIndex = queueIndex
    } else {
      nextIndex = queueIndex + 1
      if (nextIndex >= queue.length) {
        if (repeat === 'all') {
          nextIndex = 0
        } else {
          set({ isPlaying: false })
          return
        }
      }
    }

    const nextSong = queue[nextIndex]?.song
    if (nextSong) {
      set({ currentSong: nextSong, queueIndex: nextIndex, position: 0, isPlaying: true })
      const audio = get().audioElement
      if (audio && nextSong.audioUrl) {
        audio.src = nextSong.audioUrl
        audio.play().catch(() => {})
      }
    }
  },

  previous: () => {
    const { queue, queueIndex, position } = get()
    if (queue.length === 0) return

    // If we're more than 3 seconds in, restart the current song
    if (position > 3000) {
      set({ position: 0 })
      const audio = get().audioElement
      if (audio) audio.currentTime = 0
      return
    }

    const prevIndex = Math.max(0, queueIndex - 1)
    const prevSong = queue[prevIndex]?.song
    if (prevSong) {
      set({ currentSong: prevSong, queueIndex: prevIndex, position: 0, isPlaying: true })
      const audio = get().audioElement
      if (audio && prevSong.audioUrl) {
        audio.src = prevSong.audioUrl
        audio.play().catch(() => {})
      }
    }
  },

  setVolume: (volume) => {
    set({ volume })
    const audio = get().audioElement
    if (audio) {
      audio.volume = volume
    }
  },

  setQueue: (queue) => {
    set({ queue, queueIndex: queue.length > 0 ? 0 : -1 })
  },

  addToQueue: (item) => {
    const { queue } = get()
    set({ queue: [...queue, item] })
  },

  removeFromQueue: (songId) => {
    const { queue, queueIndex, currentSong } = get()
    const newQueue = queue.filter((item) => item.song.id !== songId)
    const newIndex = currentSong
      ? newQueue.findIndex((item) => item.song.id === currentSong.id)
      : -1
    set({ queue: newQueue, queueIndex: newIndex })
  },

  toggleRepeat: () => {
    const { repeat } = get()
    const next = repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off'
    set({ repeat: next })
  },

  toggleShuffle: () => {
    set((state) => ({ shuffle: !state.shuffle }))
  },

  setPosition: (position) => set({ position }),

  setIsPlaying: (playing) => set({ isPlaying: playing }),

  setAudioElement: (audio) => {
    if (audio) {
      audio.volume = get().volume
    }
    set({ audioElement: audio })
  },
}))

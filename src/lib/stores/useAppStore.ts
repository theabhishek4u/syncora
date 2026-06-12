'use client'

import { create } from 'zustand'

export type AppView = 'landing' | 'dashboard' | 'room'

interface UserProfile {
  id: string
  name: string
  email: string
  image: string
}

interface AppState {
  view: AppView
  user: UserProfile | null
  currentRoomId: string | null
  sidebarSection: 'home' | 'search' | 'library'
  setView: (view: AppView) => void
  setUser: (user: UserProfile | null) => void
  setCurrentRoomId: (id: string | null) => void
  setSidebarSection: (section: 'home' | 'search' | 'library') => void
  logout: () => void
}

export const useAppStore = create<AppState>((set) => ({
  view: 'landing',
  user: null,
  currentRoomId: null,
  sidebarSection: 'home',
  setView: (view) => set({ view }),
  setUser: (user) => set({ user, view: user ? 'dashboard' : 'landing' }),
  setCurrentRoomId: (id) => set({ currentRoomId: id, view: id ? 'room' : 'dashboard' }),
  setSidebarSection: (section) => set({ sidebarSection: section }),
  logout: () => set({ user: null, currentRoomId: null, view: 'landing', sidebarSection: 'home' }),
}))

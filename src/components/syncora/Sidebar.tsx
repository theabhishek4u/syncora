'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Home,
  Search,
  Library,
  Plus,
  LogIn,
  Music,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { useAppStore } from '@/lib/stores/useAppStore'
import { usePlayerStore } from '@/lib/stores/usePlayerStore'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CreateRoomDialog } from './CreateRoomDialog'
import { JoinRoomDialog } from './JoinRoomDialog'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

export function Sidebar() {
  const { user, sidebarSection, setSidebarSection, setCurrentRoomId, logout } = useAppStore()
  const [createRoomOpen, setCreateRoomOpen] = useState(false)
  const [joinRoomOpen, setJoinRoomOpen] = useState(false)
  const [playlists, setPlaylists] = useState<any[]>([])

  useEffect(() => {
    if (user) {
      fetch(`/api/playlists?userId=${user.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setPlaylists(data.data)
        })
        .catch(() => {})
    }
  }, [user])

  const handleLogout = useCallback(() => {
    logout()
    toast.success('Logged out successfully')
  }, [logout])

  const navItems = [
    { id: 'home' as const, icon: Home, label: 'Home' },
    { id: 'search' as const, icon: Search, label: 'Search' },
    { id: 'library' as const, icon: Library, label: 'Library' },
  ]

  return (
    <div className="w-60 h-full bg-black flex flex-col border-r border-white/5 flex-shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg gradient-emerald flex items-center justify-center">
          <Music className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-bold text-white tracking-tight">Syncora</span>
      </div>

      {/* Navigation */}
      <nav className="px-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setSidebarSection(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              sidebarSection === item.id
                ? 'bg-white/10 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </button>
        ))}
      </nav>

      <Separator className="my-3 bg-white/5" />

      {/* Room Actions */}
      <div className="px-3 space-y-2">
        <Button
          onClick={() => setCreateRoomOpen(true)}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Create Room
        </Button>
        <Button
          onClick={() => setJoinRoomOpen(true)}
          variant="outline"
          className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm"
          size="sm"
        >
          <LogIn className="h-4 w-4 mr-1.5" />
          Join Room
        </Button>
      </div>

      <Separator className="my-3 bg-white/5" />

      {/* Playlists */}
      <div className="flex-1 min-h-0 px-3">
        <div className="flex items-center justify-between px-3 mb-2">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Playlists
          </span>
        </div>
        <ScrollArea className="h-[calc(100%-28px)]">
          <div className="space-y-0.5">
            {playlists.length === 0 ? (
              <p className="text-xs text-zinc-600 px-3 py-2">No playlists yet</p>
            ) : (
              playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => setSidebarSection('library')}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Music className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{playlist.name}</span>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* User profile */}
      {user && (
        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.image} />
              <AvatarFallback className="bg-emerald-900/50 text-emerald-300 text-xs">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-zinc-500 truncate">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded-md transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <CreateRoomDialog open={createRoomOpen} onOpenChange={setCreateRoomOpen} />
      <JoinRoomDialog open={joinRoomOpen} onOpenChange={setJoinRoomOpen} />
    </div>
  )
}

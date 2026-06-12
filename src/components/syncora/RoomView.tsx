'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Music,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Radio,
  Users,
  Crown,
  ArrowLeft,
  Plus,
  Search,
} from 'lucide-react'
import { useAppStore } from '@/lib/stores/useAppStore'
import { usePlayerStore } from '@/lib/stores/usePlayerStore'
import { useRoomStore } from '@/lib/stores/useRoomStore'
import { useSocket } from '@/hooks/useSocket'
import { VoiceChat } from './VoiceChat'
import { QueueView } from './QueueView'
import { SongCard } from './SongCard'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

export function RoomView() {
  const { user, setCurrentRoomId } = useAppStore()
  const { currentSong, isPlaying, play, pause, resume, next, previous, addToQueue } = usePlayerStore()
  const {
    roomId,
    roomName,
    roomCode,
    hostId,
    members,
    syncStatus,
    queue,
    setRoom,
  } = useRoomStore()
  const { joinRoom, leaveRoom, emitPlay, emitPause, emitTrackChange, emitAddToQueue, requestSync } = useSocket()

  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])

  // Join room via socket when entering room view
  useEffect(() => {
    if (roomId && user) {
      // Fetch room data from API first, then join socket with room name
      fetch(`/api/rooms/${roomId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            const room = data.data
            // Update room store with actual room data from DB
            setRoom({
              id: room.id,
              name: room.name,
              code: room.code,
              hostId: room.hostId,
              members: room.members?.map((m: any) => ({
                socketId: '',
                userId: m.user?.id || m.userId,
                userName: m.user?.name || 'Unknown',
                userImage: m.user?.image,
                isMuted: m.isMuted || false,
              })) || [],
            })
            // Join socket room with room name
            joinRoom(roomId, room.name)
          } else {
            joinRoom(roomId)
          }
          requestSync(roomId)
        })
        .catch(() => {
          joinRoom(roomId)
          requestSync(roomId)
        })
    }

    return () => {
      if (roomId && user) {
        leaveRoom(roomId)
      }
    }
  }, [roomId, user, joinRoom, leaveRoom, requestSync, setRoom])

  // Search songs to add to queue
  useEffect(() => {
    if (!searchQuery.trim()) {
      return
    }

    const timer = setTimeout(() => {
      fetch(`/api/songs?page=1&limit=10&search=${encodeURIComponent(searchQuery.trim())}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setSearchResults(data.data.songs || [])
        })
        .catch(() => {})
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleLeaveRoom = useCallback(() => {
    if (roomId) {
      leaveRoom(roomId)
    }
    setCurrentRoomId(null)
  }, [roomId, leaveRoom, setCurrentRoomId])

  const handlePlayPause = useCallback(() => {
    if (!roomId) return
    if (isPlaying) {
      emitPause(roomId, usePlayerStore.getState().position)
      pause()
    } else {
      if (currentSong) {
        emitPlay(roomId, currentSong, usePlayerStore.getState().position)
        resume()
      }
    }
  }, [roomId, isPlaying, currentSong, emitPlay, emitPause, pause, resume])

  const handleAddToQueue = useCallback(
    (song: any) => {
      if (!roomId || !user) return
      addToQueue({ song, addedBy: user.id })
      emitAddToQueue(roomId, song, user.id)
      toast.success(`Added "${song.title}" to queue`)
    },
    [roomId, user, addToQueue, emitAddToQueue]
  )

  const handlePlaySong = useCallback(
    (song: any) => {
      if (!roomId) return
      play(song)
      emitTrackChange(roomId, song, 0)
    },
    [roomId, play, emitTrackChange]
  )

  const isHost = user?.id === hostId

  return (
    <div className="flex h-full">
      {/* Compact sidebar for room */}
      <div className="w-16 bg-black border-r border-white/5 flex flex-col items-center py-4 gap-4 flex-shrink-0">
        <button
          onClick={handleLeaveRoom}
          className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          title="Leave Room"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="w-8 h-8 rounded-lg gradient-emerald flex items-center justify-center">
          <Music className="h-4 w-4 text-white" />
        </div>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className={`p-2 rounded-lg transition-colors ${showSearch ? 'text-emerald-500 bg-white/5' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
          title="Add Songs"
        >
          <Search className="h-5 w-5" />
        </button>
        <div className="flex-1" />
        <button
          onClick={() => {
            if (roomCode) {
              navigator.clipboard.writeText(roomCode)
              toast.success('Room code copied!')
            }
          }}
          className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          title="Copy Room Code"
        >
          <Radio className="h-5 w-5" />
        </button>
      </div>

      {/* Main room content */}
      <div className="flex-1 flex min-w-0">
        {/* Center: Now playing + Queue */}
        <div className="flex-1 flex flex-col min-w-0">
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {/* Room header */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-white">{roomName || 'Room'}</h1>
                    {isHost && (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                        <Crown className="h-3 w-3 mr-1" />
                        Host
                      </Badge>
                    )}
                  </div>
                  {roomCode && (
                    <p className="text-xs text-zinc-500 mt-1">
                      Room Code: <span className="font-mono text-zinc-400">{roomCode}</span>
                    </p>
                  )}
                </div>
                {/* Sync indicator */}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      syncStatus === 'synced'
                        ? 'bg-emerald-500 animate-sync-pulse'
                        : syncStatus === 'buffering'
                          ? 'bg-yellow-500 animate-sync-pulse'
                          : 'bg-red-500'
                    }`}
                  />
                  <span className="text-xs text-zinc-400">
                    {syncStatus === 'synced' ? 'Synced' : syncStatus === 'buffering' ? 'Syncing...' : 'Offline'}
                  </span>
                </div>
              </div>

              {/* Now Playing - Large display */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative rounded-2xl overflow-hidden"
              >
                <div className="absolute inset-0 gradient-hero opacity-80" />
                <div className="relative p-8 flex items-center gap-8">
                  {/* Cover art */}
                  <div className="w-48 h-48 rounded-xl overflow-hidden flex-shrink-0 shadow-2xl shadow-black/50">
                    {currentSong?.coverUrl ? (
                      <img
                        src={currentSong.coverUrl}
                        alt={currentSong.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-900/60 to-zinc-900 flex items-center justify-center">
                        <Music className="h-16 w-16 text-emerald-500/40" />
                      </div>
                    )}
                  </div>

                  {/* Song info + controls */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-emerald-400 uppercase tracking-wider mb-1">
                      Now Playing
                    </p>
                    <h2 className="text-3xl font-bold text-white truncate mb-1">
                      {currentSong?.title || 'No song playing'}
                    </h2>
                    <p className="text-lg text-zinc-400 truncate mb-6">
                      {currentSong?.artist || 'Select a song to start'}
                    </p>

                    {/* Playback controls */}
                    <div className="flex items-center gap-4">
                      <button
                        onClick={previous}
                        className="p-2 text-zinc-400 hover:text-white transition-colors"
                      >
                        <SkipBack className="h-5 w-5" fill="currentColor" />
                      </button>
                      <button
                        onClick={handlePlayPause}
                        disabled={!currentSong}
                        className="w-12 h-12 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50"
                      >
                        {isPlaying ? (
                          <Pause className="h-6 w-6 text-black" fill="black" />
                        ) : (
                          <Play className="h-6 w-6 text-black ml-1" fill="black" />
                        )}
                      </button>
                      <button
                        onClick={next}
                        className="p-2 text-zinc-400 hover:text-white transition-colors"
                      >
                        <SkipForward className="h-5 w-5" fill="currentColor" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Search panel (toggle) */}
              <AnimatePresence>
                {showSearch && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-3">
                      <Input
                        placeholder="Search songs to add to queue..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                      />
                      <div className="space-y-1 max-h-60 overflow-y-auto">
                        {searchResults.map((song) => (
                          <div
                            key={song.id}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 group cursor-pointer"
                            onClick={() => handlePlaySong(song)}
                          >
                            <div className="w-8 h-8 rounded-md overflow-hidden flex-shrink-0 bg-white/5">
                              {song.coverUrl ? (
                                <img src={song.coverUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-emerald-900/40 to-zinc-900 flex items-center justify-center">
                                  <Music className="h-3 w-3 text-emerald-500/60" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white truncate">{song.title}</p>
                              <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAddToQueue(song)
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-emerald-400 transition-all"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Queue */}
              <QueueView />
            </div>
          </ScrollArea>
        </div>

        {/* Right: Members panel */}
        <div className="w-72 bg-zinc-900/50 border-l border-white/5 flex flex-col flex-shrink-0 hidden md:flex">
          {/* Members */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-4 border-b border-white/5">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-500" />
                Members
                <span className="text-xs text-zinc-500 font-normal">({members.length})</span>
              </h3>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-1">
                {members.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.userImage} />
                      <AvatarFallback className="bg-emerald-900/50 text-emerald-300 text-xs">
                        {member.userName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm text-white truncate">{member.userName}</p>
                        {member.userId === hostId && (
                          <Crown className="h-3 w-3 text-amber-400 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                    {member.isMuted && (
                      <span className="text-[10px] text-zinc-500">muted</span>
                    )}
                  </div>
                ))}
                {members.length === 0 && (
                  <div className="text-center py-6">
                    <Users className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                    <p className="text-xs text-zinc-500">No members yet</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Voice Chat */}
          <Separator className="bg-white/5" />
          <div className="flex-shrink-0">
            <VoiceChat />
          </div>
        </div>
      </div>
    </div>
  )
}

function Separator({ className }: { className?: string }) {
  return <div className={`h-px ${className || 'bg-white/5'}`} />
}

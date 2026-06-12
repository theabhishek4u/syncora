'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/stores/useAppStore'
import { usePlayerStore } from '@/lib/stores/usePlayerStore'
import { SongCard } from './SongCard'
import { RoomCard } from './RoomCard'
import { motion } from 'framer-motion'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

export function HomeView() {
  const { user, setCurrentRoomId } = useAppStore()
  const { play, setQueue, addToQueue } = usePlayerStore()
  const [songs, setSongs] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [recentlyPlayed, setRecentlyPlayed] = useState<any[]>([])

  useEffect(() => {
    // Fetch songs
    fetch('/api/songs?page=1&limit=20')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setSongs(data.data.songs || [])
      })
      .catch(() => {})

    // Fetch rooms
    if (user) {
      fetch(`/api/rooms?userId=${user.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setRooms(data.data || [])
        })
        .catch(() => {})

      // Fetch history
      fetch(`/api/history?userId=${user.id}&limit=10`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            const historySongs = data.data.map((h: any) => h.song).filter(Boolean)
            setRecentlyPlayed(historySongs)
          }
        })
        .catch(() => {})
    }
  }, [user])

  const handlePlaySong = useCallback(
    (song: any) => {
      play(song)
      // Record to history
      if (user) {
        fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, songId: song.id, duration: 0 }),
        }).catch(() => {})
      }
    },
    [play, user]
  )

  const handlePlayAll = useCallback(
    (songList: any[]) => {
      if (songList.length > 0) {
        setQueue(songList.map((s) => ({ song: s, addedBy: user?.id || '' })))
        play(songList[0])
      }
    },
    [play, setQueue, user]
  )

  const handleJoinRoom = useCallback(
    (roomId: string) => {
      setCurrentRoomId(roomId)
    },
    [setCurrentRoomId]
  )

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  // Shuffle songs for recommendations
  const recommendedSongs = [...songs].sort(() => Math.random() - 0.5).slice(0, 10)
  const quickPicks = [...songs].sort(() => Math.random() - 0.5).slice(0, 6)

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 space-y-8">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-white">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'Listener'}
          </h1>
          <p className="text-zinc-400 mt-1">What do you want to listen to?</p>
        </motion.div>

        {/* Quick Picks - Grid of 6 cards */}
        {quickPicks.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h2 className="text-xl font-bold text-white mb-4">Quick Picks</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {quickPicks.map((song) => (
                <button
                  key={song.id}
                  onClick={() => handlePlaySong(song)}
                  className="flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-lg overflow-hidden transition-all group"
                >
                  <div className="w-16 h-16 flex-shrink-0">
                    {song.coverUrl ? (
                      <img
                        src={song.coverUrl}
                        alt={song.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-900/40 to-zinc-900 flex items-center justify-center">
                        <span className="text-emerald-500/60 text-lg">♪</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 pr-3">
                    <p className="text-sm font-medium text-white truncate">{song.title}</p>
                    <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.section>
        )}

        {/* Recently Played */}
        {recentlyPlayed.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-white mb-4">Recently Played</h2>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {recentlyPlayed.map((song: any) => (
                <SongCard key={song.id} song={song} onPlay={handlePlaySong} />
              ))}
            </div>
          </section>
        )}

        {/* Recommended */}
        {recommendedSongs.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Recommended For You</h2>
              <button
                onClick={() => handlePlayAll(recommendedSongs)}
                className="text-sm text-emerald-500 hover:text-emerald-400 transition-colors"
              >
                Play All
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {recommendedSongs.map((song) => (
                <SongCard key={song.id} song={song} onPlay={handlePlaySong} />
              ))}
            </div>
          </section>
        )}

        {/* Active Rooms */}
        {rooms.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-white mb-4">Your Rooms</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {rooms.map((room: any) => (
                <RoomCard
                  key={room.id}
                  room={{
                    id: room.id,
                    name: room.name,
                    description: room.description,
                    memberCount: room._count?.members || 0,
                    hostName: room.host?.name,
                    isActive: room.isActive,
                  }}
                  onJoin={handleJoinRoom}
                />
              ))}
            </div>
          </section>
        )}

        {/* Browse All Songs */}
        {songs.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-white mb-4">Browse Songs</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {songs.slice(0, 18).map((song) => (
                <SongCard key={song.id} song={song} onPlay={handlePlaySong} size="sm" />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search as SearchIcon, Music, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { usePlayerStore } from '@/lib/stores/usePlayerStore'
import { useAppStore } from '@/lib/stores/useAppStore'
import { useRoomStore } from '@/lib/stores/useRoomStore'
import { SongCard } from './SongCard'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

const GENRES = [
  { name: 'Pop', color: 'from-pink-600/40 to-pink-900/20', emoji: '🎤' },
  { name: 'Rock', color: 'from-red-600/40 to-red-900/20', emoji: '🎸' },
  { name: 'Hip-Hop', color: 'from-amber-600/40 to-amber-900/20', emoji: '🎤' },
  { name: 'Electronic', color: 'from-cyan-600/40 to-cyan-900/20', emoji: '🎹' },
  { name: 'R&B', color: 'from-purple-600/40 to-purple-900/20', emoji: '🎵' },
  { name: 'Jazz', color: 'from-yellow-600/40 to-yellow-900/20', emoji: '🎷' },
  { name: 'Classical', color: 'from-emerald-600/40 to-emerald-900/20', emoji: '🎻' },
  { name: 'Indie', color: 'from-teal-600/40 to-teal-900/20', emoji: '🎪' },
]

export function SearchView() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [allSongs, setAllSongs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const { play, addToQueue } = usePlayerStore()
  const { user } = useAppStore()
  const { roomId, queue } = useRoomStore()

  // Load all songs on mount
  useEffect(() => {
    fetch('/api/songs?page=1&limit=50')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setAllSongs(data.data.songs || [])
      })
      .catch(() => {})
  }, [])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!query.trim()) {
      return
    }

    debounceRef.current = setTimeout(() => {
      setLoading(true)
      fetch(`/api/songs?page=1&limit=20&search=${encodeURIComponent(query.trim())}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setResults(data.data.songs || [])
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const handlePlay = useCallback(
    (song: any) => {
      play(song)
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

  const handleAddToQueue = useCallback(
    (song: any) => {
      addToQueue({ song, addedBy: user?.id || '' })
      toast.success(`Added "${song.title}" to queue`)
    },
    [addToQueue, user]
  )

  const handleGenreClick = useCallback(
    (genre: string) => {
      setQuery(genre)
    },
    []
  )

  const displaySongs = query.trim() ? results : []

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Search input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="relative max-w-xl">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
            <Input
              placeholder="Search for songs, artists, albums..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20 text-base rounded-xl"
            />
          </div>
        </motion.div>

        {/* Search results */}
        {displaySongs.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-white mb-4">
              {loading ? 'Searching...' : `Results for "${query}"`}
            </h2>
            <div className="space-y-1">
              {displaySongs.map((song, index) => (
                <motion.div
                  key={song.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  className="flex items-center gap-4 px-4 py-2.5 rounded-lg hover:bg-white/5 group cursor-pointer transition-colors"
                  onClick={() => handlePlay(song)}
                >
                  <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 bg-white/5">
                    {song.coverUrl ? (
                      <img
                        src={song.coverUrl}
                        alt={song.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-900/40 to-zinc-900 flex items-center justify-center">
                        <Music className="h-4 w-4 text-emerald-500/60" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{song.title}</p>
                    <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
                  </div>
                  <span className="text-xs text-zinc-500">
                    {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAddToQueue(song)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-emerald-400 hover:bg-white/5 rounded-md transition-all"
                    title="Add to queue"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* No results */}
        {query.trim() && !loading && displaySongs.length === 0 && (
          <div className="text-center py-12">
            <SearchIcon className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400">No results found for &quot;{query}&quot;</p>
            <p className="text-zinc-500 text-sm mt-1">Try searching for something else</p>
          </div>
        )}

        {/* Browse categories - show when no search */}
        {!query.trim() && (
          <section>
            <h2 className="text-xl font-bold text-white mb-4">Browse Categories</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {GENRES.map((genre) => (
                <motion.button
                  key={genre.name}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleGenreClick(genre.name)}
                  className={`relative bg-gradient-to-br ${genre.color} rounded-xl p-5 h-28 flex items-end overflow-hidden`}
                >
                  <span className="text-3xl absolute top-3 right-3 opacity-60">
                    {genre.emoji}
                  </span>
                  <span className="text-base font-bold text-white">{genre.name}</span>
                </motion.button>
              ))}
            </div>
          </section>
        )}

        {/* Trending when no search */}
        {!query.trim() && allSongs.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-white mb-4">Trending Now</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {allSongs.slice(0, 12).map((song) => (
                <SongCard key={song.id} song={song} onPlay={handlePlay} size="sm" />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

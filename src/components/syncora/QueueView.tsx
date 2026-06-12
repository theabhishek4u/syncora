'use client'

import { Music, X, Plus, Play } from 'lucide-react'
import { useRoomStore } from '@/lib/stores/useRoomStore'
import { usePlayerStore } from '@/lib/stores/usePlayerStore'
import { useSocket } from '@/hooks/useSocket'
import { useAppStore } from '@/lib/stores/useAppStore'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

export function QueueView() {
  const { queue, currentSong, isPlaying, play } = usePlayerStore()
  const { roomId } = useRoomStore()
  const { user } = useAppStore()
  const { emitRemoveFromQueue, emitAddToQueue } = useSocket()

  const handleRemoveFromQueue = (songId: string) => {
    if (roomId) {
      emitRemoveFromQueue(roomId, songId)
    }
  }

  const handlePlayFromQueue = (song: any) => {
    play(song)
    if (roomId) {
      emitAddToQueue(roomId, song, user?.id || '')
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
        <Music className="h-4 w-4 text-emerald-500" />
        Queue
        {queue.length > 0 && (
          <span className="text-xs text-zinc-500 font-normal">({queue.length})</span>
        )}
      </h3>

      {/* Now Playing */}
      {currentSong && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-xs text-emerald-400 mb-2 font-medium">Now Playing</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 bg-white/5">
              {currentSong.coverUrl ? (
                <img
                  src={currentSong.coverUrl}
                  alt={currentSong.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-emerald-900/40 to-zinc-900 flex items-center justify-center">
                  <Music className="h-4 w-4 text-emerald-500/60" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{currentSong.title}</p>
              <p className="text-xs text-zinc-400 truncate">{currentSong.artist}</p>
            </div>
            {isPlaying && (
              <div className="flex items-center gap-0.5">
                <div className="w-0.5 h-3 bg-emerald-500 animate-pulse rounded-full" />
                <div className="w-0.5 h-4 bg-emerald-500 animate-pulse rounded-full" style={{ animationDelay: '0.2s' }} />
                <div className="w-0.5 h-2 bg-emerald-500 animate-pulse rounded-full" style={{ animationDelay: '0.4s' }} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Queue list */}
      {queue.length === 0 ? (
        <div className="text-center py-6">
          <Music className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-xs text-zinc-500">Queue is empty</p>
          <p className="text-xs text-zinc-600">Add songs from search to get started</p>
        </div>
      ) : (
        <div className="space-y-1 max-h-[400px] overflow-y-auto">
          <AnimatePresence>
            {queue.map((item, index) => (
              <motion.div
                key={`${item.song.id}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 group transition-colors"
              >
                <span className="text-xs text-zinc-500 w-5 text-right flex-shrink-0">
                  {index + 1}
                </span>
                <div className="w-9 h-9 rounded-md overflow-hidden flex-shrink-0 bg-white/5">
                  {item.song.coverUrl ? (
                    <img
                      src={item.song.coverUrl}
                      alt={item.song.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-900/40 to-zinc-900 flex items-center justify-center">
                      <Music className="h-3.5 w-3.5 text-emerald-500/60" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{item.song.title}</p>
                  <p className="text-xs text-zinc-400 truncate">{item.song.artist}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handlePlayFromQueue(item.song)}
                    className="p-1 text-zinc-400 hover:text-emerald-400 transition-colors"
                  >
                    <Play className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleRemoveFromQueue(item.song.id)}
                    className="p-1 text-zinc-400 hover:text-red-400 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

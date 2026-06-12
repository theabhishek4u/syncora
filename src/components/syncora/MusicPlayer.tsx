'use client'

import { useEffect, useRef, useCallback } from 'react'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Repeat1,
  Shuffle,
  Music,
  Radio,
} from 'lucide-react'
import { usePlayerStore } from '@/lib/stores/usePlayerStore'
import { useRoomStore } from '@/lib/stores/useRoomStore'
import { useAppStore } from '@/lib/stores/useAppStore'
import { Slider } from '@/components/ui/slider'
import { motion, AnimatePresence } from 'framer-motion'

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function MusicPlayer() {
  const {
    currentSong,
    isPlaying,
    position,
    volume,
    repeat,
    shuffle,
    play,
    pause,
    resume,
    seek,
    next,
    previous,
    setVolume,
    toggleRepeat,
    toggleShuffle,
    setAudioElement,
  } = usePlayerStore()

  const { syncStatus, roomId } = useRoomStore()
  const { view } = useAppStore()
  const audioRef = useRef<HTMLAudioElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (audioRef.current) {
      setAudioElement(audioRef.current)
    }
  }, [setAudioElement])

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressRef.current || !currentSong) return
      const rect = progressRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = x / rect.width
      const newPosition = percentage * currentSong.duration * 1000
      seek(newPosition)
    },
    [currentSong, seek]
  )

  const handleVolumeChange = useCallback(
    (value: number[]) => {
      setVolume(value[0] / 100)
    },
    [setVolume]
  )

  const progress = currentSong ? (position / (currentSong.duration * 1000)) * 100 : 0

  return (
    <div className="h-[90px] bg-zinc-900 border-t border-white/5 flex items-center px-4 gap-4 relative z-50">
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="none" />

      {/* Left: Song info */}
      <div className="flex items-center gap-3 w-[280px] min-w-[200px]">
        <AnimatePresence mode="wait">
          {currentSong ? (
            <motion.div
              key={currentSong.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-3"
            >
              <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                {currentSong.coverUrl ? (
                  <img
                    src={currentSong.coverUrl}
                    alt={currentSong.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-900/40 to-zinc-900 flex items-center justify-center">
                    <Music className="h-6 w-6 text-emerald-500/60" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{currentSong.title}</p>
                <p className="text-xs text-zinc-400 truncate">{currentSong.artist}</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3"
            >
              <div className="w-14 h-14 rounded-lg bg-white/5 flex items-center justify-center">
                <Music className="h-6 w-6 text-zinc-600" />
              </div>
              <div>
                <p className="text-sm text-zinc-500">No song playing</p>
                <p className="text-xs text-zinc-600">Pick a song to start</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Center: Controls */}
      <div className="flex-1 flex flex-col items-center gap-1 max-w-[600px] mx-auto">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleShuffle}
            className={`p-1 transition-colors ${
              shuffle ? 'text-emerald-500' : 'text-zinc-400 hover:text-white'
            }`}
            title={shuffle ? 'Shuffle on' : 'Shuffle off'}
          >
            <Shuffle className="h-4 w-4" />
          </button>

          <button
            onClick={previous}
            className="p-1 text-zinc-400 hover:text-white transition-colors"
            title="Previous"
          >
            <SkipBack className="h-5 w-5" fill="currentColor" />
          </button>

          <button
            onClick={() => (isPlaying ? pause() : currentSong ? resume() : null)}
            className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50"
            disabled={!currentSong}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5 text-black" fill="black" />
            ) : (
              <Play className="h-5 w-5 text-black ml-0.5" fill="black" />
            )}
          </button>

          <button
            onClick={next}
            className="p-1 text-zinc-400 hover:text-white transition-colors"
            title="Next"
          >
            <SkipForward className="h-5 w-5" fill="currentColor" />
          </button>

          <button
            onClick={toggleRepeat}
            className={`p-1 transition-colors relative ${
              repeat !== 'off' ? 'text-emerald-500' : 'text-zinc-400 hover:text-white'
            }`}
            title={
              repeat === 'off' ? 'Repeat off' : repeat === 'all' ? 'Repeat all' : 'Repeat one'
            }
          >
            {repeat === 'one' ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full flex items-center gap-2">
          <span className="text-[11px] text-zinc-400 w-10 text-right font-mono">
            {currentSong ? formatTime(position) : '0:00'}
          </span>
          <div
            ref={progressRef}
            className="player-progress flex-1"
            onClick={handleProgressClick}
          >
            <div
              className="player-progress-fill"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
          <span className="text-[11px] text-zinc-400 w-10 font-mono">
            {currentSong ? formatTime(currentSong.duration * 1000) : '0:00'}
          </span>
        </div>
      </div>

      {/* Right: Volume + extras */}
      <div className="flex items-center gap-3 w-[280px] min-w-[200px] justify-end">
        {/* Sync indicator when in room */}
        {view === 'room' && roomId && (
          <div className="flex items-center gap-1.5 mr-2">
            <Radio className="h-3.5 w-3.5 text-emerald-500" />
            <div
              className={`w-2 h-2 rounded-full ${
                syncStatus === 'synced'
                  ? 'bg-emerald-500 animate-sync-pulse'
                  : syncStatus === 'buffering'
                    ? 'bg-yellow-500 animate-sync-pulse'
                    : 'bg-red-500'
              }`}
            />
          </div>
        )}

        <button
          onClick={() => setVolume(volume === 0 ? 0.7 : 0)}
          className="p-1 text-zinc-400 hover:text-white transition-colors"
        >
          {volume === 0 ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </button>
        <div className="w-24">
          <Slider
            value={[volume * 100]}
            max={100}
            step={1}
            onValueChange={handleVolumeChange}
            className="cursor-pointer"
          />
        </div>
      </div>
    </div>
  )
}

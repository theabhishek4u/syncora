'use client'

import { Play, Music } from 'lucide-react'
import { motion } from 'framer-motion'

interface SongCardProps {
  song: {
    id: string
    title: string
    artist: string
    album?: string
    duration: number
    coverUrl?: string
    audioUrl?: string
  }
  onPlay?: (song: any) => void
  size?: 'sm' | 'md' | 'lg'
}

export function SongCard({ song, onPlay, size = 'md' }: SongCardProps) {
  const sizeClasses = {
    sm: 'w-36',
    md: 'w-44',
    lg: 'w-52',
  }

  const imageSizes = {
    sm: 'h-28',
    md: 'h-36',
    lg: 'h-44',
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${sizeClasses[size]} group cursor-pointer flex-shrink-0`}
      onClick={() => onPlay?.(song)}
    >
      <div className="relative overflow-hidden rounded-xl bg-white/5">
        <div className={`${imageSizes[size]} relative`}>
          {song.coverUrl ? (
            <img
              src={song.coverUrl}
              alt={song.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-emerald-900/40 to-zinc-900/80 flex items-center justify-center">
              <Music className="h-8 w-8 text-emerald-500/60" />
            </div>
          )}
          {/* Play button overlay */}
          <div className="song-card-overlay absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 transform group-hover:scale-110 transition-transform">
              <Play className="h-5 w-5 text-white ml-0.5" fill="white" />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-2 px-0.5">
        <p className="text-sm font-medium text-white truncate">{song.title}</p>
        <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
      </div>
    </motion.div>
  )
}

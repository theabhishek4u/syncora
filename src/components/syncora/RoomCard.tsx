'use client'

import { Users, Music, Radio } from 'lucide-react'
import { motion } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface RoomCardProps {
  room: {
    id: string
    name: string
    description?: string
    memberCount?: number
    nowPlaying?: string
    isActive?: boolean
    hostName?: string
    members?: { name: string; image?: string }[]
  }
  onJoin?: (roomId: string) => void
}

export function RoomCard({ room, onJoin }: RoomCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="group p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/8 hover:border-white/10 cursor-pointer transition-all"
      onClick={() => onJoin?.(room.id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Radio className="h-4 w-4 text-emerald-500 flex-shrink-0" />
            <h3 className="text-sm font-semibold text-white truncate">{room.name}</h3>
          </div>
          {room.description && (
            <p className="text-xs text-zinc-400 truncate mb-2">{room.description}</p>
          )}
          {room.nowPlaying && (
            <div className="flex items-center gap-1.5 mb-2">
              <Music className="h-3 w-3 text-emerald-400 flex-shrink-0" />
              <p className="text-xs text-emerald-400 truncate">{room.nowPlaying}</p>
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-zinc-500" />
              <span className="text-xs text-zinc-400">{room.memberCount || 0} listening</span>
            </div>
            {room.hostName && (
              <span className="text-xs text-zinc-500">by {room.hostName}</span>
            )}
          </div>
        </div>
        {/* Member avatars */}
        {room.members && room.members.length > 0 && (
          <div className="flex -space-x-2 ml-3">
            {room.members.slice(0, 3).map((member, i) => (
              <Avatar key={i} className="h-7 w-7 border-2 border-zinc-900">
                <AvatarImage src={member.image} />
                <AvatarFallback className="bg-emerald-900/50 text-emerald-300 text-[10px]">
                  {member.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
            {room.members.length > 3 && (
              <div className="h-7 w-7 rounded-full bg-zinc-800 border-2 border-zinc-900 flex items-center justify-center">
                <span className="text-[10px] text-zinc-400">+{room.members.length - 3}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

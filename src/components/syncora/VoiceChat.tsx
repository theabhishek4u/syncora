'use client'

import { useState, useCallback } from 'react'
import { Mic, MicOff, Phone, PhoneOff, Volume2 } from 'lucide-react'
import { useRoomStore } from '@/lib/stores/useRoomStore'
import { useAppStore } from '@/lib/stores/useAppStore'
import { useSocket } from '@/hooks/useSocket'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { initVoiceChat, leaveVoiceChat, toggleMute } from '@/lib/webrtc'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

export function VoiceChat() {
  const { user } = useAppStore()
  const { roomId, members, voiceMembers, isMuted, isInVoice, setMuted, setInVoice, addVoiceMember, removeVoiceMember } = useRoomStore()
  const { emitJoinVoice, emitLeaveVoice, emitMute } = useSocket()
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)

  const handleJoinVoice = useCallback(async () => {
    if (!roomId || !user) return

    try {
      const stream = await initVoiceChat(
        roomId,
        user.id,
        (userId, stream) => {
          // Remote stream received - could attach to audio element
          console.log('Remote stream from:', userId)
        },
        (userId) => {
          // User left voice
          removeVoiceMember(userId)
        }
      )
      if (stream) {
        setLocalStream(stream)
        setInVoice(true)
        addVoiceMember(user.id)
        emitJoinVoice(roomId, user.id)
        toast.success('Joined voice chat')
      }
    } catch {
      toast.error('Could not access microphone')
    }
  }, [roomId, user, setInVoice, addVoiceMember, emitJoinVoice, removeVoiceMember])

  const handleLeaveVoice = useCallback(() => {
    if (!roomId || !user) return

    leaveVoiceChat(roomId, user.id)
    setLocalStream(null)
    setInVoice(false)
    removeVoiceMember(user.id)
    emitLeaveVoice(roomId, user.id)
    toast.success('Left voice chat')
  }, [roomId, user, setInVoice, removeVoiceMember, emitLeaveVoice])

  const handleToggleMute = useCallback(() => {
    const newMuted = toggleMute()
    setMuted(newMuted)
    if (roomId && user) {
      emitMute(roomId, user.id, newMuted)
    }
  }, [roomId, user, setMuted, emitMute])

  const voiceMembersList = members.filter((m) => voiceMembers.includes(m.userId))

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/5">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-emerald-500" />
          Voice Chat
        </h3>
        <p className="text-xs text-zinc-500 mt-1">
          {voiceMembersList.length} {voiceMembersList.length === 1 ? 'member' : 'members'} connected
        </p>
      </div>

      {/* Voice members list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <AnimatePresence>
          {voiceMembersList.map((member) => (
            <motion.div
              key={member.userId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5"
            >
              <div className="relative">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={member.userImage} />
                  <AvatarFallback className="bg-emerald-900/50 text-emerald-300 text-xs">
                    {member.userName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {/* Speaking indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-zinc-900" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{member.userName}</p>
              </div>
              {member.isMuted ? (
                <MicOff className="h-3.5 w-3.5 text-red-400" />
              ) : (
                <Mic className="h-3.5 w-3.5 text-emerald-400" />
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {voiceMembersList.length === 0 && (
          <div className="text-center py-6">
            <Mic className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-xs text-zinc-500">No one in voice chat</p>
          </div>
        )}
      </div>

      {/* Voice controls */}
      <div className="p-3 border-t border-white/5 space-y-2">
        {isInVoice ? (
          <div className="flex gap-2">
            <Button
              onClick={handleToggleMute}
              variant={isMuted ? 'destructive' : 'secondary'}
              size="sm"
              className={`flex-1 ${isMuted ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/30' : 'bg-white/5 hover:bg-white/10 text-white border-white/10'}`}
            >
              {isMuted ? <MicOff className="h-4 w-4 mr-1.5" /> : <Mic className="h-4 w-4 mr-1.5" />}
              {isMuted ? 'Unmute' : 'Mute'}
            </Button>
            <Button
              onClick={handleLeaveVoice}
              variant="destructive"
              size="sm"
              className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/30"
            >
              <PhoneOff className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleJoinVoice}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-sm"
            size="sm"
          >
            <Phone className="h-4 w-4 mr-1.5" />
            Join Voice Chat
          </Button>
        )}
      </div>
    </div>
  )
}

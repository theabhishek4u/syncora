'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LogIn, Loader2 } from 'lucide-react'
import { useAppStore } from '@/lib/stores/useAppStore'
import { toast } from 'sonner'

interface JoinRoomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function JoinRoomDialog({ open, onOpenChange }: JoinRoomDialogProps) {
  const [roomCode, setRoomCode] = useState('')
  const [loading, setLoading] = useState(false)
  const { user, setCurrentRoomId } = useAppStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomCode.trim() || !user) return

    setLoading(true)
    try {
      // Try to join by code - the room code is the roomId for simplicity
      const res = await fetch(`/api/rooms/${roomCode.trim()}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: roomCode.trim(), userId: user.id }),
      })
      const data = await res.json()

      if (data.success) {
        setCurrentRoomId(data.data.id)
        onOpenChange(false)
        setRoomCode('')
        toast.success(`Joined room!`)
      } else {
        toast.error(data.error || 'Failed to join room')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-white/10 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <LogIn className="h-5 w-5 text-emerald-500" />
            Join a Room
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Enter a room code to join a listening session.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="room-code" className="text-zinc-300">
              Room Code
            </Label>
            <Input
              id="room-code"
              placeholder="Enter room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20 font-mono"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={loading || !roomCode.trim()}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              'Join Room'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

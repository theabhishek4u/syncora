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
import { Textarea } from '@/components/ui/textarea'
import { Plus, Loader2 } from 'lucide-react'
import { useAppStore } from '@/lib/stores/useAppStore'
import { useRoomStore } from '@/lib/stores/useRoomStore'
import { toast } from 'sonner'

interface CreateRoomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateRoomDialog({ open, onOpenChange }: CreateRoomDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'private' | 'friends'>('private')
  const [loading, setLoading] = useState(false)
  const { user, setCurrentRoomId } = useAppStore()
  const { setRoom } = useRoomStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !user) return

    setLoading(true)
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          type,
          hostId: user.id,
        }),
      })
      const data = await res.json()

      if (data.success) {
        // Set room store immediately with the room data from API
        const room = data.data
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
        setCurrentRoomId(data.data.id)
        onOpenChange(false)
        setName('')
        setDescription('')
        setType('private')
        toast.success(`Room "${data.data.name}" created!`)
      } else {
        toast.error(data.error || 'Failed to create room')
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
            <Plus className="h-5 w-5 text-emerald-500" />
            Create a Room
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Start a listening session and invite friends to join.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="room-name" className="text-zinc-300">
              Room Name
            </Label>
            <Input
              id="room-name"
              placeholder="My awesome room"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="room-desc" className="text-zinc-300">
              Description (optional)
            </Label>
            <Textarea
              id="room-desc"
              placeholder="What's this room about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20 resize-none"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Room Type</Label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setType('private')}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  type === 'private'
                    ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
                    : 'bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/8'
                }`}
              >
                🔒 Private
              </button>
              <button
                type="button"
                onClick={() => setType('friends')}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  type === 'friends'
                    ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
                    : 'bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/8'
                }`}
              >
                👥 Friends
              </button>
            </div>
          </div>
          <Button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Room'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

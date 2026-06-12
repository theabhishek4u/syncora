'use client'

import { useState, useEffect, useCallback } from 'react'
import { Music, Plus, Heart, ListMusic, Trash2 } from 'lucide-react'
import { useAppStore } from '@/lib/stores/useAppStore'
import { usePlayerStore } from '@/lib/stores/usePlayerStore'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SongCard } from './SongCard'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

export function LibraryView() {
  const { user } = useAppStore()
  const { play, setQueue } = usePlayerStore()
  const [playlists, setPlaylists] = useState<any[]>([])
  const [likedSongs, setLikedSongs] = useState<any[]>([])
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return

    fetch(`/api/playlists?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setPlaylists(data.data || [])
      })
      .catch(() => {})

    // Fetch liked songs from history
    fetch(`/api/history?userId=${user.id}&limit=20`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setLikedSongs(data.data.map((h: any) => h.song).filter(Boolean))
        }
      })
      .catch(() => {})
  }, [user])

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPlaylistName.trim() || !user) return

    setLoading(true)
    try {
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPlaylistName.trim(),
          description: newPlaylistDesc.trim() || undefined,
          userId: user.id,
          isPublic: false,
        }),
      })
      const data = await res.json()

      if (data.success) {
        setPlaylists([...playlists, data.data])
        setCreateDialogOpen(false)
        setNewPlaylistName('')
        setNewPlaylistDesc('')
        toast.success(`Playlist "${data.data.name}" created!`)
      } else {
        toast.error(data.error || 'Failed to create playlist')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenPlaylist = useCallback(
    (playlistId: string) => {
      fetch(`/api/playlists/${playlistId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setSelectedPlaylist(data.data)
        })
        .catch(() => {})
    },
    []
  )

  const handlePlaySong = useCallback(
    (song: any) => {
      play(song)
    },
    [play]
  )

  const handlePlayPlaylist = useCallback(
    (playlist: any) => {
      const songs = playlist.songs?.map((ps: any) => ps.song).filter(Boolean) || []
      if (songs.length > 0) {
        setQueue(songs.map((s: any) => ({ song: s, addedBy: user?.id || '' })))
        play(songs[0])
      }
    },
    [play, setQueue, user]
  )

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl font-bold text-white">Your Library</h1>
        </motion.div>

        {/* Selected playlist detail view */}
        {selectedPlaylist ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <button
              onClick={() => setSelectedPlaylist(null)}
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              ← Back to Library
            </button>
            <div className="flex items-end gap-6">
              <div className="w-48 h-48 rounded-xl bg-gradient-to-br from-emerald-900/40 to-zinc-900 flex items-center justify-center flex-shrink-0">
                <ListMusic className="h-16 w-16 text-emerald-500/40" />
              </div>
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wider">Playlist</p>
                <h2 className="text-3xl font-bold text-white mt-1">{selectedPlaylist.name}</h2>
                {selectedPlaylist.description && (
                  <p className="text-zinc-400 mt-1">{selectedPlaylist.description}</p>
                )}
                <p className="text-sm text-zinc-500 mt-2">
                  {selectedPlaylist.songs?.length || 0} songs
                </p>
                {selectedPlaylist.songs?.length > 0 && (
                  <Button
                    onClick={() => handlePlayPlaylist(selectedPlaylist)}
                    className="mt-3 bg-emerald-500 hover:bg-emerald-600 text-white"
                    size="sm"
                  >
                    <Play className="h-4 w-4 mr-1.5" />
                    Play All
                  </Button>
                )}
              </div>
            </div>

            {/* Song list */}
            <div className="space-y-1 mt-6">
              {selectedPlaylist.songs?.map((ps: any, index: number) => (
                <div
                  key={ps.id}
                  onClick={() => handlePlaySong(ps.song)}
                  className="flex items-center gap-4 px-4 py-2.5 rounded-lg hover:bg-white/5 group cursor-pointer transition-colors"
                >
                  <span className="text-sm text-zinc-500 w-6 text-right">{index + 1}</span>
                  <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 bg-white/5">
                    {ps.song?.coverUrl ? (
                      <img
                        src={ps.song.coverUrl}
                        alt={ps.song?.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-900/40 to-zinc-900 flex items-center justify-center">
                        <Music className="h-4 w-4 text-emerald-500/60" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{ps.song?.title}</p>
                    <p className="text-xs text-zinc-400 truncate">{ps.song?.artist}</p>
                  </div>
                </div>
              ))}
              {(!selectedPlaylist.songs || selectedPlaylist.songs.length === 0) && (
                <div className="text-center py-8">
                  <Music className="h-10 w-10 text-zinc-600 mx-auto mb-2" />
                  <p className="text-zinc-400">No songs in this playlist yet</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <Tabs defaultValue="playlists" className="space-y-6">
            <div className="flex items-center justify-between">
              <TabsList className="bg-white/5 border border-white/10">
                <TabsTrigger
                  value="playlists"
                  className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
                >
                  <ListMusic className="h-4 w-4 mr-1.5" />
                  Playlists
                </TabsTrigger>
                <TabsTrigger
                  value="liked"
                  className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
                >
                  <Heart className="h-4 w-4 mr-1.5" />
                  Liked Songs
                </TabsTrigger>
              </TabsList>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                variant="outline"
                size="sm"
                className="border-white/10 bg-white/5 hover:bg-white/10 text-white"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Create Playlist
              </Button>
            </div>

            <TabsContent value="playlists">
              {playlists.length === 0 ? (
                <div className="text-center py-16">
                  <ListMusic className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Create your first playlist</h3>
                  <p className="text-zinc-400 mb-4">It&apos;s easy, we&apos;ll help you</p>
                  <Button
                    onClick={() => setCreateDialogOpen(true)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Create Playlist
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {playlists.map((playlist) => (
                    <motion.div
                      key={playlist.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleOpenPlaylist(playlist.id)}
                      className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/8 cursor-pointer transition-all group"
                    >
                      <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-emerald-900/30 to-zinc-900/80 flex items-center justify-center mb-3 overflow-hidden">
                        {playlist.songs?.[0]?.song?.coverUrl ? (
                          <img
                            src={playlist.songs[0].song.coverUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ListMusic className="h-10 w-10 text-emerald-500/30" />
                        )}
                      </div>
                      <p className="text-sm font-medium text-white truncate">{playlist.name}</p>
                      <p className="text-xs text-zinc-400">
                        {playlist._count?.songs || playlist.songs?.length || 0} songs
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="liked">
              {likedSongs.length === 0 ? (
                <div className="text-center py-16">
                  <Heart className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Songs you&apos;ve liked</h3>
                  <p className="text-zinc-400">Your listening history will appear here</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {likedSongs.map((song: any) => (
                    <SongCard key={song.id} song={song} onPlay={handlePlaySong} size="sm" />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Create Playlist Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Plus className="h-5 w-5 text-emerald-500" />
              Create Playlist
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Create a new playlist to organize your music.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreatePlaylist} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="playlist-name" className="text-zinc-300">
                Name
              </Label>
              <Input
                id="playlist-name"
                placeholder="My playlist"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="playlist-desc" className="text-zinc-300">
                Description (optional)
              </Label>
              <Input
                id="playlist-desc"
                placeholder="Add a description"
                value={newPlaylistDesc}
                onChange={(e) => setNewPlaylistDesc(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !newPlaylistName.trim()}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
            >
              {loading ? 'Creating...' : 'Create Playlist'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Play({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

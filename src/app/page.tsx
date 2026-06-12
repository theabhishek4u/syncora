'use client'

import { useAppStore } from '@/lib/stores/useAppStore'
import { usePlayerStore } from '@/lib/stores/usePlayerStore'
import { useRoomStore } from '@/lib/stores/useRoomStore'
import { useSocket } from '@/hooks/useSocket'
import { Landing } from '@/components/syncora/Landing'
import { Dashboard } from '@/components/syncora/Dashboard'
import { RoomView } from '@/components/syncora/RoomView'
import { MusicPlayer } from '@/components/syncora/MusicPlayer'
import { AnimatePresence, motion } from 'framer-motion'

function SocketProvider({ children }: { children: React.ReactNode }) {
  // Initialize socket connection
  useSocket()
  return <>{children}</>
}

export default function Home() {
  const { view, user } = useAppStore()

  return (
    <SocketProvider>
      <div className="h-screen overflow-hidden bg-[#0a0a0a]">
        <AnimatePresence mode="wait">
          {view === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <Landing />
            </motion.div>
          )}
          {view === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <Dashboard />
            </motion.div>
          )}
          {view === 'room' && (
            <motion.div
              key="room"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="h-full flex flex-col"
            >
              <div className="flex-1 min-h-0">
                <RoomView />
              </div>
              <MusicPlayer />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SocketProvider>
  )
}

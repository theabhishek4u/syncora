'use client'

import { useAppStore } from '@/lib/stores/useAppStore'
import { Sidebar } from './Sidebar'
import { HomeView } from './HomeView'
import { SearchView } from './SearchView'
import { LibraryView } from './LibraryView'
import { MusicPlayer } from './MusicPlayer'
import { motion, AnimatePresence } from 'framer-motion'

export function Dashboard() {
  const { sidebarSection } = useAppStore()

  const renderContent = () => {
    switch (sidebarSection) {
      case 'search':
        return <SearchView />
      case 'library':
        return <LibraryView />
      default:
        return <HomeView />
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a]">
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={sidebarSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 min-w-0 flex flex-col"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom player */}
      <MusicPlayer />
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Music, Headphones, Mic2, Users, Sparkles, ArrowRight } from 'lucide-react'
import { LoginDialog } from './LoginDialog'
import { motion } from 'framer-motion'

const features = [
  {
    icon: Headphones,
    title: 'Real-Time Sync',
    description: 'Listen to music in perfect sync with friends, no matter where they are.',
    gradient: 'from-emerald-500/20 to-teal-500/10',
  },
  {
    icon: Mic2,
    title: 'Voice Chat',
    description: 'Talk, react, and share moments while listening together.',
    gradient: 'from-cyan-500/20 to-blue-500/10',
  },
  {
    icon: Users,
    title: 'Social Listening',
    description: 'Create rooms, share queues, and discover music as a group.',
    gradient: 'from-violet-500/20 to-purple-500/10',
  },
  {
    icon: Sparkles,
    title: 'Premium Experience',
    description: 'Beautiful, seamless, and designed for music lovers.',
    gradient: 'from-amber-500/20 to-orange-500/10',
  },
]

// Floating music notes component
function FloatingNotes() {
  const notes = ['♪', '♫', '♬', '♩', '🎵', '🎶']

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {notes.map((note, i) => (
        <motion.div
          key={i}
          className="absolute text-emerald-500/10 text-4xl select-none"
          initial={{
            x: `${15 + (i * 15) % 70}%`,
            y: '110%',
            rotate: 0,
          }}
          animate={{
            y: '-10%',
            rotate: [0, 15, -15, 0],
          }}
          transition={{
            duration: 12 + i * 2,
            repeat: Infinity,
            delay: i * 1.5,
            ease: 'linear',
          }}
        >
          {note}
        </motion.div>
      ))}
    </div>
  )
}

export function Landing() {
  const [loginOpen, setLoginOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      {/* Hero Section */}
      <section className="relative flex-1 flex items-center justify-center overflow-hidden">
        {/* Background image with overlay */}
        <div className="absolute inset-0">
          <img
            src="/images/hero-bg.png"
            alt=""
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/60 via-[#0a0a0a]/80 to-[#0a0a0a]" />
        </div>

        {/* Background gradient */}
        <div className="absolute inset-0 gradient-hero" />

        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/8 rounded-full blur-[120px] animate-float" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/8 rounded-full blur-[120px] animate-float"
          style={{ animationDelay: '3s' }}
        />

        {/* Floating music notes */}
        <FloatingNotes />

        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex items-center justify-center gap-3 mb-8"
          >
            <div className="w-14 h-14 rounded-2xl gradient-emerald animated-gradient flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Music className="h-7 w-7 text-white" />
            </div>
            <span className="text-5xl font-bold text-white tracking-tight">Syncora</span>
          </motion.div>

          {/* Tagline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-6 leading-tight"
          >
            Listen Together.
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Feel Connected.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto"
          >
            The premium social music experience. Create rooms, sync playback, and share
            the joy of music with friends in real-time.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={() => setLoginOpen(true)}
              className="group px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg rounded-xl transition-all hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/25 flex items-center gap-2"
            >
              Get Started
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => setLoginOpen(true)}
              className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold text-lg rounded-xl border border-white/10 hover:border-white/20 transition-all"
            >
              Learn More
            </button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Why Choose Syncora?
            </h2>
            <p className="text-lg text-zinc-400 max-w-xl mx-auto">
              Built for music lovers who want more than just pressing play.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`p-6 rounded-2xl bg-gradient-to-br ${feature.gradient} border border-white/5 hover:border-white/10 transition-all group hover:-translate-y-1`}
              >
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 relative">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Listen Together?
            </h2>
            <p className="text-lg text-zinc-400 mb-8">
              Join thousands of music lovers already sharing the experience on Syncora.
            </p>
            <button
              onClick={() => setLoginOpen(true)}
              className="px-10 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg rounded-xl transition-all hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/25 animate-pulse-glow"
            >
              Start Listening Now
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md gradient-emerald flex items-center justify-center">
              <Music className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">Syncora</span>
          </div>
          <p className="text-xs text-zinc-500">
            © {new Date().getFullYear()} Syncora. Listen Together. Feel Connected.
          </p>
        </div>
      </footer>

      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  )
}

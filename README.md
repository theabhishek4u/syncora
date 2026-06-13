# 🎵 Syncora - Listen Together

**Real-time social music listening platform. Listen together, feel connected.**

Syncora is a SaaS web application where users can listen to music together in synchronized sessions while communicating via built-in voice chat. Inspired by the premium dark UIs of Spotify, Discord, and Apple Music.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss)
![Socket.io](https://img.shields.io/badge/Socket.io-4-010101?logo=socket.io)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2d3748?logo=prisma)

---

## ✨ Features

### 🎶 Real-Time Music Sync
- Synchronized playback across all room members (<300ms delay)
- Play, pause, seek, and track change sync via Socket.io
- Queue management with add, remove, and reorder

### 🎙️ Voice Chat
- Built-in WebRTC peer-to-peer voice communication
- Mute/unmute controls
- Visual indicators for active speakers

### 🏠 Room System
- Create rooms with custom names and descriptions
- Join rooms via invite codes
- Automatic host transfer when host leaves
- Real-time member presence tracking

### 🔍 Music Discovery
- Search songs with debounced API
- Browse by genre categories (Pop, Rock, Hip-Hop, Electronic, R&B, Jazz, Classical, Indie)
- Curated Quick Picks and Recommended sections

### 📚 Library
- Create and manage playlists
- Add/remove songs with drag-to-reorder
- Liked songs collection
- Listening history

### 🎨 Premium Dark UI
- Dark theme inspired by Spotify & Discord
- Emerald green accent color
- Glassmorphism effects
- Smooth Framer Motion animations
- Fully responsive design

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript 5 |
| **Styling** | Tailwind CSS 4, shadcn/ui, Framer Motion |
| **State** | Zustand, TanStack Query |
| **Backend API** | Next.js API Routes |
| **Database** | SQLite via Prisma ORM |
| **Real-Time** | Socket.io (WebSockets) |
| **Voice Chat** | WebRTC (simple-peer) |
| **Icons** | Lucide React |

---

## 📁 Project Structure

```
syncora/
├── src/
│   ├── app/
│   │   ├── api/              # REST API routes
│   │   │   ├── auth/         # Authentication endpoints
│   │   │   ├── rooms/        # Room CRUD + join/leave
│   │   │   ├── songs/        # Songs list + seed
│   │   │   ├── playlists/    # Playlist management
│   │   │   └── history/      # Listening history
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Main SPA entry
│   │   └── globals.css       # Custom dark theme
│   ├── components/
│   │   ├── syncora/          # App-specific components
│   │   │   ├── Landing.tsx       # Landing page
│   │   │   ├── Dashboard.tsx     # Main dashboard
│   │   │   ├── RoomView.tsx      # Room view
│   │   │   ├── MusicPlayer.tsx   # Bottom player bar
│   │   │   ├── Sidebar.tsx       # Navigation sidebar
│   │   │   ├── VoiceChat.tsx     # Voice chat panel
│   │   │   ├── SearchView.tsx    # Song search
│   │   │   ├── LibraryView.tsx   # Playlists & library
│   │   │   ├── QueueView.tsx     # Queue management
│   │   │   └── ...               # Dialogs, cards, etc.
│   │   └── ui/               # shadcn/ui components
│   ├── hooks/
│   │   ├── useSocket.ts      # Socket.io integration
│   │   ├── use-mobile.ts     # Mobile detection
│   │   └── use-toast.ts      # Toast notifications
│   └── lib/
│       ├── stores/           # Zustand stores
│       │   ├── useAppStore.ts    # App state
│       │   ├── usePlayerStore.ts # Player state
│       │   └── useRoomStore.ts   # Room/real-time state
│       ├── socket.ts         # Socket.io client
│       ├── webrtc.ts         # WebRTC utility
│       ├── db.ts             # Prisma client
│       └── utils.ts          # Utility functions
├── mini-services/
│   └── sync-service/         # Socket.io server (port 3003)
│       ├── index.ts          # All event handlers
│       └── package.json
├── prisma/
│   └── schema.prisma         # Database schema
├── public/
│   └── images/               # Album covers & assets
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun
- npm, yarn, or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/syncora.git
cd syncora

# Install dependencies
bun install

# Install sync service dependencies
cd mini-services/sync-service && bun install && cd ../..

# Set up the database
bun run db:push

# Seed demo songs
curl -X POST http://localhost:3000/api/songs/seed

# Start the sync service (in a separate terminal)
cd mini-services/sync-service && bun run dev

# Start the development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔌 API Endpoints

### Auth
- `POST /api/auth/demo-login` - Demo login
- `GET /api/auth/me` - Get current user

### Rooms
- `GET /api/rooms` - List rooms
- `POST /api/rooms` - Create room
- `GET /api/rooms/[roomId]` - Get room details
- `PATCH /api/rooms/[roomId]` - Update room
- `DELETE /api/rooms/[roomId]` - Delete room
- `POST /api/rooms/[roomId]/join` - Join room
- `POST /api/rooms/[roomId]/leave` - Leave room

### Songs
- `GET /api/songs` - List/search songs
- `POST /api/songs/seed` - Seed demo data

### Playlists
- `GET /api/playlists` - List playlists
- `POST /api/playlists` - Create playlist
- `GET /api/playlists/[id]` - Get playlist
- `PATCH /api/playlists/[id]` - Update playlist
- `DELETE /api/playlists/[id]` - Delete playlist
- `POST /api/playlists/[id]/songs` - Add song
- `DELETE /api/playlists/[id]/songs` - Remove song

### History
- `GET /api/history` - Get listening history
- `POST /api/history` - Add to history

---

## 🔌 Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `room:join` | Client → Server | Join a room |
| `room:leave` | Client → Server | Leave a room |
| `room:state` | Server → Client | Room state update |
| `music:play` | Client ↔ Server | Play with sync |
| `music:pause` | Client ↔ Server | Pause sync |
| `music:seek` | Client ↔ Server | Seek position sync |
| `music:sync` | Server → Client | Full playback sync |
| `queue:add` | Client → Server | Add song to queue |
| `queue:remove` | Client → Server | Remove from queue |
| `queue:updated` | Server → Client | Queue change notification |
| `webrtc:offer` | Client ↔ Server | WebRTC signaling |
| `webrtc:answer` | Client ↔ Server | WebRTC signaling |
| `webrtc:ice-candidate` | Client ↔ Server | ICE candidate exchange |
| `chat:message` | Client ↔ Server | Room chat messages |

---

## 📄 License

MIT License - feel free to use this project for learning or building your own music sync platform.

---

<p align="center">
  Built with ❤️ using Next.js, Socket.io, and WebRTC
</p>

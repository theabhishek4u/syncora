# Task 8 - API Routes Developer

## Summary
Created all REST API routes for Syncora - a real-time social music listening platform.

## Files Created (10 route files)

### Auth Routes
- `src/app/api/auth/demo-login/route.ts` - POST: Demo login (find or create user)
- `src/app/api/auth/me/route.ts` - GET: Get user profile with related data

### Room Routes
- `src/app/api/rooms/route.ts` - GET (list user's rooms), POST (create room)
- `src/app/api/rooms/[roomId]/route.ts` - GET, PATCH, DELETE room
- `src/app/api/rooms/[roomId]/join/route.ts` - POST: Join room by code
- `src/app/api/rooms/[roomId]/leave/route.ts` - POST: Leave room

### Song Routes
- `src/app/api/songs/route.ts` - GET: List songs with pagination & search
- `src/app/api/songs/seed/route.ts` - POST: Seed 40 demo songs (8 genres)

### Playlist Routes
- `src/app/api/playlists/route.ts` - GET (list), POST (create)
- `src/app/api/playlists/[playlistId]/route.ts` - GET, PATCH, DELETE
- `src/app/api/playlists/[playlistId]/songs/route.ts` - POST (add song), DELETE (remove song)

### History Routes
- `src/app/api/history/route.ts` - GET (list history), POST (add entry)

## Key Design Decisions
- Consistent response format: `{ success: true/false, data/error: ... }`
- Proper HTTP status codes (400, 403, 404, 409, 500)
- Authorization checks on mutation endpoints (host/owner only)
- Pagination support on song listing
- Search support on songs (by title, artist, album)
- Room soft-delete (sets isActive=false)
- Playlist song reorder on removal
- Room rejoin support (updates leftAt to null)

## Database Status
- Seeded with 40 songs across 8 genres: Pop, Rock, Hip-Hop, Electronic, R&B, Jazz, Classical, Indie
- Cover URLs use picsum.photos with seed-based generation
- Audio URLs set to null (simulated playback)

## Verification
- All endpoints tested via curl and return correct responses
- ESLint passes with no errors
- Dev server running on port 3000

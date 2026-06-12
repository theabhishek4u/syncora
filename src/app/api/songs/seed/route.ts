import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const demoSongs = [
  // Pop
  { title: 'Midnight Glow', artist: 'Aria Voss', album: 'Neon Dreams', duration: 234, genre: 'Pop' },
  { title: 'Electric Heartbeat', artist: 'Aria Voss', album: 'Neon Dreams', duration: 198, genre: 'Pop' },
  { title: 'Sunlit Avenue', artist: 'Kai Mercer', album: 'Golden Hours', duration: 212, genre: 'Pop' },
  { title: 'Paper Lanterns', artist: 'Kai Mercer', album: 'Golden Hours', duration: 187, genre: 'Pop' },
  { title: 'Velvet Skyline', artist: 'Luna Chase', album: 'City Lights', duration: 256, genre: 'Pop' },
  // Rock
  { title: 'Iron Horizon', artist: 'The Burning Oaks', album: 'Stormbreaker', duration: 312, genre: 'Rock' },
  { title: 'Thunder Road', artist: 'The Burning Oaks', album: 'Stormbreaker', duration: 287, genre: 'Rock' },
  { title: 'Shattered Glass', artist: 'Crimson Veil', album: 'Aftermath', duration: 274, genre: 'Rock' },
  { title: 'Rust and Ruin', artist: 'Crimson Veil', album: 'Aftermath', duration: 301, genre: 'Rock' },
  { title: 'Wildfire Escape', artist: 'Stone Echo', album: 'Canyon Walls', duration: 265, genre: 'Rock' },
  // Hip-Hop
  { title: 'Concrete Jungle', artist: 'Dex Flow', album: 'Urban Pulse', duration: 198, genre: 'Hip-Hop' },
  { title: 'Crown Theory', artist: 'Dex Flow', album: 'Urban Pulse', duration: 215, genre: 'Hip-Hop' },
  { title: 'Phantom Steps', artist: 'Mira Blaze', album: 'Shadow Kingdom', duration: 203, genre: 'Hip-Hop' },
  { title: 'Gold Chain Logic', artist: 'Mira Blaze', album: 'Shadow Kingdom', duration: 227, genre: 'Hip-Hop' },
  { title: 'Neon Cipher', artist: 'Koda North', album: 'Frequency', duration: 191, genre: 'Hip-Hop' },
  // Electronic
  { title: 'Synthwave Rider', artist: 'NEXUS', album: 'Digital Dawn', duration: 345, genre: 'Electronic' },
  { title: 'Pulse Protocol', artist: 'NEXUS', album: 'Digital Dawn', duration: 278, genre: 'Electronic' },
  { title: 'Datastream', artist: 'Aether Pulse', album: 'Quantum Fields', duration: 312, genre: 'Electronic' },
  { title: 'Crystal Frequency', artist: 'Aether Pulse', album: 'Quantum Fields', duration: 289, genre: 'Electronic' },
  { title: 'Neon Cascade', artist: 'Chroma Drift', album: 'Light Years', duration: 267, genre: 'Electronic' },
  // R&B
  { title: 'Silk and Honey', artist: 'Jade Monroe', album: 'Slow Burn', duration: 245, genre: 'R&B' },
  { title: 'Moonlit Whisper', artist: 'Jade Monroe', album: 'Slow Burn', duration: 218, genre: 'R&B' },
  { title: 'Caramel Dusk', artist: 'Remy Silk', album: 'After Midnight', duration: 234, genre: 'R&B' },
  { title: 'Ocean Breath', artist: 'Remy Silk', album: 'After Midnight', duration: 201, genre: 'R&B' },
  { title: 'Warm Embers', artist: 'Nico Sage', album: 'Velvet Nights', duration: 256, genre: 'R&B' },
  // Jazz
  { title: 'Blue Note Revival', artist: 'Miles Apart', album: 'Smoky Rooms', duration: 378, genre: 'Jazz' },
  { title: 'Late Night Train', artist: 'Miles Apart', album: 'Smoky Rooms', duration: 324, genre: 'Jazz' },
  { title: 'Ivory Streets', artist: 'Theo Bass', album: 'Midnight Sessions', duration: 298, genre: 'Jazz' },
  { title: 'Satin Groove', artist: 'Theo Bass', album: 'Midnight Sessions', duration: 345, genre: 'Jazz' },
  { title: 'Amber Lounge', artist: 'Clara Keys', album: 'Swing City', duration: 287, genre: 'Jazz' },
  // Classical
  { title: 'Eternal Spring', artist: 'Vienna Chamber', album: 'Seasons Reimagined', duration: 412, genre: 'Classical' },
  { title: 'Whispering Pines', artist: 'Vienna Chamber', album: 'Seasons Reimagined', duration: 356, genre: 'Classical' },
  { title: 'Northern Lights', artist: 'Sofia Harp Ensemble', album: 'Celestial', duration: 489, genre: 'Classical' },
  { title: 'Dawn Overture', artist: 'Sofia Harp Ensemble', album: 'Celestial', duration: 367, genre: 'Classical' },
  { title: 'Starlight Sonata', artist: 'Berlin Strings', album: 'Nocturne', duration: 423, genre: 'Classical' },
  // Indie
  { title: 'Foggy Morning', artist: 'Wanderlight', album: 'Small Towns', duration: 223, genre: 'Indie' },
  { title: 'Daydream Radio', artist: 'Wanderlight', album: 'Small Towns', duration: 198, genre: 'Indie' },
  { title: 'Tangerine Haze', artist: 'Pale Fox', album: 'Garden State', duration: 245, genre: 'Indie' },
  { title: 'Autumn Letters', artist: 'Pale Fox', album: 'Garden State', duration: 212, genre: 'Indie' },
  { title: 'Coastal Drift', artist: 'Hazel Creek', album: 'Ocean Bound', duration: 267, genre: 'Indie' },
];

// POST /api/songs/seed - Seed the database with demo songs
export async function POST() {
  try {
    // Check if songs already exist
    const existingCount = await db.song.count();
    if (existingCount > 0) {
      return NextResponse.json({
        success: true,
        data: {
          message: `Database already has ${existingCount} songs. Skipping seed.`,
          count: existingCount,
        },
      });
    }

    // Map genres to local cover art
    const genreCoverMap: Record<string, string> = {
      'Pop': '/images/album-pop.png',
      'Rock': '/images/album-rock.png',
      'Hip-Hop': '/images/album-hiphop.png',
      'Electronic': '/images/album-electronic.png',
      'R&B': '/images/album-rnb.png',
      'Jazz': '/images/album-jazz.png',
      'Classical': '/images/album-classical.png',
      'Indie': '/images/album-indie.png',
    };

    // Create all songs
    const songs = await Promise.all(
      demoSongs.map((song) =>
        db.song.create({
          data: {
            title: song.title,
            artist: song.artist,
            album: song.album,
            duration: song.duration,
            coverUrl: genreCoverMap[song.genre] || '/images/album-pop.png',
            audioUrl: null,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      data: {
        message: 'Database seeded successfully',
        count: songs.length,
      },
    });
  } catch (error) {
    console.error('Seed songs error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to seed songs' },
      { status: 500 }
    );
  }
}

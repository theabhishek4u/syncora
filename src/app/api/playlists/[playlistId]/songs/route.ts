import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/playlists/[playlistId]/songs - Add song to playlist
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ playlistId: string }> }
) {
  try {
    const { playlistId } = await params;
    const body = await request.json();
    const { songId } = body;

    if (!songId) {
      return NextResponse.json(
        { success: false, error: 'songId is required' },
        { status: 400 }
      );
    }

    // Check playlist exists
    const playlist = await db.playlist.findUnique({ where: { id: playlistId } });
    if (!playlist) {
      return NextResponse.json(
        { success: false, error: 'Playlist not found' },
        { status: 404 }
      );
    }

    // Check song exists
    const song = await db.song.findUnique({ where: { id: songId } });
    if (!song) {
      return NextResponse.json(
        { success: false, error: 'Song not found' },
        { status: 404 }
      );
    }

    // Check if song already in playlist
    const existing = await db.playlistSong.findUnique({
      where: { playlistId_songId: { playlistId, songId } },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Song already in playlist' },
        { status: 409 }
      );
    }

    // Get next position
    const lastItem = await db.playlistSong.findFirst({
      where: { playlistId },
      orderBy: { position: 'desc' },
    });

    const position = (lastItem?.position ?? -1) + 1;

    const playlistSong = await db.playlistSong.create({
      data: {
        playlistId,
        songId,
        position,
      },
      include: {
        song: true,
      },
    });

    return NextResponse.json({ success: true, data: playlistSong }, { status: 201 });
  } catch (error) {
    console.error('Add song to playlist error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add song to playlist' },
      { status: 500 }
    );
  }
}

// DELETE /api/playlists/[playlistId]/songs - Remove song from playlist
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ playlistId: string }> }
) {
  try {
    const { playlistId } = await params;
    const songId = request.nextUrl.searchParams.get('songId');

    if (!songId) {
      return NextResponse.json(
        { success: false, error: 'songId query parameter is required' },
        { status: 400 }
      );
    }

    const playlistSong = await db.playlistSong.findUnique({
      where: { playlistId_songId: { playlistId, songId } },
    });

    if (!playlistSong) {
      return NextResponse.json(
        { success: false, error: 'Song not found in playlist' },
        { status: 404 }
      );
    }

    await db.playlistSong.delete({
      where: { id: playlistSong.id },
    });

    // Reorder remaining songs
    const remaining = await db.playlistSong.findMany({
      where: { playlistId },
      orderBy: { position: 'asc' },
    });

    await Promise.all(
      remaining.map((item, index) =>
        db.playlistSong.update({
          where: { id: item.id },
          data: { position: index },
        })
      )
    );

    return NextResponse.json({
      success: true,
      data: { message: 'Song removed from playlist' },
    });
  } catch (error) {
    console.error('Remove song from playlist error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove song from playlist' },
      { status: 500 }
    );
  }
}

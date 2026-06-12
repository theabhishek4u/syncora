import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/playlists/[playlistId] - Get playlist with songs
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ playlistId: string }> }
) {
  try {
    const { playlistId } = await params;

    const playlist = await db.playlist.findUnique({
      where: { id: playlistId },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
        songs: {
          include: {
            song: true,
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!playlist) {
      return NextResponse.json(
        { success: false, error: 'Playlist not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: playlist });
  } catch (error) {
    console.error('Get playlist error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch playlist' },
      { status: 500 }
    );
  }
}

// PATCH /api/playlists/[playlistId] - Update playlist
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ playlistId: string }> }
) {
  try {
    const { playlistId } = await params;
    const body = await request.json();
    const { name, description, isPublic, userId } = body;

    const playlist = await db.playlist.findUnique({ where: { id: playlistId } });
    if (!playlist) {
      return NextResponse.json(
        { success: false, error: 'Playlist not found' },
        { status: 404 }
      );
    }

    if (userId && playlist.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Only the owner can update this playlist' },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    const updatedPlaylist = await db.playlist.update({
      where: { id: playlistId },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
        _count: {
          select: { songs: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: updatedPlaylist });
  } catch (error) {
    console.error('Update playlist error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update playlist' },
      { status: 500 }
    );
  }
}

// DELETE /api/playlists/[playlistId] - Delete playlist
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ playlistId: string }> }
) {
  try {
    const { playlistId } = await params;
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId query parameter is required' },
        { status: 400 }
      );
    }

    const playlist = await db.playlist.findUnique({ where: { id: playlistId } });
    if (!playlist) {
      return NextResponse.json(
        { success: false, error: 'Playlist not found' },
        { status: 404 }
      );
    }

    if (playlist.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Only the owner can delete this playlist' },
        { status: 403 }
      );
    }

    await db.playlist.delete({ where: { id: playlistId } });

    return NextResponse.json({
      success: true,
      data: { message: 'Playlist deleted successfully' },
    });
  } catch (error) {
    console.error('Delete playlist error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete playlist' },
      { status: 500 }
    );
  }
}

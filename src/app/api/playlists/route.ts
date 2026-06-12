import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/playlists?userId=xxx - List user's playlists
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId query parameter is required' },
        { status: 400 }
      );
    }

    const playlists = await db.playlist.findMany({
      where: {
        OR: [
          { userId },
          { isPublic: true },
        ],
      },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
        _count: {
          select: { songs: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: playlists });
  } catch (error) {
    console.error('List playlists error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch playlists' },
      { status: 500 }
    );
  }
}

// POST /api/playlists - Create playlist
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, userId, isPublic } = body;

    if (!name || !userId) {
      return NextResponse.json(
        { success: false, error: 'Playlist name and userId are required' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const playlist = await db.playlist.create({
      data: {
        name,
        description: description || null,
        userId,
        isPublic: isPublic ?? false,
      },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
        _count: {
          select: { songs: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: playlist }, { status: 201 });
  } catch (error) {
    console.error('Create playlist error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create playlist' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/history?userId=xxx&limit=20 - Get user's listening history
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20', 10);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId query parameter is required' },
        { status: 400 }
      );
    }

    const history = await db.listeningHistory.findMany({
      where: { userId },
      include: {
        song: true,
      },
      orderBy: { playedAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ success: true, data: history });
  } catch (error) {
    console.error('Get history error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch listening history' },
      { status: 500 }
    );
  }
}

// POST /api/history - Add to listening history
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, songId, roomId, duration } = body;

    if (!userId || !songId) {
      return NextResponse.json(
        { success: false, error: 'userId and songId are required' },
        { status: 400 }
      );
    }

    // Verify user and song exist
    const [user, song] = await Promise.all([
      db.user.findUnique({ where: { id: userId } }),
      db.song.findUnique({ where: { id: songId } }),
    ]);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (!song) {
      return NextResponse.json(
        { success: false, error: 'Song not found' },
        { status: 404 }
      );
    }

    const historyEntry = await db.listeningHistory.create({
      data: {
        userId,
        songId,
        roomId: roomId || null,
        duration: duration || 0,
      },
      include: {
        song: true,
      },
    });

    return NextResponse.json({ success: true, data: historyEntry }, { status: 201 });
  } catch (error) {
    console.error('Add history error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add listening history' },
      { status: 500 }
    );
  }
}

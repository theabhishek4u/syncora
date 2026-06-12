import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/songs?page=1&limit=20&search=xxx - List songs with pagination
export async function GET(request: NextRequest) {
  try {
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1', 10);
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20', 10);
    const search = request.nextUrl.searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { title: { contains: search } },
            { artist: { contains: search } },
            { album: { contains: search } },
          ],
        }
      : {};

    const [songs, total] = await Promise.all([
      db.song.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.song.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        songs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('List songs error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch songs' },
      { status: 500 }
    );
  }
}

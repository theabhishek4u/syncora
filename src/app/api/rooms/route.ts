import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/rooms?userId=xxx - List user's rooms
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId query parameter is required' },
        { status: 400 }
      );
    }

    const memberships = await db.roomMember.findMany({
      where: {
        userId,
        leftAt: null,
      },
      include: {
        room: {
          include: {
            host: {
              select: { id: true, name: true, image: true },
            },
            members: {
              where: { leftAt: null },
              include: {
                user: {
                  select: { id: true, name: true, image: true },
                },
              },
            },
            _count: {
              select: {
                members: { where: { leftAt: null } },
                queue: true,
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    const rooms = memberships.map((m) => m.room);

    return NextResponse.json({ success: true, data: rooms });
  } catch (error) {
    console.error('List rooms error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch rooms' },
      { status: 500 }
    );
  }
}

// POST /api/rooms - Create room
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, type, hostId } = body;

    if (!name || !hostId) {
      return NextResponse.json(
        { success: false, error: 'Room name and hostId are required' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { id: hostId } });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Host user not found' },
        { status: 404 }
      );
    }

    const room = await db.room.create({
      data: {
        name,
        description: description || null,
        type: type || 'private',
        hostId,
        members: {
          create: {
            userId: hostId,
            role: 'host',
          },
        },
      },
      include: {
        host: {
          select: { id: true, name: true, image: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, image: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: room }, { status: 201 });
  } catch (error) {
    console.error('Create room error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create room' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/rooms/[roomId]/join - Join room by code
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await request.json();
    const { code, userId } = body;

    if (!code || !userId) {
      return NextResponse.json(
        { success: false, error: 'Room code and userId are required' },
        { status: 400 }
      );
    }

    // Find room by id and code
    const room = await db.room.findFirst({
      where: {
        id: roomId,
        code,
        isActive: true,
      },
    });

    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Invalid room code or room not found' },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const existingMembership = await db.roomMember.findUnique({
      where: {
        userId_roomId: { userId, roomId },
      },
    });

    if (existingMembership) {
      if (existingMembership.leftAt) {
        // Rejoin
        await db.roomMember.update({
          where: { id: existingMembership.id },
          data: { leftAt: null, joinedAt: new Date() },
        });
      }
      // Already a member, return room
      const updatedRoom = await db.room.findUnique({
        where: { id: roomId },
        include: {
          host: { select: { id: true, name: true, image: true } },
          members: {
            where: { leftAt: null },
            include: {
              user: { select: { id: true, name: true, image: true } },
            },
          },
        },
      });
      return NextResponse.json({ success: true, data: updatedRoom });
    }

    // Join the room
    await db.roomMember.create({
      data: {
        userId,
        roomId,
        role: 'listener',
      },
    });

    const updatedRoom = await db.room.findUnique({
      where: { id: roomId },
      include: {
        host: { select: { id: true, name: true, image: true } },
        members: {
          where: { leftAt: null },
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: updatedRoom });
  } catch (error) {
    console.error('Join room error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to join room' },
      { status: 500 }
    );
  }
}

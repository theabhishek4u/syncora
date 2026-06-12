import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/rooms/[roomId]/leave - Leave room
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    const membership = await db.roomMember.findUnique({
      where: {
        userId_roomId: { userId, roomId },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'Not a member of this room' },
        { status: 404 }
      );
    }

    if (membership.leftAt) {
      return NextResponse.json(
        { success: false, error: 'Already left this room' },
        { status: 400 }
      );
    }

    await db.roomMember.update({
      where: { id: membership.id },
      data: { leftAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Left room successfully' },
    });
  } catch (error) {
    console.error('Leave room error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to leave room' },
      { status: 500 }
    );
  }
}

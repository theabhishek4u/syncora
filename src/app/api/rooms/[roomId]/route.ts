import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/rooms/[roomId] - Get room details
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;

    const room = await db.room.findUnique({
      where: { id: roomId },
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
          orderBy: { joinedAt: 'asc' },
        },
        queue: {
          include: {
            song: true,
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Room not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: room });
  } catch (error) {
    console.error('Get room error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch room' },
      { status: 500 }
    );
  }
}

// PATCH /api/rooms/[roomId] - Update room
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await request.json();
    const { name, description, type, hostId } = body;

    if (hostId) {
      const room = await db.room.findUnique({ where: { id: roomId } });
      if (!room) {
        return NextResponse.json(
          { success: false, error: 'Room not found' },
          { status: 404 }
        );
      }
      if (room.hostId !== hostId) {
        return NextResponse.json(
          { success: false, error: 'Only the host can update the room' },
          { status: 403 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;

    const updatedRoom = await db.room.update({
      where: { id: roomId },
      data: updateData,
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
      },
    });

    return NextResponse.json({ success: true, data: updatedRoom });
  } catch (error) {
    console.error('Update room error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update room' },
      { status: 500 }
    );
  }
}

// DELETE /api/rooms/[roomId] - Delete room (host only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const hostId = request.nextUrl.searchParams.get('hostId');

    if (!hostId) {
      return NextResponse.json(
        { success: false, error: 'hostId query parameter is required' },
        { status: 400 }
      );
    }

    const room = await db.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Room not found' },
        { status: 404 }
      );
    }
    if (room.hostId !== hostId) {
      return NextResponse.json(
        { success: false, error: 'Only the host can delete the room' },
        { status: 403 }
      );
    }

    await db.room.update({
      where: { id: roomId },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Room deleted successfully' },
    });
  } catch (error) {
    console.error('Delete room error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete room' },
      { status: 500 }
    );
  }
}

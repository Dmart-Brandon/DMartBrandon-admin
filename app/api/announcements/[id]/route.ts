import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { connectToDatabase } from '@/lib/mongodb';
import { Announcement } from '@/lib/models/Announcement';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const item = await Announcement.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    });
    if (!item) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }
    revalidateTag('announcements');
    return NextResponse.json(item.toJSON());
  } catch (error: any) {
    console.error('[PUT /api/announcements/[id]]', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to update announcement' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const item = await Announcement.findByIdAndDelete(params.id);
    if (!item) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }
    revalidateTag('announcements');
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete announcement' },
      { status: 500 }
    );
  }
}

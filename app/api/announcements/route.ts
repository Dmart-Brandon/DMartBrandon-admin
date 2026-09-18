import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { connectToDatabase } from '@/lib/mongodb';
import { Announcement } from '@/lib/models/Announcement';

export async function GET() {
  try {
    await connectToDatabase();
    const items = await Announcement.find().sort({ displayOrder: 1, createdAt: 1 });
    return NextResponse.json(items.map((a) => a.toJSON()));
  } catch (error: any) {
    console.error('[GET /api/announcements]', error);
    return NextResponse.json(
      { error: error.message ?? 'Failed to fetch announcements' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();
    if (typeof body.displayOrder !== 'number') {
      const last = await Announcement.findOne().sort({ displayOrder: -1 });
      body.displayOrder = (last?.displayOrder ?? -1) + 1;
    }
    const item = await Announcement.create(body);
    revalidateTag('announcements');
    return NextResponse.json(item.toJSON(), { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/announcements]', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: error.message ?? 'Failed to create announcement' },
      { status: 500 }
    );
  }
}

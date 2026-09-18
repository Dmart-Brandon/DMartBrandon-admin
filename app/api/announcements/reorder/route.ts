import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { connectToDatabase } from '@/lib/mongodb';
import { Announcement } from '@/lib/models/Announcement';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = (await request.json()) as { ids?: string[] };
    if (!Array.isArray(body.ids)) {
      return NextResponse.json({ error: 'ids must be an array' }, { status: 400 });
    }
    await Promise.all(
      body.ids.map((id, idx) =>
        Announcement.findByIdAndUpdate(id, { displayOrder: idx })
      )
    );
    revalidateTag('announcements');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[POST /api/announcements/reorder]', error);
    return NextResponse.json(
      { error: error.message ?? 'Failed to reorder announcements' },
      { status: 500 }
    );
  }
}

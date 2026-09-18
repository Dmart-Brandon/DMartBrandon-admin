import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { connectToDatabase } from '@/lib/mongodb';
import { HeroSlide } from '@/lib/models/HeroSlide';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = (await request.json()) as { ids?: string[] };
    if (!Array.isArray(body.ids)) {
      return NextResponse.json({ error: 'ids must be an array' }, { status: 400 });
    }
    await Promise.all(
      body.ids.map((id, idx) =>
        HeroSlide.findByIdAndUpdate(id, { displayOrder: idx })
      )
    );
    revalidateTag('hero-slides');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[POST /api/hero-slides/reorder]', error);
    return NextResponse.json(
      { error: error.message ?? 'Failed to reorder slides' },
      { status: 500 }
    );
  }
}

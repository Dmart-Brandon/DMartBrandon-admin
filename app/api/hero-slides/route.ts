import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { connectToDatabase } from '@/lib/mongodb';
import { HeroSlide } from '@/lib/models/HeroSlide';

export async function GET() {
  try {
    await connectToDatabase();
    const slides = await HeroSlide.find()
      .sort({ displayOrder: 1, createdAt: 1 });
    return NextResponse.json(slides.map((s) => s.toJSON()));
  } catch (error: any) {
    console.error('[GET /api/hero-slides]', error);
    return NextResponse.json(
      { error: error.message ?? 'Failed to fetch slides' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();
    if (typeof body.displayOrder !== 'number') {
      const last = await HeroSlide.findOne().sort({ displayOrder: -1 });
      body.displayOrder = (last?.displayOrder ?? -1) + 1;
    }
    const slide = await HeroSlide.create(body);
    revalidateTag('hero-slides');
    return NextResponse.json(slide.toJSON(), { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/hero-slides]', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: error.message ?? 'Failed to create slide' },
      { status: 500 }
    );
  }
}

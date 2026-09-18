import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { connectToDatabase } from '@/lib/mongodb';
import { HeroSlide } from '@/lib/models/HeroSlide';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const slide = await HeroSlide.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    });
    if (!slide) {
      return NextResponse.json({ error: 'Slide not found' }, { status: 404 });
    }
    revalidateTag('hero-slides');
    return NextResponse.json(slide.toJSON());
  } catch (error: any) {
    console.error('[PUT /api/hero-slides/[id]]', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to update slide' },
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
    const slide = await HeroSlide.findByIdAndDelete(params.id);
    if (!slide) {
      return NextResponse.json({ error: 'Slide not found' }, { status: 404 });
    }
    revalidateTag('hero-slides');
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete slide' },
      { status: 500 }
    );
  }
}

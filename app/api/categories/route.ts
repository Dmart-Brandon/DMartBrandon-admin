import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Category } from '@/lib/models/Category';

export async function GET() {
  try {
    await connectToDatabase();
    const categories = await Category.find({ deletedAt: null }).sort({ createdAt: -1 });
    return NextResponse.json(categories.map((c) => c.toJSON()));
  } catch (error: any) {
    console.error('[GET /api/categories]', error);
    return NextResponse.json({ error: error.message ?? 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const category = await Category.create(body);
    return NextResponse.json(category.toJSON(), { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/categories]', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message ?? 'Failed to create category' }, { status: 500 });
  }
}

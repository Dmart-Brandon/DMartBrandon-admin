import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Category } from '@/lib/models/Category';
import { Product } from '@/lib/models/Product';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const category = await Category.findByIdAndUpdate(params.id, body, { new: true });
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json(category.toJSON());
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const category = await Category.findByIdAndUpdate(
      params.id,
      { deletedAt: new Date() },
      { new: true },
    );
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    await Product.updateMany(
      { categoryId: params.id, deletedAt: null },
      { deletedAt: new Date() },
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}

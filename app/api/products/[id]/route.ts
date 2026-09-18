import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/lib/models/Product';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const product = await Product.findByIdAndUpdate(params.id, body, { new: true });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(product.toJSON());
  } catch (error: any) {
    console.error('PUT /api/products/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update product', message: error?.message, details: error?.errors },
      { status: 500 }
    );
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const product = await Product.findByIdAndUpdate(
      params.id,
      { deletedAt: new Date() },
      { new: true },
    );
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}

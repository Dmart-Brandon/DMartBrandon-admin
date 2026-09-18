import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/lib/models/Product';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured');

    const filter: Record<string, unknown> = { deletedAt: null };
    if (featured === 'true') filter.featured = true;
    const products = await Product.find(filter).sort({ createdAt: -1 });
    return NextResponse.json(products.map((p) => p.toJSON()));
  } catch (error) {
    console.error('GET /api/products error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const product = await Product.create(body);
    return NextResponse.json(product.toJSON(), { status: 201 });
  } catch (error: any) {
    console.error('POST /api/products error:', error);
    return NextResponse.json(
      { error: 'Failed to create product', message: error?.message, details: error?.errors },
      { status: 500 }
    );
  }
}

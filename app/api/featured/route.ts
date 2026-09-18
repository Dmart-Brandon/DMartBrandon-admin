import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { connectToDatabase } from '@/lib/mongodb';
import { Featured } from '@/lib/models/Featured';

const SLOT = 'home';

export async function GET() {
  try {
    await connectToDatabase();
    let doc = await Featured.findOne({ slot: SLOT });
    if (!doc) {
      doc = await Featured.create({ slot: SLOT, productIds: [] });
    }
    return NextResponse.json(doc.toJSON());
  } catch (error: any) {
    console.error('[GET /api/featured]', error);
    return NextResponse.json(
      { error: error.message ?? 'Failed to fetch featured' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const update: Record<string, unknown> = {};
    if (Array.isArray(body.productIds)) update.productIds = body.productIds;
    if (body.startsAt !== undefined) update.startsAt = body.startsAt || null;
    if (body.endsAt !== undefined) update.endsAt = body.endsAt || null;
    const doc = await Featured.findOneAndUpdate(
      { slot: SLOT },
      { $set: update },
      { new: true, upsert: true }
    );
    revalidateTag('featured');
    return NextResponse.json(doc.toJSON());
  } catch (error: any) {
    console.error('[PUT /api/featured]', error);
    return NextResponse.json(
      { error: error.message ?? 'Failed to update featured' },
      { status: 500 }
    );
  }
}

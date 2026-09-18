import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { QuoteRequest } from '@/lib/models/QuoteRequest';

export async function GET() {
  try {
    await connectToDatabase();
    const quotes = await QuoteRequest.find()
      .sort({ createdAt: -1 })
      .lean();
    const serialized = quotes.map((q: any) => ({
      ...q,
      id: q._id.toString(),
      _id: undefined,
    }));
    return NextResponse.json(serialized);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 });
  }
}

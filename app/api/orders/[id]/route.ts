import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Order } from '@/lib/models/Order';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const body = await request.json();

    if (body.status === 'shipped' && !body.trackingUrl?.trim()) {
      return NextResponse.json(
        { error: 'Tracking URL is required when marking an order as shipped' },
        { status: 400 }
      );
    }

    const order = await Order.findByIdAndUpdate(params.id, body, { new: true });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    return NextResponse.json(order.toJSON());
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const order = await Order.findByIdAndUpdate(
      params.id,
      { deletedAt: new Date() },
      { new: true }
    );
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}

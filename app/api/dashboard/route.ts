import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Order } from '@/lib/models/Order';
import { Product } from '@/lib/models/Product';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();

    const notDeleted = { deletedAt: null };
    const [totalOrders, pendingOrders, totalProducts, revenueResult] = await Promise.all([
      Order.countDocuments(notDeleted),
      Order.countDocuments({ ...notDeleted, status: 'pending' }),
      Product.countDocuments(),
      Order.aggregate([
        { $match: { deletedAt: null, status: { $in: ['completed', 'processing'] } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
    ]);

    return NextResponse.json({
      totalOrders,
      pendingOrders,
      totalRevenue: revenueResult[0]?.total ?? 0,
      totalProducts,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}

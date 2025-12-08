import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db/connection';
import Vendor from '@/models/Vendor';
import User from '@/models/User';
import Product from '@/models/Product';

async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return !!session;
}

// GET: List all vendors with filtering
export async function GET(request: Request) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status'); // pending, verified, rejected
    const search = searchParams.get('search');
    const tier = searchParams.get('tier'); // starter, growth, standard
    const city = searchParams.get('city');

    await connectDB();

    // Build query
    const query: Record<string, unknown> = {};

    if (status) {
      query.verificationStatus = status;
    }

    if (tier) {
      query.graduationTier = tier;
    }

    if (city) {
      query['address.city'] = { $regex: city, $options: 'i' };
    }

    if (search) {
      query.$or = [
        { storeName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [vendors, total] = await Promise.all([
      Vendor.find(query)
        .populate('userId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Vendor.countDocuments(query),
    ]);

    // Get stats
    const stats = await Vendor.aggregate([
      {
        $group: {
          _id: '$verificationStatus',
          count: { $sum: 1 },
        },
      },
    ]);

    const statusCounts = {
      pending: 0,
      verified: 0,
      rejected: 0,
    };

    for (const stat of stats) {
      statusCounts[stat._id as keyof typeof statusCounts] = stat.count;
    }

    return NextResponse.json({
      success: true,
      vendors,
      stats: statusCounts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin get vendors error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendors' },
      { status: 500 }
    );
  }
}

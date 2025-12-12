import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db/connection';
import Product from '@/models/Product';
import Vendor from '@/models/Vendor';
import Category from '@/models/Category';

async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return !!session;
}

// GET: List all products with filtering
export async function GET(request: Request) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const status = searchParams.get('status'); // active, inactive, all
    const vendorId = searchParams.get('vendor');

    await connectDB();

    // Build query
    const query: Record<string, unknown> = {};

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    if (category) {
      query.category = category;
    }

    if (vendorId) {
      query.vendorId = vendorId;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('vendorId', 'storeName slug email verificationStatus')
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(query),
    ]);

    // Get stats
    const stats = await Product.aggregate([
      {
        $group: {
          _id: '$isActive',
          count: { $sum: 1 },
        },
      },
    ]);

    const statusCounts = {
      active: 0,
      inactive: 0,
      total: 0,
    };

    for (const stat of stats) {
      if (stat._id === true) statusCounts.active = stat.count;
      else statusCounts.inactive = stat.count;
      statusCounts.total += stat.count;
    }

    return NextResponse.json({
      success: true,
      products,
      stats: statusCounts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin get products error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

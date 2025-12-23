import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db/connection';
import MasterProductRequest from '@/models/MasterProductRequest';
// Import models needed for populate to register their schemas
import '@/models/Vendor';
import '@/models/Category';
import '@/models/User';
import '@/models/MasterProduct';

async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return !!session;
}

// GET: List product requests for moderation
export async function GET(request: Request) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'duplicateScore';
    const skip = (page - 1) * limit;

    // Build query based on status
    const query: Record<string, unknown> = {};
    if (status !== 'all') {
      query.status = status;
    }

    // Build sort based on sortBy
    type SortOrder = 1 | -1;
    const sortOptions: Record<string, SortOrder> = sortBy === 'duplicateScore'
      ? { highestDuplicateScore: -1, createdAt: -1 }
      : { createdAt: -1 };

    // Get requests with pagination using direct query
    const [requests, total] = await Promise.all([
      MasterProductRequest.find(query)
        .populate('vendorId', 'storeName slug email')
        .populate('categoryId', 'name slug')
        .populate('possibleDuplicates.masterProductId', 'name brand slug vendorCount minPrice maxPrice')
        .populate('reviewedBy', 'firstName lastName email')
        .populate('createdMasterProductId', 'name slug')
        .populate('mergedToMasterProductId', 'name slug')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit),
      MasterProductRequest.countDocuments(query),
    ]);

    // Get overall stats
    const stats = await MasterProductRequest.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const statusCounts = {
      pending: 0,
      approved: 0,
      rejected: 0,
      merged: 0,
    };

    for (const stat of stats) {
      if (stat._id in statusCounts) {
        statusCounts[stat._id as keyof typeof statusCounts] = stat.count;
      }
    }

    // Get high-risk count (duplicates with score >= 70)
    const highRiskCount = await MasterProductRequest.countDocuments({
      status: 'pending',
      highestDuplicateScore: { $gte: 70 },
    });

    return NextResponse.json({
      success: true,
      requests,
      stats: {
        ...statusCounts,
        highRisk: highRiskCount,
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin get product requests error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product requests' },
      { status: 500 }
    );
  }
}

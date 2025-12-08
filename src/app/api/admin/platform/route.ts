import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db/connection';
import Vendor from '@/models/Vendor';
import Product from '@/models/Product';
import ProductView from '@/models/ProductView';
import ViewTransaction from '@/models/ViewTransaction';
import User from '@/models/User';
import Category from '@/models/Category';

async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return !!session;
}

// GET: Platform analytics and statistics
export async function GET(request: Request) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d'; // 7d, 30d, 90d
    const report = searchParams.get('report') || 'overview'; // overview, vendors, revenue, categories

    await connectDB();

    // Calculate date range
    const dateFrom: Date = new Date();
    switch (period) {
      case '7d':
        dateFrom.setDate(dateFrom.getDate() - 7);
        break;
      case '30d':
        dateFrom.setDate(dateFrom.getDate() - 30);
        break;
      case '90d':
        dateFrom.setDate(dateFrom.getDate() - 90);
        break;
      default:
        dateFrom.setDate(dateFrom.getDate() - 30);
    }

    switch (report) {
      case 'overview':
        return await getOverviewStats(dateFrom);
      case 'vendors':
        return await getVendorStats(dateFrom);
      case 'revenue':
        return await getRevenueStats(dateFrom);
      case 'categories':
        return await getCategoryStats(dateFrom);
      default:
        return await getOverviewStats(dateFrom);
    }
  } catch (error) {
    console.error('Platform analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch platform analytics' },
      { status: 500 }
    );
  }
}

async function getOverviewStats(dateFrom: Date) {
  const [
    totalVendors,
    verifiedVendors,
    pendingVendors,
    totalProducts,
    activeProducts,
    totalUsers,
    totalCategories,
    viewStats,
    revenueStats,
    dailyTrend,
  ] = await Promise.all([
    Vendor.countDocuments(),
    Vendor.countDocuments({ verificationStatus: 'verified', isActive: true }),
    Vendor.countDocuments({ verificationStatus: 'pending' }),
    Product.countDocuments(),
    Product.countDocuments({ isActive: true }),
    User.countDocuments(),
    Category.countDocuments({ isActive: true }),

    // View stats for period
    ProductView.aggregate([
      {
        $match: {
          timestamp: { $gte: dateFrom },
          isBot: false,
        },
      },
      {
        $group: {
          _id: null,
          totalViews: { $sum: 1 },
          qualifiedViews: { $sum: { $cond: ['$isQualifiedView', 1, 0] } },
          contactClicks: { $sum: { $cond: ['$clickedContact', 1, 0] } },
          uniqueSessions: { $addToSet: '$sessionId' },
        },
      },
    ]),

    // Revenue stats (from purchases)
    ViewTransaction.aggregate([
      {
        $match: {
          transactionType: 'purchase',
          status: 'completed',
          createdAt: { $gte: dateFrom },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$purchaseDetails.amount' },
          totalCredits: { $sum: '$purchaseDetails.creditsAdded' },
          transactions: { $sum: 1 },
        },
      },
    ]),

    // Daily view trend
    ProductView.aggregate([
      {
        $match: {
          timestamp: { $gte: dateFrom },
          isBot: false,
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          views: { $sum: 1 },
          qualified: { $sum: { $cond: ['$isQualifiedView', 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const viewData = viewStats[0] || {
    totalViews: 0,
    qualifiedViews: 0,
    contactClicks: 0,
    uniqueSessions: [],
  };

  const revenue = revenueStats[0] || {
    totalRevenue: 0,
    totalCredits: 0,
    transactions: 0,
  };

  return NextResponse.json({
    success: true,
    platform: {
      overview: {
        vendors: {
          total: totalVendors,
          verified: verifiedVendors,
          pending: pendingVendors,
        },
        products: {
          total: totalProducts,
          active: activeProducts,
        },
        users: totalUsers,
        categories: totalCategories,
      },
      activity: {
        views: viewData.totalViews,
        qualifiedViews: viewData.qualifiedViews,
        contactClicks: viewData.contactClicks,
        uniqueVisitors: viewData.uniqueSessions?.length || 0,
        qualificationRate: viewData.totalViews > 0
          ? Math.round((viewData.qualifiedViews / viewData.totalViews) * 100)
          : 0,
      },
      revenue: {
        total: revenue.totalRevenue,
        credits: revenue.totalCredits,
        transactions: revenue.transactions,
      },
      dailyTrend,
    },
  });
}

async function getVendorStats(dateFrom: Date) {
  const [tierDistribution, cityDistribution, newVendors, topVendors] = await Promise.all([
    // Distribution by tier
    Vendor.aggregate([
      { $match: { isActive: true, verificationStatus: 'verified' } },
      { $group: { _id: '$graduationTier', count: { $sum: 1 } } },
    ]),

    // Distribution by city
    Vendor.aggregate([
      { $match: { isActive: true, verificationStatus: 'verified' } },
      { $group: { _id: '$address.city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),

    // New vendors in period
    Vendor.countDocuments({ createdAt: { $gte: dateFrom } }),

    // Top vendors by views
    ProductView.aggregate([
      {
        $match: {
          timestamp: { $gte: dateFrom },
          isBot: false,
        },
      },
      {
        $group: {
          _id: '$vendorId',
          views: { $sum: 1 },
          clicks: { $sum: { $cond: ['$clickedContact', 1, 0] } },
        },
      },
      { $sort: { views: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'vendors',
          localField: '_id',
          foreignField: '_id',
          as: 'vendor',
        },
      },
      { $unwind: '$vendor' },
      {
        $project: {
          storeName: '$vendor.storeName',
          views: 1,
          clicks: 1,
          ctr: {
            $multiply: [{ $divide: ['$clicks', '$views'] }, 100],
          },
        },
      },
    ]),
  ]);

  return NextResponse.json({
    success: true,
    vendors: {
      tierDistribution: Object.fromEntries(
        tierDistribution.map((t) => [t._id, t.count])
      ),
      cityDistribution,
      newVendors,
      topVendors: topVendors.map((v) => ({
        ...v,
        ctr: Math.round(v.ctr * 10) / 10,
      })),
    },
  });
}

async function getRevenueStats(dateFrom: Date) {
  const [dailyRevenue, revenueByMethod, topSpenders] = await Promise.all([
    // Daily revenue
    ViewTransaction.aggregate([
      {
        $match: {
          transactionType: 'purchase',
          status: 'completed',
          createdAt: { $gte: dateFrom },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$purchaseDetails.amount' },
          credits: { $sum: '$purchaseDetails.creditsAdded' },
          transactions: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // Revenue by payment method
    ViewTransaction.aggregate([
      {
        $match: {
          transactionType: 'purchase',
          status: 'completed',
          createdAt: { $gte: dateFrom },
        },
      },
      {
        $group: {
          _id: '$purchaseDetails.paymentMethod',
          revenue: { $sum: '$purchaseDetails.amount' },
          count: { $sum: 1 },
        },
      },
    ]),

    // Top spenders
    ViewTransaction.aggregate([
      {
        $match: {
          transactionType: 'purchase',
          status: 'completed',
          createdAt: { $gte: dateFrom },
        },
      },
      {
        $group: {
          _id: '$vendorId',
          totalSpent: { $sum: '$purchaseDetails.amount' },
          purchases: { $sum: 1 },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'vendors',
          localField: '_id',
          foreignField: '_id',
          as: 'vendor',
        },
      },
      { $unwind: '$vendor' },
      {
        $project: {
          storeName: '$vendor.storeName',
          totalSpent: 1,
          purchases: 1,
        },
      },
    ]),
  ]);

  return NextResponse.json({
    success: true,
    revenue: {
      dailyRevenue,
      revenueByMethod: Object.fromEntries(
        revenueByMethod.map((r) => [r._id || 'unknown', { revenue: r.revenue, count: r.count }])
      ),
      topSpenders,
    },
  });
}

async function getCategoryStats(dateFrom: Date) {
  const [categoryViews, categoryProducts] = await Promise.all([
    // Views by category
    ProductView.aggregate([
      {
        $match: {
          timestamp: { $gte: dateFrom },
          isBot: false,
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.category',
          views: { $sum: 1 },
          clicks: { $sum: { $cond: ['$clickedContact', 1, 0] } },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
      {
        $project: {
          name: '$category.name',
          slug: '$category.slug',
          views: 1,
          clicks: 1,
        },
      },
      { $sort: { views: -1 } },
      { $limit: 20 },
    ]),

    // Products by category
    Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
      {
        $project: {
          name: '$category.name',
          count: 1,
        },
      },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]),
  ]);

  return NextResponse.json({
    success: true,
    categories: {
      viewsByCategory: categoryViews,
      productsByCategory: categoryProducts,
    },
  });
}

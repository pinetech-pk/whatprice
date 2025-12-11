import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
import Vendor from '@/models/Vendor';
import Product from '@/models/Product';
import ProductView from '@/models/ProductView';
import ViewTransaction from '@/models/ViewTransaction';
import { getVendorSession } from '@/lib/auth/vendorAuth';

// GET: Vendor dashboard overview
export async function GET() {
  try {
    const session = await getVendorSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    await connectDB();

    const vendor = await Vendor.findById(session.vendorId);
    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Get date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);

    // Get product stats
    const [totalProducts, activeProducts, topProducts] = await Promise.all([
      Product.countDocuments({ vendorId: vendor._id }),
      Product.countDocuments({ vendorId: vendor._id, isActive: true }),
      Product.find({ vendorId: vendor._id, isActive: true })
        .sort({ viewCount: -1 })
        .limit(5)
        .select('name slug price viewCount rating'),
    ]);

    // Get today's view stats
    const todayViews = await ProductView.aggregate([
      {
        $match: {
          vendorId: vendor._id,
          timestamp: { $gte: today },
          isBot: false,
        },
      },
      {
        $group: {
          _id: null,
          totalViews: { $sum: 1 },
          qualifiedViews: { $sum: { $cond: ['$isQualifiedView', 1, 0] } },
          contactClicks: { $sum: { $cond: ['$clickedContact', 1, 0] } },
          charged: { $sum: { $cond: ['$cpvCharged', '$cpvAmount', 0] } },
          uniqueSessions: { $addToSet: '$sessionId' },
        },
      },
    ]);

    // Get yesterday's view stats for comparison
    const yesterdayViews = await ProductView.aggregate([
      {
        $match: {
          vendorId: vendor._id,
          timestamp: { $gte: yesterday, $lt: today },
          isBot: false,
        },
      },
      {
        $group: {
          _id: null,
          totalViews: { $sum: 1 },
        },
      },
    ]);

    // Get last 7 days view trend
    const weeklyTrend = await ProductView.aggregate([
      {
        $match: {
          vendorId: vendor._id,
          timestamp: { $gte: weekAgo },
          isBot: false,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' },
          },
          views: { $sum: 1 },
          qualified: { $sum: { $cond: ['$isQualifiedView', 1, 0] } },
          clicks: { $sum: { $cond: ['$clickedContact', 1, 0] } },
          spent: { $sum: { $cond: ['$cpvCharged', '$cpvAmount', 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get recent transactions
    const recentTransactions = await ViewTransaction.find({
      vendorId: vendor._id,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('transactionType creditChange status createdAt description');

    // Get monthly spending
    const monthlySpending = await ViewTransaction.aggregate([
      {
        $match: {
          vendorId: vendor._id,
          transactionType: 'deduction',
          status: 'completed',
          createdAt: { $gte: monthAgo },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $abs: '$creditChange' } },
        },
      },
    ]);

    // Calculate CPV rate and estimated views remaining
    const cpvRate = vendor.getCpvRate();
    const estimatedViewsRemaining = Math.floor(vendor.viewCredits / (cpvRate / 100));

    // Prepare today's stats
    const todayStats = todayViews[0] || {
      totalViews: 0,
      qualifiedViews: 0,
      contactClicks: 0,
      charged: 0,
      uniqueSessions: [],
    };

    const yesterdayTotal = yesterdayViews[0]?.totalViews || 0;
    const viewsChange = yesterdayTotal > 0
      ? ((todayStats.totalViews - yesterdayTotal) / yesterdayTotal) * 100
      : 0;

    return NextResponse.json({
      success: true,
      // Return data in the format expected by VendorDashboardResponse type
      todayStats: {
        views: todayStats.totalViews,
        qualifiedViews: todayStats.qualifiedViews,
        contactClicks: todayStats.contactClicks,
        cpvCharged: todayStats.charged,
      },
      yesterdayComparison: {
        views: yesterdayTotal,
        viewsChange: Math.round(viewsChange),
        qualifiedViews: 0, // Not tracked separately for yesterday
        qualifiedViewsChange: 0,
      },
      weeklyTrend: weeklyTrend.map((day) => ({
        date: day._id,
        views: day.views,
        qualifiedViews: day.qualified,
        cpvCharged: day.spent,
      })),
      topProducts: topProducts.map((p) => ({
        _id: p._id.toString(),
        name: p.name,
        views: p.viewCount || 0,
        clicks: 0, // Calculate if needed
        conversionRate: 0,
      })),
      recentTransactions: recentTransactions.map((tx) => ({
        _id: tx._id.toString(),
        type: tx.transactionType,
        amount: 0,
        creditChange: tx.creditChange,
        createdAt: tx.createdAt,
      })),
      creditBalance: vendor.viewCredits,
      cpvRate,
      estimatedViewsRemaining,
      monthlySpending: {
        total: monthlySpending[0]?.total || 0,
        viewsCharged: 0, // Calculate if needed
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard' },
      { status: 500 }
    );
  }
}

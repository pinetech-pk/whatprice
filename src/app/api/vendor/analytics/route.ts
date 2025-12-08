import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
import Vendor from '@/models/Vendor';
import Product from '@/models/Product';
import ProductView from '@/models/ProductView';
import VendorMetrics from '@/models/VendorMetrics';
import { getVendorSession } from '@/lib/auth/vendorAuth';
import mongoose from 'mongoose';

// GET: Detailed vendor analytics
export async function GET(request: Request) {
  try {
    const session = await getVendorSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d'; // 7d, 30d, 90d, custom
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const report = searchParams.get('report') || 'overview'; // overview, products, views, spending

    await connectDB();

    const vendor = await Vendor.findById(session.vendorId);
    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Calculate date range
    let dateFrom: Date;
    let dateTo: Date = new Date();

    if (startDate && endDate) {
      dateFrom = new Date(startDate);
      dateTo = new Date(endDate);
    } else {
      dateFrom = new Date();
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
          dateFrom.setDate(dateFrom.getDate() - 7);
      }
    }

    dateFrom.setHours(0, 0, 0, 0);
    dateTo.setHours(23, 59, 59, 999);

    const vendorId = new mongoose.Types.ObjectId(session.vendorId);

    switch (report) {
      case 'overview':
        return await getOverviewAnalytics(vendorId, dateFrom, dateTo);
      case 'products':
        return await getProductAnalytics(vendorId, dateFrom, dateTo);
      case 'views':
        return await getViewAnalytics(vendorId, dateFrom, dateTo);
      case 'spending':
        return await getSpendingAnalytics(vendorId, dateFrom, dateTo);
      default:
        return await getOverviewAnalytics(vendorId, dateFrom, dateTo);
    }
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to load analytics' },
      { status: 500 }
    );
  }
}

async function getOverviewAnalytics(
  vendorId: mongoose.Types.ObjectId,
  dateFrom: Date,
  dateTo: Date
) {
  // Get aggregated metrics
  const [viewStats, deviceStats, sourceStats, dailyTrend] = await Promise.all([
    // Overall view stats
    ProductView.aggregate([
      {
        $match: {
          vendorId,
          timestamp: { $gte: dateFrom, $lte: dateTo },
          isBot: false,
        },
      },
      {
        $group: {
          _id: null,
          totalViews: { $sum: 1 },
          qualifiedViews: { $sum: { $cond: ['$isQualifiedView', 1, 0] } },
          contactClicks: { $sum: { $cond: ['$clickedContact', 1, 0] } },
          totalSpent: { $sum: { $cond: ['$cpvCharged', '$cpvAmount', 0] } },
          avgDuration: { $avg: '$viewDuration' },
          uniqueSessions: { $addToSet: '$sessionId' },
        },
      },
    ]),

    // Views by device
    ProductView.aggregate([
      {
        $match: {
          vendorId,
          timestamp: { $gte: dateFrom, $lte: dateTo },
          isBot: false,
        },
      },
      {
        $group: {
          _id: '$deviceType',
          count: { $sum: 1 },
        },
      },
    ]),

    // Views by source type
    ProductView.aggregate([
      {
        $match: {
          vendorId,
          timestamp: { $gte: dateFrom, $lte: dateTo },
          isBot: false,
        },
      },
      {
        $group: {
          _id: '$viewType',
          count: { $sum: 1 },
        },
      },
    ]),

    // Daily trend
    ProductView.aggregate([
      {
        $match: {
          vendorId,
          timestamp: { $gte: dateFrom, $lte: dateTo },
          isBot: false,
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          views: { $sum: 1 },
          qualified: { $sum: { $cond: ['$isQualifiedView', 1, 0] } },
          clicks: { $sum: { $cond: ['$clickedContact', 1, 0] } },
          spent: { $sum: { $cond: ['$cpvCharged', '$cpvAmount', 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const stats = viewStats[0] || {
    totalViews: 0,
    qualifiedViews: 0,
    contactClicks: 0,
    totalSpent: 0,
    avgDuration: 0,
    uniqueSessions: [],
  };

  return NextResponse.json({
    success: true,
    analytics: {
      period: { from: dateFrom, to: dateTo },
      summary: {
        totalViews: stats.totalViews,
        qualifiedViews: stats.qualifiedViews,
        uniqueVisitors: stats.uniqueSessions?.length || 0,
        contactClicks: stats.contactClicks,
        totalSpent: Math.round(stats.totalSpent * 100) / 100,
        avgViewDuration: Math.round(stats.avgDuration * 10) / 10,
        qualificationRate: stats.totalViews > 0
          ? Math.round((stats.qualifiedViews / stats.totalViews) * 100)
          : 0,
        clickThroughRate: stats.totalViews > 0
          ? Math.round((stats.contactClicks / stats.totalViews) * 1000) / 10
          : 0,
      },
      byDevice: Object.fromEntries(
        deviceStats.map((d) => [d._id || 'unknown', d.count])
      ),
      bySource: Object.fromEntries(
        sourceStats.map((s) => [s._id || 'direct', s.count])
      ),
      dailyTrend,
    },
  });
}

async function getProductAnalytics(
  vendorId: mongoose.Types.ObjectId,
  dateFrom: Date,
  dateTo: Date
) {
  // Get per-product analytics
  const productStats = await ProductView.aggregate([
    {
      $match: {
        vendorId,
        timestamp: { $gte: dateFrom, $lte: dateTo },
        isBot: false,
      },
    },
    {
      $group: {
        _id: '$productId',
        views: { $sum: 1 },
        qualifiedViews: { $sum: { $cond: ['$isQualifiedView', 1, 0] } },
        clicks: { $sum: { $cond: ['$clickedContact', 1, 0] } },
        spent: { $sum: { $cond: ['$cpvCharged', '$cpvAmount', 0] } },
        avgDuration: { $avg: '$viewDuration' },
      },
    },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
    {
      $project: {
        productId: '$_id',
        name: '$product.name',
        slug: '$product.slug',
        price: '$product.price',
        currentBid: '$product.currentBid',
        views: 1,
        qualifiedViews: 1,
        clicks: 1,
        spent: 1,
        avgDuration: 1,
        ctr: {
          $multiply: [
            { $cond: [{ $eq: ['$views', 0] }, 0, { $divide: ['$clicks', '$views'] }] },
            100,
          ],
        },
      },
    },
    { $sort: { views: -1 } },
    { $limit: 50 },
  ]);

  return NextResponse.json({
    success: true,
    analytics: {
      period: { from: dateFrom, to: dateTo },
      products: productStats.map((p) => ({
        ...p,
        spent: Math.round(p.spent * 100) / 100,
        avgDuration: Math.round(p.avgDuration * 10) / 10,
        ctr: Math.round(p.ctr * 10) / 10,
      })),
    },
  });
}

async function getViewAnalytics(
  vendorId: mongoose.Types.ObjectId,
  dateFrom: Date,
  dateTo: Date
) {
  // Get hourly distribution
  const hourlyDistribution = await ProductView.aggregate([
    {
      $match: {
        vendorId,
        timestamp: { $gte: dateFrom, $lte: dateTo },
        isBot: false,
      },
    },
    {
      $group: {
        _id: { $hour: '$timestamp' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Get view quality distribution
  const qualityDistribution = await ProductView.aggregate([
    {
      $match: {
        vendorId,
        timestamp: { $gte: dateFrom, $lte: dateTo },
        isBot: false,
      },
    },
    {
      $bucket: {
        groupBy: '$viewDuration',
        boundaries: [0, 3, 10, 30, 60, 300],
        default: '300+',
        output: {
          count: { $sum: 1 },
        },
      },
    },
  ]);

  // Get duplicate and bot stats
  const fraudStats = await ProductView.aggregate([
    {
      $match: {
        vendorId,
        timestamp: { $gte: dateFrom, $lte: dateTo },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        duplicates: { $sum: { $cond: ['$isDuplicate', 1, 0] } },
        bots: { $sum: { $cond: ['$isBot', 1, 0] } },
      },
    },
  ]);

  return NextResponse.json({
    success: true,
    analytics: {
      period: { from: dateFrom, to: dateTo },
      hourlyDistribution: Object.fromEntries(
        hourlyDistribution.map((h) => [h._id, h.count])
      ),
      qualityDistribution: qualityDistribution.map((q) => ({
        range: q._id === 0 ? '0-3s' : q._id === 3 ? '3-10s' : q._id === 10 ? '10-30s' : q._id === 30 ? '30-60s' : q._id === 60 ? '1-5min' : '5min+',
        count: q.count,
      })),
      fraudPrevention: fraudStats[0] || { total: 0, duplicates: 0, bots: 0 },
    },
  });
}

async function getSpendingAnalytics(
  vendorId: mongoose.Types.ObjectId,
  dateFrom: Date,
  dateTo: Date
) {
  // Get daily spending
  const dailySpending = await ProductView.aggregate([
    {
      $match: {
        vendorId,
        timestamp: { $gte: dateFrom, $lte: dateTo },
        cpvCharged: true,
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
        spent: { $sum: '$cpvAmount' },
        views: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Get spending by product
  const spendingByProduct = await ProductView.aggregate([
    {
      $match: {
        vendorId,
        timestamp: { $gte: dateFrom, $lte: dateTo },
        cpvCharged: true,
      },
    },
    {
      $group: {
        _id: '$productId',
        spent: { $sum: '$cpvAmount' },
        views: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
    {
      $project: {
        name: '$product.name',
        spent: 1,
        views: 1,
        costPerView: { $divide: ['$spent', '$views'] },
      },
    },
    { $sort: { spent: -1 } },
    { $limit: 20 },
  ]);

  // Get total spending stats
  const totalStats = await ProductView.aggregate([
    {
      $match: {
        vendorId,
        timestamp: { $gte: dateFrom, $lte: dateTo },
        cpvCharged: true,
      },
    },
    {
      $group: {
        _id: null,
        totalSpent: { $sum: '$cpvAmount' },
        totalViews: { $sum: 1 },
        avgCpv: { $avg: '$cpvAmount' },
      },
    },
  ]);

  return NextResponse.json({
    success: true,
    analytics: {
      period: { from: dateFrom, to: dateTo },
      summary: totalStats[0] || { totalSpent: 0, totalViews: 0, avgCpv: 0 },
      dailySpending: dailySpending.map((d) => ({
        ...d,
        spent: Math.round(d.spent * 100) / 100,
      })),
      spendingByProduct: spendingByProduct.map((p) => ({
        ...p,
        spent: Math.round(p.spent * 100) / 100,
        costPerView: Math.round(p.costPerView * 1000) / 1000,
      })),
    },
  });
}

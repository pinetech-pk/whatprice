import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db/connection';
import Vendor from '@/models/Vendor';
import User from '@/models/User';
import Product from '@/models/Product';
import ProductView from '@/models/ProductView';
import ViewTransaction from '@/models/ViewTransaction';
import MasterProductRequest from '@/models/MasterProductRequest';
import MasterProduct from '@/models/MasterProduct';

async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return !!session;
}

// GET: Get vendor details with comprehensive stats
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const vendor = await Vendor.findById(id).populate('userId', 'firstName lastName email phone isActive lastLogin createdAt');

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Get product/listing stats
    const [
      totalListings,
      activeListings,
      inactiveListings,
      comparativeListings,
    ] = await Promise.all([
      Product.countDocuments({ vendorId: vendor._id, deletedAt: null }),
      Product.countDocuments({ vendorId: vendor._id, deletedAt: null, isActive: true }),
      Product.countDocuments({ vendorId: vendor._id, deletedAt: null, isActive: false }),
      Product.countDocuments({ vendorId: vendor._id, deletedAt: null, productType: 'comparative' }),
    ]);

    // Get MasterProductRequest stats
    const productRequestStats = await MasterProductRequest.aggregate([
      { $match: { vendorId: vendor._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const requestCounts = {
      pending: 0,
      approved: 0,
      rejected: 0,
      merged: 0,
      total: 0,
    };

    for (const stat of productRequestStats) {
      if (stat._id in requestCounts) {
        requestCounts[stat._id as keyof typeof requestCounts] = stat.count;
        requestCounts.total += stat.count;
      }
    }

    // Get count of unique MasterProducts vendor is linked to
    const linkedMasterProducts = await Product.distinct('masterProductId', {
      vendorId: vendor._id,
      deletedAt: null,
      masterProductId: { $ne: null },
    });

    // Get recent views (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const viewStats = await ProductView.aggregate([
      {
        $match: {
          vendorId: vendor._id,
          timestamp: { $gte: thirtyDaysAgo },
          isBot: false,
        },
      },
      {
        $group: {
          _id: null,
          totalViews: { $sum: 1 },
          qualifiedViews: { $sum: { $cond: ['$isQualifiedView', 1, 0] } },
          totalSpent: { $sum: { $cond: ['$cpvCharged', '$cpvAmount', 0] } },
        },
      },
    ]);

    // Get recent transactions
    const recentTransactions = await ViewTransaction.find({ vendorId: vendor._id })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get all-time transaction totals
    const transactionTotals = await ViewTransaction.aggregate([
      { $match: { vendorId: vendor._id, status: 'completed' } },
      {
        $group: {
          _id: '$transactionType',
          total: { $sum: '$creditChange' },
          count: { $sum: 1 },
        },
      },
    ]);

    const transactionSummary: Record<string, { total: number; count: number }> = {};
    for (const t of transactionTotals) {
      transactionSummary[t._id] = { total: t.total, count: t.count };
    }

    // Get top products by views
    const topProducts = await Product.find({ vendorId: vendor._id, deletedAt: null })
      .sort({ viewCount: -1 })
      .limit(5)
      .select('name slug price viewCount rating isActive masterProductId productType');

    // Get recent product requests
    const recentRequests = await MasterProductRequest.find({ vendorId: vendor._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name brand status createdAt highestDuplicateScore');

    // Get all listings for this vendor (for detailed view)
    const allListings = await Product.find({ vendorId: vendor._id, deletedAt: null })
      .populate('masterProductId', 'name slug vendorCount')
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(20)
      .select('name slug price originalPrice stock isActive productType viewCount createdAt masterProductId category');

    return NextResponse.json({
      success: true,
      vendor: {
        ...vendor.toObject(),
        stats: {
          listings: {
            total: totalListings,
            active: activeListings,
            inactive: inactiveListings,
            comparative: comparativeListings,
          },
          productRequests: requestCounts,
          linkedMasterProducts: linkedMasterProducts.length,
          recentActivity: viewStats[0] || {
            totalViews: 0,
            qualifiedViews: 0,
            totalSpent: 0,
          },
          transactionSummary,
        },
        recentTransactions,
        topProducts,
        recentRequests,
        allListings,
      },
    });
  } catch (error) {
    console.error('Admin get vendor error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendor' },
      { status: 500 }
    );
  }
}

// PUT: Update vendor (verification, status, credits)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    await connectDB();

    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Handle verification
    if (body.action === 'verify') {
      vendor.verificationStatus = 'verified';
      vendor.verifiedAt = new Date();
      vendor.rejectionReason = undefined;
      await vendor.save();

      return NextResponse.json({
        success: true,
        message: 'Vendor verified successfully',
      });
    }

    // Handle rejection
    if (body.action === 'reject') {
      if (!body.reason) {
        return NextResponse.json(
          { error: 'Rejection reason is required' },
          { status: 400 }
        );
      }
      vendor.verificationStatus = 'rejected';
      vendor.rejectionReason = body.reason;
      await vendor.save();

      return NextResponse.json({
        success: true,
        message: 'Vendor rejected',
      });
    }

    // Handle activation/deactivation
    if (body.action === 'activate') {
      vendor.isActive = true;
      await vendor.save();
      return NextResponse.json({
        success: true,
        message: 'Vendor activated',
      });
    }

    if (body.action === 'deactivate') {
      vendor.isActive = false;
      await vendor.save();
      return NextResponse.json({
        success: true,
        message: 'Vendor deactivated',
      });
    }

    // Handle feature toggle
    if (body.action === 'feature') {
      vendor.isFeatured = !vendor.isFeatured;
      await vendor.save();
      return NextResponse.json({
        success: true,
        message: vendor.isFeatured ? 'Vendor featured' : 'Vendor unfeatured',
      });
    }

    // Handle adding bonus credits
    if (body.action === 'addCredits') {
      if (!body.credits || body.credits <= 0) {
        return NextResponse.json(
          { error: 'Valid credit amount is required' },
          { status: 400 }
        );
      }

      const currentBalance = vendor.viewCredits;
      vendor.viewCredits += body.credits;
      await vendor.save();

      // Create bonus transaction
      await ViewTransaction.create({
        vendorId: vendor._id,
        transactionType: 'bonus',
        creditBalanceBefore: currentBalance,
        creditBalanceAfter: vendor.viewCredits,
        creditChange: body.credits,
        status: 'completed',
        description: body.reason || `Admin bonus: ${body.credits} credits`,
        notes: body.notes,
      });

      return NextResponse.json({
        success: true,
        message: `Added ${body.credits} credits to vendor`,
        newBalance: vendor.viewCredits,
      });
    }

    // Handle tier change
    if (body.action === 'changeTier') {
      if (!['starter', 'growth', 'standard'].includes(body.tier)) {
        return NextResponse.json(
          { error: 'Invalid tier' },
          { status: 400 }
        );
      }
      vendor.graduationTier = body.tier;
      await vendor.save();

      return NextResponse.json({
        success: true,
        message: `Tier changed to ${body.tier}`,
      });
    }

    // Handle restore from trash
    if (body.action === 'restore') {
      if (!vendor.deletedAt) {
        return NextResponse.json(
          { error: 'Vendor is not in trash' },
          { status: 400 }
        );
      }

      await vendor.restore();

      // Also reactivate the user account
      await User.updateOne(
        { _id: vendor.userId },
        { isActive: true }
      );

      return NextResponse.json({
        success: true,
        message: 'Vendor restored successfully',
      });
    }

    // Handle permanent delete (immediate, no grace period)
    if (body.action === 'permanentDelete') {
      // This should only work for vendors already in trash
      if (!vendor.deletedAt) {
        return NextResponse.json(
          { error: 'Vendor must be in trash before permanent deletion. Use DELETE method first.' },
          { status: 400 }
        );
      }

      // Import the cleanup service
      const { permanentlyDeleteVendor } = await import('@/lib/services/vendorCleanup');
      await permanentlyDeleteVendor(vendor._id.toString());

      return NextResponse.json({
        success: true,
        message: 'Vendor permanently deleted',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Admin update vendor error:', error);
    return NextResponse.json(
      { error: 'Failed to update vendor' },
      { status: 500 }
    );
  }
}

// DELETE: Soft delete vendor (moves to trash with 30-day grace period)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const url = new URL(request.url);
    const reason = url.searchParams.get('reason') || undefined;
    const graceDays = parseInt(url.searchParams.get('graceDays') || '30');

    await connectDB();

    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Check if already in trash
    if (vendor.deletedAt) {
      return NextResponse.json(
        { error: 'Vendor is already in trash' },
        { status: 400 }
      );
    }

    // Check for remaining credits - warn admin
    const hasCredits = vendor.viewCredits > 0;

    // Get a placeholder admin ID (in production, get from session)
    // For now, we'll use the vendor's own userId as deletedBy
    const adminId = vendor.userId;

    // Soft delete using the model method
    await vendor.softDelete(adminId, reason, graceDays);

    // Also deactivate the user account
    await User.updateOne(
      { _id: vendor.userId },
      { isActive: false }
    );

    const deleteDate = new Date();
    deleteDate.setDate(deleteDate.getDate() + graceDays);

    return NextResponse.json({
      success: true,
      message: `Vendor moved to trash. Will be permanently deleted on ${deleteDate.toLocaleDateString()}.`,
      warning: hasCredits
        ? `Warning: Vendor has ${vendor.viewCredits} unused credits that will be lost.`
        : undefined,
      deleteScheduledFor: deleteDate,
      graceDays,
    });
  } catch (error) {
    console.error('Admin delete vendor error:', error);
    return NextResponse.json(
      { error: 'Failed to delete vendor' },
      { status: 500 }
    );
  }
}

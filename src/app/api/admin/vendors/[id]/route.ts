import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db/connection';
import Vendor from '@/models/Vendor';
import User from '@/models/User';
import Product from '@/models/Product';
import ProductView from '@/models/ProductView';
import ViewTransaction from '@/models/ViewTransaction';

async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return !!session;
}

// GET: Get vendor details
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

    const vendor = await Vendor.findById(id).populate('userId', 'firstName lastName email phone isActive lastLogin');

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Get product stats
    const [productCount, activeProductCount] = await Promise.all([
      Product.countDocuments({ vendorId: vendor._id }),
      Product.countDocuments({ vendorId: vendor._id, isActive: true }),
    ]);

    // Get recent views
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

    // Get top products
    const topProducts = await Product.find({ vendorId: vendor._id })
      .sort({ viewCount: -1 })
      .limit(5)
      .select('name slug price viewCount rating isActive');

    return NextResponse.json({
      success: true,
      vendor: {
        ...vendor.toObject(),
        productStats: {
          total: productCount,
          active: activeProductCount,
        },
        recentActivity: viewStats[0] || {
          totalViews: 0,
          qualifiedViews: 0,
          totalSpent: 0,
        },
        recentTransactions,
        topProducts,
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

// DELETE: Delete vendor (soft delete)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Soft delete - deactivate vendor and their products
    vendor.isActive = false;
    await vendor.save();

    // Deactivate all vendor products
    await Product.updateMany(
      { vendorId: vendor._id },
      { isActive: false }
    );

    // Also deactivate the user account
    await User.updateOne(
      { _id: vendor.userId },
      { isActive: false }
    );

    return NextResponse.json({
      success: true,
      message: 'Vendor account deactivated',
    });
  } catch (error) {
    console.error('Admin delete vendor error:', error);
    return NextResponse.json(
      { error: 'Failed to delete vendor' },
      { status: 500 }
    );
  }
}

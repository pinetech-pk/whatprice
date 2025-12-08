import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
import Vendor from '@/models/Vendor';
import ViewTransaction from '@/models/ViewTransaction';
import { getVendorSession } from '@/lib/auth/vendorAuth';
import { purchaseCredits, getCreditPricing } from '@/lib/billing/cpvService';

// GET: Get credit balance and pricing
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
    const action = searchParams.get('action');

    await connectDB();

    const vendor = await Vendor.findById(session.vendorId);
    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    if (action === 'pricing') {
      // Return pricing tiers
      return NextResponse.json({
        success: true,
        pricing: getCreditPricing(),
      });
    }

    if (action === 'transactions') {
      // Return transaction history
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const type = searchParams.get('type'); // purchase, deduction, etc.

      const query: Record<string, unknown> = { vendorId: vendor._id };
      if (type) {
        query.transactionType = type;
      }

      const [transactions, total] = await Promise.all([
        ViewTransaction.find(query)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit),
        ViewTransaction.countDocuments(query),
      ]);

      return NextResponse.json({
        success: true,
        transactions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    }

    // Default: Return balance summary
    const cpvRate = vendor.getCpvRate();
    const estimatedViews = Math.floor(vendor.viewCredits / (cpvRate / 100));

    // Get recent spending summary
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const spendingSummary = await ViewTransaction.aggregate([
      {
        $match: {
          vendorId: vendor._id,
          createdAt: { $gte: thirtyDaysAgo },
          status: 'completed',
        },
      },
      {
        $group: {
          _id: '$transactionType',
          totalChange: { $sum: '$creditChange' },
          count: { $sum: 1 },
        },
      },
    ]);

    const summary = {
      purchases: 0,
      deductions: 0,
      purchaseCount: 0,
      deductionCount: 0,
    };

    for (const item of spendingSummary) {
      if (item._id === 'purchase') {
        summary.purchases = item.totalChange;
        summary.purchaseCount = item.count;
      } else if (item._id === 'deduction') {
        summary.deductions = Math.abs(item.totalChange);
        summary.deductionCount = item.count;
      }
    }

    return NextResponse.json({
      success: true,
      balance: {
        credits: vendor.viewCredits,
        estimatedViews,
        cpvRate,
        graduationTier: vendor.graduationTier,
        dailyBudget: vendor.maxDailyBudget,
        currentDailySpend: vendor.currentDailySpend,
      },
      stats: {
        totalPurchased: vendor.totalCreditsPurchased,
        totalUsed: vendor.totalCreditsUsed,
        totalSpent: vendor.totalSpent,
      },
      last30Days: summary,
    });
  } catch (error) {
    console.error('Get credits error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credits' },
      { status: 500 }
    );
  }
}

// POST: Purchase credits
export async function POST(request: Request) {
  try {
    const session = await getVendorSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate purchase request
    if (!body.credits || !body.amount || !body.paymentMethod) {
      return NextResponse.json(
        { error: 'Credits, amount, and payment method are required' },
        { status: 400 }
      );
    }

    // Validate against pricing tiers
    const pricing = getCreditPricing();
    const tier = pricing.tiers.find((t) => t.credits === body.credits);

    if (!tier || tier.price !== body.amount) {
      return NextResponse.json(
        { error: 'Invalid credit package selected' },
        { status: 400 }
      );
    }

    await connectDB();

    // In a real implementation, you would:
    // 1. Verify payment with payment gateway
    // 2. Handle payment failures
    // 3. Create payment intent first, then fulfill

    const result = await purchaseCredits({
      vendorId: session.vendorId,
      amount: body.amount,
      credits: body.credits,
      paymentMethod: body.paymentMethod,
      paymentId: body.paymentId,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully purchased ${body.credits} credits`,
      newBalance: result.newBalance,
      transaction: result.transaction,
    });
  } catch (error) {
    console.error('Purchase credits error:', error);
    return NextResponse.json(
      { error: 'Failed to purchase credits' },
      { status: 500 }
    );
  }
}

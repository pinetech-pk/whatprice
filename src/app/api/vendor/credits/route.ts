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

    await connectDB();

    const vendor = await Vendor.findById(session.vendorId);
    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Get params for pagination and filtering
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type'); // purchase, deduction, etc.

    // Build query for transactions
    const query: Record<string, unknown> = { vendorId: vendor._id };
    if (type) {
      query.transactionType = type;
    }

    // Fetch balance info
    const cpvRate = vendor.getCpvRate();
    const estimatedViews = Math.floor(vendor.viewCredits / (cpvRate / 100));

    // Fetch transactions with pagination
    const [transactions, total] = await Promise.all([
      ViewTransaction.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      ViewTransaction.countDocuments(query),
    ]);

    // Get pricing tiers
    const pricing = getCreditPricing();

    // Map transactions to expected CreditTransaction format
    const mappedTransactions = transactions.map((tx) => ({
      _id: tx._id.toString(),
      vendorId: tx.vendorId?.toString(),
      type: tx.transactionType, // Map transactionType to type
      amount: tx.purchaseDetails?.amount || 0, // Access nested purchaseDetails
      currency: tx.purchaseDetails?.currency || 'PKR',
      creditsAdded: tx.creditChange > 0 ? tx.creditChange : undefined,
      creditsDeducted: tx.creditChange < 0 ? Math.abs(tx.creditChange) : undefined,
      creditChange: tx.creditChange,
      creditBalanceBefore: tx.creditBalanceBefore || 0,
      creditBalanceAfter: tx.creditBalanceAfter || 0,
      reason: tx.description,
      status: tx.status,
      createdAt: tx.createdAt,
    }));

    // Return data in the format expected by CreditsResponse type
    return NextResponse.json({
      success: true,
      balance: {
        balance: vendor.viewCredits, // Map credits to balance field
        tier: vendor.graduationTier, // Map graduationTier to tier field
        cpvRate,
        estimatedViews,
      },
      transactions: mappedTransactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      pricingTiers: pricing.tiers.map((t, index) => ({
        credits: t.credits,
        price: t.price,
        pricePerCredit: Math.round((t.price / t.credits) * 100) / 100,
        popular: index === 2, // Mark the 10,000 credits tier as popular
      })),
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

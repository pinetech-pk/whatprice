import mongoose from 'mongoose';
import Vendor from '@/models/Vendor';
import Product from '@/models/Product';
import ProductView from '@/models/ProductView';
import ViewTransaction from '@/models/ViewTransaction';
import VendorMetrics from '@/models/VendorMetrics';

// CPV rates per 100 views based on graduation tier
const CPV_RATES = {
  starter: 10,   // PKR 10 per 100 views (Month 1-3)
  growth: 20,    // PKR 20 per 100 views (Month 4-6)
  standard: 30,  // PKR 30 per 100 views (Month 7+)
};

// Minimum view duration for qualified view (seconds)
const MIN_QUALIFIED_DURATION = 3;

// Credits per 100 views
const CREDITS_PER_100_VIEWS = 100;

export interface ViewTrackingData {
  productId: string;
  sessionId: string;
  userId?: string;
  viewType: 'comparison' | 'direct' | 'search' | 'category';
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
  searchQuery?: string;
}

export interface ViewQualificationData {
  viewId: string;
  duration: number;
  scrollDepth?: number;
  clickedContact?: boolean;
}

/**
 * Record a new product view
 */
export async function recordProductView(data: ViewTrackingData) {
  const product = await Product.findById(data.productId);
  if (!product || !product.isActive) {
    return { success: false, error: 'Product not found or inactive' };
  }

  const vendor = await Vendor.findById(product.vendorId);
  if (!vendor || vendor.verificationStatus !== 'verified') {
    return { success: false, error: 'Vendor not found or not verified' };
  }

  // Check for duplicate view (same session, same product, within 1 hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const existingView = await ProductView.findOne({
    sessionId: data.sessionId,
    productId: data.productId,
    timestamp: { $gte: oneHourAgo },
  });

  const isDuplicate = !!existingView;

  // Detect device type
  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  if (data.userAgent) {
    if (/mobile/i.test(data.userAgent)) {
      deviceType = 'mobile';
    } else if (/tablet|ipad/i.test(data.userAgent)) {
      deviceType = 'tablet';
    }
  }

  // Simple bot detection
  const isBot = data.userAgent
    ? /bot|crawler|spider|scraper/i.test(data.userAgent)
    : false;

  // Create view record
  const view = await ProductView.create({
    productId: product._id,
    vendorId: vendor._id,
    masterProductId: product.masterProductId,
    sessionId: data.sessionId,
    userId: data.userId ? new mongoose.Types.ObjectId(data.userId) : undefined,
    viewType: data.viewType,
    userAgent: data.userAgent,
    ipAddress: data.ipAddress,
    referrer: data.referrer,
    searchQuery: data.searchQuery,
    deviceType,
    isDuplicate,
    isBot,
    viewDuration: 0,
    isQualifiedView: false,
    cpvCharged: false,
    cpvAmount: 0,
    vendorBidAmount: product.currentBid,
    timestamp: new Date(),
  });

  // Update product view count (non-blocking)
  Product.updateOne(
    { _id: product._id },
    {
      $inc: {
        viewCount: 1,
        todayViews: 1,
        weeklyViews: 1,
        monthlyViews: 1,
        impressions: 1,
      },
    }
  ).exec();

  // Update vendor total views (non-blocking)
  Vendor.updateOne(
    { _id: vendor._id },
    { $inc: { totalViews: 1 } }
  ).exec();

  return {
    success: true,
    viewId: view._id.toString(),
    isDuplicate,
    isBot,
  };
}

/**
 * Qualify a view and potentially charge CPV
 */
export async function qualifyView(data: ViewQualificationData) {
  const view = await ProductView.findById(data.viewId);
  if (!view) {
    return { success: false, error: 'View not found' };
  }

  // Don't process duplicate or bot views
  if (view.isDuplicate || view.isBot) {
    return { success: true, charged: false, reason: 'duplicate_or_bot' };
  }

  // Update view duration and qualification
  view.viewDuration = data.duration;
  view.isQualifiedView = data.duration >= MIN_QUALIFIED_DURATION;

  if (data.scrollDepth !== undefined) {
    view.scrollDepth = data.scrollDepth;
  }

  if (data.clickedContact) {
    view.clickedContact = true;
  }

  // Only charge for qualified views that haven't been charged yet
  if (view.isQualifiedView && !view.cpvCharged) {
    const result = await chargeViewCpv(view);
    if (result.success) {
      // Update product qualified views
      Product.updateOne(
        { _id: view.productId },
        { $inc: { qualifiedViews: 1 } }
      ).exec();
    }
    return result;
  }

  await view.save();
  return { success: true, charged: false, reason: 'not_qualified' };
}

/**
 * Charge CPV for a qualified view
 */
async function chargeViewCpv(view: InstanceType<typeof ProductView>) {
  const vendor = await Vendor.findById(view.vendorId);
  if (!vendor) {
    return { success: false, error: 'Vendor not found' };
  }

  const product = await Product.findById(view.productId);
  if (!product) {
    return { success: false, error: 'Product not found' };
  }

  // Get the bid amount (cost per view = bid / 100)
  const bidAmount = product.currentBid || vendor.defaultBidAmount;
  const cpvCost = bidAmount / CREDITS_PER_100_VIEWS; // Convert to per-view cost

  // Check if vendor has enough credits
  if (vendor.viewCredits < cpvCost) {
    return { success: false, error: 'Insufficient credits', needsCredits: true };
  }

  // Check daily budget limit
  if (vendor.maxDailyBudget && !vendor.canSpend(cpvCost)) {
    return { success: false, error: 'Daily budget exceeded' };
  }

  // Deduct credits from vendor
  const deducted = await vendor.deductCredits(cpvCost);
  if (!deducted) {
    return { success: false, error: 'Failed to deduct credits' };
  }

  // Update view with CPV info
  view.cpvCharged = true;
  view.cpvAmount = cpvCost;
  view.vendorBidAmount = bidAmount;
  await view.save();

  // Create deduction transaction
  await ViewTransaction.create({
    vendorId: vendor._id,
    transactionType: 'deduction',
    deductionDetails: {
      productViewId: view._id,
      productId: view.productId,
      creditsDeducted: cpvCost,
      reason: 'view_charged',
    },
    creditBalanceBefore: vendor.viewCredits + cpvCost,
    creditBalanceAfter: vendor.viewCredits,
    creditChange: -cpvCost,
    status: 'completed',
    description: `Charged for view on ${product.name}`,
  });

  // Update product budget spent
  Product.updateOne(
    { _id: product._id },
    { $inc: { budgetSpent: cpvCost } }
  ).exec();

  // Update daily vendor metrics (non-blocking)
  updateVendorMetrics(vendor._id, cpvCost, view).catch(console.error);

  return {
    success: true,
    charged: true,
    amount: cpvCost,
    newBalance: vendor.viewCredits,
  };
}

/**
 * Record contact click
 */
export async function recordContactClick(viewId: string) {
  const view = await ProductView.findById(viewId);
  if (!view) {
    return { success: false, error: 'View not found' };
  }

  view.clickedContact = true;
  await view.save();

  // Update product contact clicks
  Product.updateOne(
    { _id: view.productId },
    { $inc: { contactClicks: 1 } }
  ).exec();

  // Update vendor clicks
  Vendor.updateOne(
    { _id: view.vendorId },
    { $inc: { totalClicks: 1 } }
  ).exec();

  return { success: true };
}

/**
 * Update daily vendor metrics
 */
async function updateVendorMetrics(
  vendorId: mongoose.Types.ObjectId,
  cpvAmount: number,
  view: InstanceType<typeof ProductView>
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await VendorMetrics.updateOne(
    { vendorId, date: today },
    {
      $inc: {
        'viewMetrics.totalViews': 1,
        'viewMetrics.qualifiedViews': view.isQualifiedView ? 1 : 0,
        'viewMetrics.uniqueVisitors': 0, // Will be calculated via aggregation
        [`viewMetrics.viewsByType.${view.viewType}`]: 1,
        [`viewMetrics.viewsByDevice.${view.deviceType || 'desktop'}`]: 1,
        'cpvMetrics.totalSpent': cpvAmount,
        'cpvMetrics.chargedViews': 1,
        'engagementMetrics.contactClicks': view.clickedContact ? 1 : 0,
      },
      $setOnInsert: {
        vendorId,
        date: today,
      },
    },
    { upsert: true }
  );
}

/**
 * Purchase view credits
 */
export async function purchaseCredits(data: {
  vendorId: string;
  amount: number;
  credits: number;
  paymentMethod: string;
  paymentId?: string;
}) {
  const vendor = await Vendor.findById(data.vendorId);
  if (!vendor) {
    return { success: false, error: 'Vendor not found' };
  }

  const currentBalance = vendor.viewCredits;

  // Add credits to vendor
  await vendor.addCredits(data.credits, data.amount);

  // Create purchase transaction
  const transaction = await ViewTransaction.create({
    vendorId: vendor._id,
    transactionType: 'purchase',
    purchaseDetails: {
      amount: data.amount,
      currency: 'PKR',
      creditsAdded: data.credits,
      pricePerCredit: data.amount / data.credits,
      paymentMethod: data.paymentMethod,
      paymentId: data.paymentId,
      invoiceNumber: `INV-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    },
    creditBalanceBefore: currentBalance,
    creditBalanceAfter: currentBalance + data.credits,
    creditChange: data.credits,
    status: 'completed',
    description: `Purchased ${data.credits} view credits`,
  });

  return {
    success: true,
    newBalance: vendor.viewCredits,
    transaction: {
      id: transaction._id,
      invoiceNumber: transaction.purchaseDetails?.invoiceNumber,
    },
  };
}

/**
 * Get credit pricing tiers
 */
export function getCreditPricing() {
  return {
    tiers: [
      { credits: 1000, price: 100, pricePerCredit: 0.10, savings: 0 },
      { credits: 5000, price: 450, pricePerCredit: 0.09, savings: 10 },
      { credits: 10000, price: 800, pricePerCredit: 0.08, savings: 20 },
      { credits: 25000, price: 1750, pricePerCredit: 0.07, savings: 30 },
      { credits: 50000, price: 3000, pricePerCredit: 0.06, savings: 40 },
    ],
    currency: 'PKR',
    note: 'Each credit equals 1 view. Minimum bid is PKR 10 per 100 views.',
  };
}

import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface for static methods
export interface IProductViewStatics extends Model<IProductView> {
  isDuplicateView(sessionId: string, productId: mongoose.Types.ObjectId): Promise<boolean>;
  recordView(data: {
    productId: mongoose.Types.ObjectId;
    vendorId: mongoose.Types.ObjectId;
    masterProductId?: mongoose.Types.ObjectId;
    sessionId: string;
    userId?: mongoose.Types.ObjectId;
    viewType: 'comparison' | 'direct' | 'search' | 'category';
    userAgent?: string;
    ipAddress?: string;
    referrer?: string;
    searchQuery?: string;
  }): Promise<IProductView | null>;
  getVendorStats(
    vendorId: mongoose.Types.ObjectId,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalViews: number;
    qualifiedViews: number;
    totalCpvCharged: number;
    avgViewDuration: number;
    contactClicks: number;
    uniqueVisitors: number;
  }[]>;
  getComparisonStats(
    masterProductId: mongoose.Types.ObjectId,
    startDate: Date,
    endDate: Date
  ): Promise<{
    _id: mongoose.Types.ObjectId;
    vendorName: string;
    views: number;
    clicks: number;
    ctr: number;
  }[]>;
}

export interface IProductView extends Document {
  _id: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  masterProductId?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  sessionId: string;

  // View Details
  viewType: 'comparison' | 'direct' | 'search' | 'category';
  referrer?: string;
  searchQuery?: string;

  // Device/Location Info
  userAgent?: string;
  ipAddress?: string;
  country?: string;
  city?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';

  // View Quality
  viewDuration: number; // seconds
  isQualifiedView: boolean; // >3 seconds
  scrollDepth?: number; // percentage
  clickedContact: boolean;

  // CPV Billing
  cpvCharged: boolean;
  cpvAmount: number;
  vendorBidAmount: number;

  // Fraud Prevention
  isDuplicate: boolean;
  isBot: boolean;

  timestamp: Date;
  createdAt: Date;
}

const ProductViewSchema = new Schema<IProductView>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    masterProductId: {
      type: Schema.Types.ObjectId,
      ref: 'MasterProduct',
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    sessionId: {
      type: String,
      required: true,
    },

    // View Details
    viewType: {
      type: String,
      enum: ['comparison', 'direct', 'search', 'category'],
      default: 'direct',
    },
    referrer: String,
    searchQuery: String,

    // Device/Location
    userAgent: String,
    ipAddress: String,
    country: String,
    city: String,
    deviceType: {
      type: String,
      enum: ['mobile', 'tablet', 'desktop'],
    },

    // View Quality
    viewDuration: {
      type: Number,
      default: 0,
    },
    isQualifiedView: {
      type: Boolean,
      default: false,
    },
    scrollDepth: Number,
    clickedContact: {
      type: Boolean,
      default: false,
    },

    // CPV Billing
    cpvCharged: {
      type: Boolean,
      default: false,
    },
    cpvAmount: {
      type: Number,
      default: 0,
    },
    vendorBidAmount: {
      type: Number,
      default: 0,
    },

    // Fraud Prevention
    isDuplicate: {
      type: Boolean,
      default: false,
    },
    isBot: {
      type: Boolean,
      default: false,
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
ProductViewSchema.index({ productId: 1, timestamp: -1 });
ProductViewSchema.index({ vendorId: 1, timestamp: -1 });
ProductViewSchema.index({ userId: 1, timestamp: -1 });
ProductViewSchema.index({ sessionId: 1, productId: 1 });
ProductViewSchema.index({ timestamp: -1 });
ProductViewSchema.index({ cpvCharged: 1, timestamp: -1 });
ProductViewSchema.index({ isQualifiedView: 1, cpvCharged: 1 });
ProductViewSchema.index({ masterProductId: 1, timestamp: -1 });

// TTL Index: Auto-delete raw views after 90 days (aggregated data kept in VendorMetrics)
ProductViewSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Static: Check for duplicate view (same session, same product, within 1 hour)
ProductViewSchema.statics.isDuplicateView = async function (
  sessionId: string,
  productId: mongoose.Types.ObjectId
): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const existing = await this.findOne({
    sessionId,
    productId,
    timestamp: { $gte: oneHourAgo },
  });
  return !!existing;
};

// Static: Record a new view
ProductViewSchema.statics.recordView = async function (data: {
  productId: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  masterProductId?: mongoose.Types.ObjectId;
  sessionId: string;
  userId?: mongoose.Types.ObjectId;
  viewType: 'comparison' | 'direct' | 'search' | 'category';
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
  searchQuery?: string;
}): Promise<IProductView | null> {
  // Check for duplicate using the schema's static method
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const existing = await this.findOne({
    sessionId: data.sessionId,
    productId: data.productId,
    timestamp: { $gte: oneHourAgo },
  });
  const isDuplicate = !!existing;

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

  const view = new this({
    ...data,
    deviceType,
    isDuplicate,
    isBot,
    timestamp: new Date(),
  });

  await view.save();
  return view;
};

// Static: Get vendor view stats for date range
ProductViewSchema.statics.getVendorStats = async function (
  vendorId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date
) {
  return this.aggregate([
    {
      $match: {
        vendorId,
        timestamp: { $gte: startDate, $lte: endDate },
        isBot: false,
      },
    },
    {
      $group: {
        _id: null,
        totalViews: { $sum: 1 },
        qualifiedViews: {
          $sum: { $cond: ['$isQualifiedView', 1, 0] },
        },
        totalCpvCharged: {
          $sum: { $cond: ['$cpvCharged', '$cpvAmount', 0] },
        },
        avgViewDuration: { $avg: '$viewDuration' },
        contactClicks: {
          $sum: { $cond: ['$clickedContact', 1, 0] },
        },
        uniqueSessions: { $addToSet: '$sessionId' },
      },
    },
    {
      $project: {
        totalViews: 1,
        qualifiedViews: 1,
        totalCpvCharged: 1,
        avgViewDuration: 1,
        contactClicks: 1,
        uniqueVisitors: { $size: '$uniqueSessions' },
      },
    },
  ]);
};

// Static: Get product comparison views
ProductViewSchema.statics.getComparisonStats = async function (
  masterProductId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date
) {
  return this.aggregate([
    {
      $match: {
        masterProductId,
        viewType: 'comparison',
        timestamp: { $gte: startDate, $lte: endDate },
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
    {
      $lookup: {
        from: 'vendors',
        localField: '_id',
        foreignField: '_id',
        as: 'vendor',
      },
    },
    {
      $unwind: '$vendor',
    },
    {
      $project: {
        vendorName: '$vendor.storeName',
        views: 1,
        clicks: 1,
        ctr: {
          $multiply: [{ $divide: ['$clicks', '$views'] }, 100],
        },
      },
    },
    { $sort: { views: -1 } },
  ]);
};

// Method: Mark as qualified view (called when duration > 3s)
ProductViewSchema.methods.markAsQualified = async function (
  duration: number,
  scrollDepth?: number
): Promise<void> {
  this.viewDuration = duration;
  this.isQualifiedView = duration >= 3;
  if (scrollDepth !== undefined) {
    this.scrollDepth = scrollDepth;
  }
  await this.save();
};

// Method: Mark contact clicked
ProductViewSchema.methods.markContactClicked = async function (): Promise<void> {
  this.clickedContact = true;
  await this.save();
};

// Method: Charge CPV
ProductViewSchema.methods.chargeCpv = async function (
  amount: number,
  bidAmount: number
): Promise<void> {
  this.cpvCharged = true;
  this.cpvAmount = amount;
  this.vendorBidAmount = bidAmount;
  await this.save();
};

const ProductView =
  (mongoose.models.ProductView as IProductViewStatics) ||
  mongoose.model<IProductView, IProductViewStatics>('ProductView', ProductViewSchema);

export default ProductView;

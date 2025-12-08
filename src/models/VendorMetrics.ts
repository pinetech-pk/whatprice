import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVendorMetrics extends Document {
  _id: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  date: Date; // Start of day (UTC)

  // View Metrics
  totalViews: number;
  qualifiedViews: number;
  uniqueVisitors: number;
  comparisonViews: number;
  directViews: number;
  searchViews: number;

  // CPV Metrics
  viewsCharged: number;
  creditsSpent: number;
  avgCpvBid: number;

  // Engagement Metrics
  avgViewDuration: number;
  contactClicks: number;
  ctr: number; // Click-through rate

  // Product Metrics
  activeProducts: number;
  promotedProducts: number;
  newProductViews: number;

  // Performance
  impressions: number;
  position: number; // Average position in comparisons
  competitiveness: number; // 0-100 score

  // Sales (if tracked)
  estimatedSales: number;
  conversionRate: number;

  // Credits
  creditsStartOfDay: number;
  creditsEndOfDay: number;
  creditsPurchased: number;

  // Tier Info
  graduationTier: string;
  qualifiesForUpgrade: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const VendorMetricsSchema = new Schema<IVendorMetrics>(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },

    // View Metrics
    totalViews: { type: Number, default: 0 },
    qualifiedViews: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
    comparisonViews: { type: Number, default: 0 },
    directViews: { type: Number, default: 0 },
    searchViews: { type: Number, default: 0 },

    // CPV Metrics
    viewsCharged: { type: Number, default: 0 },
    creditsSpent: { type: Number, default: 0 },
    avgCpvBid: { type: Number, default: 0 },

    // Engagement
    avgViewDuration: { type: Number, default: 0 },
    contactClicks: { type: Number, default: 0 },
    ctr: { type: Number, default: 0 },

    // Products
    activeProducts: { type: Number, default: 0 },
    promotedProducts: { type: Number, default: 0 },
    newProductViews: { type: Number, default: 0 },

    // Performance
    impressions: { type: Number, default: 0 },
    position: { type: Number, default: 0 },
    competitiveness: { type: Number, default: 0 },

    // Sales
    estimatedSales: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },

    // Credits
    creditsStartOfDay: { type: Number, default: 0 },
    creditsEndOfDay: { type: Number, default: 0 },
    creditsPurchased: { type: Number, default: 0 },

    // Tier
    graduationTier: String,
    qualifiesForUpgrade: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Compound unique index for vendor + date
VendorMetricsSchema.index({ vendorId: 1, date: 1 }, { unique: true });
VendorMetricsSchema.index({ date: -1 });
VendorMetricsSchema.index({ vendorId: 1, creditsSpent: -1 });

// Static: Get or create metrics for a date
VendorMetricsSchema.statics.getOrCreate = async function (
  vendorId: mongoose.Types.ObjectId,
  date: Date
): Promise<IVendorMetrics> {
  // Normalize to start of day UTC
  const normalizedDate = new Date(date);
  normalizedDate.setUTCHours(0, 0, 0, 0);

  let metrics = await this.findOne({ vendorId, date: normalizedDate });

  if (!metrics) {
    metrics = new this({
      vendorId,
      date: normalizedDate,
    });
    await metrics.save();
  }

  return metrics;
};

// Static: Aggregate metrics for date range
VendorMetricsSchema.statics.aggregateRange = async function (
  vendorId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date
) {
  return this.aggregate([
    {
      $match: {
        vendorId,
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: null,
        totalViews: { $sum: '$totalViews' },
        qualifiedViews: { $sum: '$qualifiedViews' },
        uniqueVisitors: { $sum: '$uniqueVisitors' },
        creditsSpent: { $sum: '$creditsSpent' },
        contactClicks: { $sum: '$contactClicks' },
        avgViewDuration: { $avg: '$avgViewDuration' },
        avgPosition: { $avg: '$position' },
        estimatedSales: { $sum: '$estimatedSales' },
        days: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        totalViews: 1,
        qualifiedViews: 1,
        uniqueVisitors: 1,
        creditsSpent: 1,
        contactClicks: 1,
        avgViewDuration: { $round: ['$avgViewDuration', 1] },
        avgPosition: { $round: ['$avgPosition', 1] },
        estimatedSales: 1,
        days: 1,
        avgDailyViews: { $divide: ['$totalViews', '$days'] },
        ctr: {
          $multiply: [
            { $divide: ['$contactClicks', { $max: ['$totalViews', 1] }] },
            100,
          ],
        },
      },
    },
  ]);
};

// Static: Get daily metrics chart data
VendorMetricsSchema.statics.getChartData = async function (
  vendorId: mongoose.Types.ObjectId,
  days: number = 30
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setUTCHours(0, 0, 0, 0);

  return this.find({
    vendorId,
    date: { $gte: startDate },
  })
    .sort({ date: 1 })
    .select('date totalViews creditsSpent contactClicks ctr');
};

// Static: Get top vendors by metric
VendorMetricsSchema.statics.getTopVendors = async function (
  metric: string,
  date: Date,
  limit: number = 10
) {
  const normalizedDate = new Date(date);
  normalizedDate.setUTCHours(0, 0, 0, 0);

  return this.aggregate([
    { $match: { date: normalizedDate } },
    { $sort: { [metric]: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'vendors',
        localField: 'vendorId',
        foreignField: '_id',
        as: 'vendor',
      },
    },
    { $unwind: '$vendor' },
    {
      $project: {
        vendorId: 1,
        vendorName: '$vendor.storeName',
        [metric]: 1,
        totalViews: 1,
        creditsSpent: 1,
      },
    },
  ]);
};

// Method: Update from product views
VendorMetricsSchema.methods.updateFromViews = async function (viewStats: {
  totalViews: number;
  qualifiedViews: number;
  uniqueVisitors: number;
  creditsSpent: number;
  contactClicks: number;
  avgViewDuration: number;
  viewTypes: { comparison: number; direct: number; search: number };
}): Promise<void> {
  this.totalViews = viewStats.totalViews;
  this.qualifiedViews = viewStats.qualifiedViews;
  this.uniqueVisitors = viewStats.uniqueVisitors;
  this.creditsSpent = viewStats.creditsSpent;
  this.contactClicks = viewStats.contactClicks;
  this.avgViewDuration = viewStats.avgViewDuration;
  this.comparisonViews = viewStats.viewTypes.comparison;
  this.directViews = viewStats.viewTypes.direct;
  this.searchViews = viewStats.viewTypes.search;

  // Calculate CTR
  if (this.totalViews > 0) {
    this.ctr = (this.contactClicks / this.totalViews) * 100;
  }

  await this.save();
};

const VendorMetrics: Model<IVendorMetrics> =
  mongoose.models.VendorMetrics ||
  mongoose.model<IVendorMetrics>('VendorMetrics', VendorMetricsSchema);

export default VendorMetrics;

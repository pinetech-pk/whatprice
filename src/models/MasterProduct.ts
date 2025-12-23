import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMasterProduct extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  brand?: string;
  modelNumber?: string;
  category: mongoose.Types.ObjectId;

  // Reference Data
  upc?: string;
  ean?: string;
  images: string[];
  specifications: Map<string, string>;
  features: string[];
  tags: string[];

  // Aggregated Pricing (updated via cron/trigger)
  vendorCount: number;
  minPrice?: number;
  maxPrice?: number;
  avgPrice?: number;
  priceLastUpdated?: Date;

  // Aggregated Metrics
  totalViews: number;
  avgRating: number;
  totalReviews: number;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MasterProductSchema = new Schema<IMasterProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
    },
    modelNumber: {
      type: String,
      trim: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },

    // Reference Data
    upc: String,
    ean: String,
    images: {
      type: [String],
      default: [],
    },
    specifications: {
      type: Map,
      of: String,
    },
    features: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },

    // Aggregated Pricing
    vendorCount: {
      type: Number,
      default: 0,
    },
    minPrice: Number,
    maxPrice: Number,
    avgPrice: Number,
    priceLastUpdated: Date,

    // Aggregated Metrics
    totalViews: {
      type: Number,
      default: 0,
    },
    avgRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
MasterProductSchema.index({ slug: 1 });
MasterProductSchema.index({ category: 1 });
MasterProductSchema.index({ brand: 1 });
MasterProductSchema.index({ isActive: 1 });
MasterProductSchema.index({ name: 'text', brand: 'text', description: 'text' });
MasterProductSchema.index({ minPrice: 1 });
MasterProductSchema.index({ vendorCount: -1 });
MasterProductSchema.index({ totalViews: -1 });

// Pre-save: Generate slug
MasterProductSchema.pre('save', function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Method: Update price aggregates (fetches prices from Product collection)
MasterProductSchema.methods.updatePriceAggregates = async function (): Promise<void> {
  // Get Product model - import dynamically to avoid circular dependency
  const Product = mongoose.model('Product');

  // Fetch all active listings for this MasterProduct
  const listings = await Product.find({
    masterProductId: this._id,
    isActive: true,
    deletedAt: null,
  }).select('price');

  const prices = listings.map((l: { price: number }) => l.price).filter((p: number) => p > 0);

  if (prices.length === 0) {
    this.vendorCount = 0;
    this.minPrice = undefined;
    this.maxPrice = undefined;
    this.avgPrice = undefined;
    this.priceLastUpdated = new Date();
    await this.save();
    return;
  }

  this.minPrice = Math.min(...prices);
  this.maxPrice = Math.max(...prices);
  this.avgPrice = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
  this.vendorCount = prices.length;
  this.priceLastUpdated = new Date();
  await this.save();
};

// Method: Increment views
MasterProductSchema.methods.incrementViews = async function (): Promise<void> {
  this.totalViews += 1;
  await this.save();
};

// Static: Get products with comparison data
MasterProductSchema.statics.getWithComparisons = async function (
  categorySlug?: string,
  limit = 20
) {
  const pipeline: mongoose.PipelineStage[] = [
    { $match: { isActive: true, vendorCount: { $gt: 1 } } },
  ];

  if (categorySlug) {
    pipeline.push({
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'categoryData',
      },
    });
    pipeline.push({
      $match: { 'categoryData.slug': categorySlug },
    });
  }

  pipeline.push(
    { $sort: { vendorCount: -1, totalViews: -1 } },
    { $limit: limit }
  );

  return this.aggregate(pipeline);
};

// Static: Search master products
MasterProductSchema.statics.search = function (
  query: string,
  options: { category?: string; limit?: number } = {}
) {
  const searchQuery: Record<string, unknown> = {
    $text: { $search: query },
    isActive: true,
  };

  if (options.category) {
    searchQuery.category = options.category;
  }

  return this.find(searchQuery)
    .limit(options.limit || 20)
    .sort({ score: { $meta: 'textScore' }, vendorCount: -1 });
};

const MasterProduct: Model<IMasterProduct> =
  mongoose.models.MasterProduct || mongoose.model<IMasterProduct>('MasterProduct', MasterProductSchema);

export default MasterProduct;

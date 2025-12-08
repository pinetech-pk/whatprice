import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProductPrice {
  retailer: mongoose.Types.ObjectId;
  price: number;
  originalPrice?: number;
  currency: string;
  isAvailable: boolean;
  url?: string;
  lastUpdated: Date;
}

export interface IProduct {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  brand?: string;
  productModel?: string;
  sku?: string;
  barcode?: string;
  category: mongoose.Types.ObjectId;
  images: string[];
  prices: IProductPrice[];
  specifications?: Map<string, string>;
  features?: string[];
  tags?: string[];
  isActive: boolean;
  rating: number;
  reviewCount: number;
  viewCount: number;
  compareCount: number;
  metaTitle?: string;
  metaDescription?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type IProductDocument = IProduct & Document;

const ProductPriceSchema = new Schema<IProductPrice>(
  {
    retailer: {
      type: Schema.Types.ObjectId,
      ref: 'Retailer',
      required: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    originalPrice: {
      type: Number,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    url: {
      type: String,
      trim: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProductDocument>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Product slug is required'],
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
    productModel: {
      type: String,
      trim: true,
    },
    sku: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    barcode: {
      type: String,
      trim: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    images: {
      type: [String],
      default: [],
    },
    prices: {
      type: [ProductPriceSchema],
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
    isActive: {
      type: Boolean,
      default: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    compareCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    metaTitle: {
      type: String,
      trim: true,
    },
    metaDescription: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ProductSchema.index({ slug: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ brand: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ rating: -1 });
ProductSchema.index({ name: 'text', description: 'text', brand: 'text' }); // Text search
ProductSchema.index({ 'prices.retailer': 1 });
ProductSchema.index({ 'prices.price': 1 });

// Pre-save middleware to generate slug from name if not provided
ProductSchema.pre('save', function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Virtual for lowest price
ProductSchema.virtual('lowestPrice').get(function () {
  if (!this.prices || this.prices.length === 0) return null;

  const availablePrices = this.prices.filter((p) => p.isAvailable);
  if (availablePrices.length === 0) return null;

  return availablePrices.reduce((min, p) => (p.price < min.price ? p : min));
});

// Virtual for price range
ProductSchema.virtual('priceRange').get(function () {
  if (!this.prices || this.prices.length === 0) return null;

  const availablePrices = this.prices.filter((p) => p.isAvailable);
  if (availablePrices.length === 0) return null;

  const prices = availablePrices.map((p) => p.price);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
});

// Ensure virtuals are included in JSON
ProductSchema.set('toJSON', { virtuals: true });
ProductSchema.set('toObject', { virtuals: true });

// Method to update rating
ProductSchema.methods.updateRating = async function (newRating: number) {
  const totalRating = this.rating * this.reviewCount;
  this.reviewCount += 1;
  this.rating = (totalRating + newRating) / this.reviewCount;
  await this.save();
};

// Method to increment view count
ProductSchema.methods.incrementViewCount = async function () {
  this.viewCount += 1;
  await this.save();
};

// Method to increment compare count
ProductSchema.methods.incrementCompareCount = async function () {
  this.compareCount += 1;
  await this.save();
};

// Method to update price for a retailer
ProductSchema.methods.updatePrice = async function (
  retailerId: mongoose.Types.ObjectId,
  price: number,
  originalPrice?: number,
  url?: string
) {
  const existingPriceIndex = this.prices.findIndex(
    (p: IProductPrice) => p.retailer.toString() === retailerId.toString()
  );

  if (existingPriceIndex >= 0) {
    this.prices[existingPriceIndex].price = price;
    if (originalPrice !== undefined) this.prices[existingPriceIndex].originalPrice = originalPrice;
    if (url !== undefined) this.prices[existingPriceIndex].url = url;
    this.prices[existingPriceIndex].lastUpdated = new Date();
  } else {
    this.prices.push({
      retailer: retailerId,
      price,
      originalPrice,
      url,
      isAvailable: true,
      currency: 'USD',
      lastUpdated: new Date(),
    });
  }

  await this.save();
};

const Product: Model<IProductDocument> = mongoose.models.Product || mongoose.model<IProductDocument>('Product', ProductSchema);

export default Product;

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVendorAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface IVendor extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  storeName: string;
  slug: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  website?: string;
  email: string;
  phone: string;
  whatsapp?: string;
  address: IVendorAddress;

  // Verification
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verifiedAt?: Date;
  rejectionReason?: string;

  // View Credits System
  viewCredits: number;
  totalCreditsPurchased: number;
  totalCreditsUsed: number;
  totalSpent: number;

  // Graduation Tier System (PKR rates per 100 views)
  // Month 1-3: ₨10, Month 4-6: ₨20, Month 7+: ₨30
  graduationTier: 'starter' | 'growth' | 'standard';
  tierStartDate: Date;
  tierExpiresAt?: Date;

  // Performance Metrics
  totalProducts: number;
  activeProducts: number;
  totalViews: number;
  totalClicks: number;
  totalSales: number;
  conversionRate: number;
  rating: number;
  reviewCount: number;
  responseRate: number;

  // CPV Settings
  defaultBidAmount: number;
  maxDailyBudget?: number;
  currentDailySpend: number;
  lastDailyResetAt: Date;

  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VendorAddressSchema = new Schema<IVendorAddress>(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, default: 'Pakistan' },
  },
  { _id: false }
);

const VendorSchema = new Schema<IVendor>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    storeName: {
      type: String,
      required: [true, 'Store name is required'],
      trim: true,
      maxlength: 100,
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
      maxlength: 1000,
    },
    logo: String,
    coverImage: String,
    website: String,
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
    },
    whatsapp: String,
    address: {
      type: VendorAddressSchema,
      required: true,
    },

    // Verification
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    verifiedAt: Date,
    rejectionReason: String,

    // Credits
    viewCredits: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalCreditsPurchased: {
      type: Number,
      default: 0,
    },
    totalCreditsUsed: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },

    // Graduation Tier
    graduationTier: {
      type: String,
      enum: ['starter', 'growth', 'standard'],
      default: 'starter',
    },
    tierStartDate: {
      type: Date,
      default: Date.now,
    },
    tierExpiresAt: Date,

    // Performance
    totalProducts: { type: Number, default: 0 },
    activeProducts: { type: Number, default: 0 },
    totalViews: { type: Number, default: 0 },
    totalClicks: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    responseRate: { type: Number, default: 100 },

    // CPV Settings
    defaultBidAmount: {
      type: Number,
      default: 10, // PKR 10 per 100 views
      min: 10,
    },
    maxDailyBudget: Number,
    currentDailySpend: {
      type: Number,
      default: 0,
    },
    lastDailyResetAt: {
      type: Date,
      default: Date.now,
    },

    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Indexes
VendorSchema.index({ userId: 1 });
VendorSchema.index({ slug: 1 });
VendorSchema.index({ verificationStatus: 1 });
VendorSchema.index({ graduationTier: 1 });
VendorSchema.index({ isActive: 1, verificationStatus: 1 });
VendorSchema.index({ 'address.city': 1 });
VendorSchema.index({ rating: -1 });

// Pre-save: Generate slug
VendorSchema.pre('save', function (next) {
  if (!this.slug && this.storeName) {
    this.slug = this.storeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Method: Get CPV rate based on graduation tier
VendorSchema.methods.getCpvRate = function (): number {
  const rates = {
    starter: 10,   // PKR 10 per 100 views (Month 1-3)
    growth: 20,    // PKR 20 per 100 views (Month 4-6)
    standard: 30,  // PKR 30 per 100 views (Month 7+)
  };
  return rates[this.graduationTier as keyof typeof rates] || 30;
};

// Method: Check and update graduation tier
VendorSchema.methods.updateGraduationTier = async function (): Promise<void> {
  const monthsSinceStart = Math.floor(
    (Date.now() - this.tierStartDate.getTime()) / (30 * 24 * 60 * 60 * 1000)
  );

  let newTier: 'starter' | 'growth' | 'standard' = 'starter';
  if (monthsSinceStart >= 6) {
    newTier = 'standard';
  } else if (monthsSinceStart >= 3) {
    newTier = 'growth';
  }

  if (this.graduationTier !== newTier) {
    this.graduationTier = newTier;
    await this.save();
  }
};

// Method: Deduct credits for views
VendorSchema.methods.deductCredits = async function (amount: number): Promise<boolean> {
  if (this.viewCredits < amount) {
    return false;
  }

  this.viewCredits -= amount;
  this.totalCreditsUsed += amount;
  this.currentDailySpend += amount;
  await this.save();
  return true;
};

// Method: Add credits from purchase
VendorSchema.methods.addCredits = async function (amount: number, cost: number): Promise<void> {
  this.viewCredits += amount;
  this.totalCreditsPurchased += amount;
  this.totalSpent += cost;
  await this.save();
};

// Method: Reset daily spend (call via cron job)
VendorSchema.methods.resetDailySpend = async function (): Promise<void> {
  this.currentDailySpend = 0;
  this.lastDailyResetAt = new Date();
  await this.save();
};

// Method: Check if within daily budget
VendorSchema.methods.canSpend = function (amount: number): boolean {
  if (!this.maxDailyBudget) return true;
  return this.currentDailySpend + amount <= this.maxDailyBudget;
};

// Method: Update conversion rate
VendorSchema.methods.updateConversionRate = async function (): Promise<void> {
  if (this.totalViews > 0) {
    this.conversionRate = (this.totalSales / this.totalViews) * 100;
    await this.save();
  }
};

// Static: Find by user ID
VendorSchema.statics.findByUserId = function (userId: mongoose.Types.ObjectId) {
  return this.findOne({ userId });
};

// Static: Get active verified vendors
VendorSchema.statics.getActiveVendors = function (city?: string) {
  const query: Record<string, unknown> = {
    isActive: true,
    verificationStatus: 'verified',
  };
  if (city) {
    query['address.city'] = city;
  }
  return this.find(query).sort({ rating: -1, totalViews: -1 });
};

const Vendor: Model<IVendor> = mongoose.models.Vendor || mongoose.model<IVendor>('Vendor', VendorSchema);

export default Vendor;

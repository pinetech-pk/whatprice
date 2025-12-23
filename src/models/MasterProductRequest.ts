import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMasterProductRequest extends Document {
  vendorId: mongoose.Types.ObjectId;

  // Proposed product data
  name: string;
  brand: string;
  modelNumber?: string;
  categoryId: mongoose.Types.ObjectId;
  description?: string;
  specifications?: Map<string, string>;
  images?: string[];
  features?: string[];

  // Vendor's proposed listing data (to be created after approval)
  proposedPrice: number;
  proposedOriginalPrice?: number;
  proposedStock: number;
  proposedSku?: string;

  // Approval workflow
  status: 'pending' | 'approved' | 'rejected' | 'merged';
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  rejectionReason?: string;
  adminNotes?: string;

  // If approved - the created MasterProduct
  createdMasterProductId?: mongoose.Types.ObjectId;

  // If merged to existing MasterProduct
  mergedToMasterProductId?: mongoose.Types.ObjectId;

  // Created VendorListing after approval/merge
  createdListingId?: mongoose.Types.ObjectId;

  // Duplicate detection results
  possibleDuplicates: {
    masterProductId: mongoose.Types.ObjectId;
    matchScore: number;
    matchReasons: string[];
  }[];
  highestDuplicateScore: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

interface IMasterProductRequestMethods {
  approve(
    reviewerId: mongoose.Types.ObjectId,
    notes?: string
  ): Promise<{ masterProduct: Document; listing: Document }>;

  reject(
    reviewerId: mongoose.Types.ObjectId,
    reason: string
  ): Promise<void>;

  mergeToExisting(
    reviewerId: mongoose.Types.ObjectId,
    existingMasterProductId: mongoose.Types.ObjectId,
    notes?: string
  ): Promise<{ listing: Document }>;
}

interface IMasterProductRequestModel extends Model<IMasterProductRequest, object, IMasterProductRequestMethods> {
  getPendingRequests(options?: {
    page?: number;
    limit?: number;
    sortBy?: 'date' | 'duplicateScore';
  }): Promise<{
    requests: IMasterProductRequest[];
    total: number;
    pages: number;
  }>;

  getVendorRequests(
    vendorId: mongoose.Types.ObjectId,
    status?: string
  ): Promise<IMasterProductRequest[]>;
}

const MasterProductRequestSchema = new Schema<
  IMasterProductRequest,
  IMasterProductRequestModel,
  IMasterProductRequestMethods
>(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      index: true,
    },

    // Proposed product data
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    modelNumber: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    description: {
      type: String,
      maxlength: 5000,
    },
    specifications: {
      type: Map,
      of: String,
    },
    images: [{
      type: String,
    }],
    features: [{
      type: String,
      maxlength: 200,
    }],

    // Vendor's proposed listing data
    proposedPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    proposedOriginalPrice: {
      type: Number,
      min: 0,
    },
    proposedStock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    proposedSku: {
      type: String,
      trim: true,
    },

    // Approval workflow
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'merged'],
      default: 'pending',
      index: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: Date,
    rejectionReason: String,
    adminNotes: String,

    // Created/linked records
    createdMasterProductId: {
      type: Schema.Types.ObjectId,
      ref: 'MasterProduct',
    },
    mergedToMasterProductId: {
      type: Schema.Types.ObjectId,
      ref: 'MasterProduct',
    },
    createdListingId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
    },

    // Duplicate detection
    possibleDuplicates: [{
      masterProductId: {
        type: Schema.Types.ObjectId,
        ref: 'MasterProduct',
      },
      matchScore: {
        type: Number,
        min: 0,
        max: 100,
      },
      matchReasons: [String],
    }],
    highestDuplicateScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
MasterProductRequestSchema.index({ status: 1, createdAt: -1 });
MasterProductRequestSchema.index({ status: 1, highestDuplicateScore: -1 });
MasterProductRequestSchema.index({ vendorId: 1, status: 1 });

// Instance method: Approve and create MasterProduct + Listing
MasterProductRequestSchema.methods.approve = async function(
  reviewerId: mongoose.Types.ObjectId,
  notes?: string
) {
  if (this.status !== 'pending') {
    throw new Error('Can only approve pending requests');
  }

  const MasterProduct = mongoose.model('MasterProduct');
  const Product = mongoose.model('Product');
  const Vendor = mongoose.model('Vendor');

  // Get vendor for default bid settings
  const vendor = await Vendor.findById(this.vendorId);
  if (!vendor) {
    throw new Error('Vendor not found');
  }

  // Create slug from name
  const baseSlug = this.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  // Check for existing slug and make unique
  let slug = baseSlug;
  let counter = 1;
  while (await MasterProduct.findOne({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  // Create MasterProduct
  const masterProduct = await MasterProduct.create({
    name: this.name,
    slug,
    brand: this.brand,
    modelNumber: this.modelNumber,
    category: this.categoryId,
    description: this.description,
    specifications: this.specifications,
    images: this.images || [],
    features: this.features || [],
    vendorCount: 1,
    minPrice: this.proposedPrice,
    maxPrice: this.proposedPrice,
    avgPrice: this.proposedPrice,
    isActive: true,
  });

  // Create vendor listing slug
  let listingSlug = `${vendor.slug}-${baseSlug}`;
  let listingCounter = 1;
  while (await Product.findOne({ slug: listingSlug })) {
    listingSlug = `${vendor.slug}-${baseSlug}-${listingCounter}`;
    listingCounter++;
  }

  // Create VendorListing (Product)
  const listing = await Product.create({
    vendorId: this.vendorId,
    masterProductId: masterProduct._id,
    productType: 'comparative',
    name: this.name,
    slug: listingSlug,
    brand: this.brand,
    productModel: this.modelNumber,
    category: this.categoryId,
    description: this.description,
    price: this.proposedPrice,
    originalPrice: this.proposedOriginalPrice,
    stock: this.proposedStock,
    isInStock: this.proposedStock > 0,
    sku: this.proposedSku,
    images: this.images || [],
    specifications: this.specifications,
    features: this.features || [],
    currentBid: vendor.defaultBidAmount || 1,
    isActive: true,
    createdBy: this.vendorId,
  });

  // Update vendor product count
  await Vendor.updateOne(
    { _id: this.vendorId },
    { $inc: { totalProducts: 1, activeProducts: 1 } }
  );

  // Update request status
  this.status = 'approved';
  this.reviewedBy = reviewerId;
  this.reviewedAt = new Date();
  this.adminNotes = notes;
  this.createdMasterProductId = masterProduct._id;
  this.createdListingId = listing._id;
  await this.save();

  return { masterProduct, listing };
};

// Instance method: Reject request
MasterProductRequestSchema.methods.reject = async function(
  reviewerId: mongoose.Types.ObjectId,
  reason: string
) {
  if (this.status !== 'pending') {
    throw new Error('Can only reject pending requests');
  }

  this.status = 'rejected';
  this.reviewedBy = reviewerId;
  this.reviewedAt = new Date();
  this.rejectionReason = reason;
  await this.save();
};

// Instance method: Merge to existing MasterProduct
MasterProductRequestSchema.methods.mergeToExisting = async function(
  reviewerId: mongoose.Types.ObjectId,
  existingMasterProductId: mongoose.Types.ObjectId,
  notes?: string
) {
  if (this.status !== 'pending') {
    throw new Error('Can only merge pending requests');
  }

  const MasterProduct = mongoose.model('MasterProduct');
  const Product = mongoose.model('Product');
  const Vendor = mongoose.model('Vendor');

  // Verify MasterProduct exists
  const masterProduct = await MasterProduct.findById(existingMasterProductId);
  if (!masterProduct) {
    throw new Error('Target MasterProduct not found');
  }

  // Get vendor
  const vendor = await Vendor.findById(this.vendorId);
  if (!vendor) {
    throw new Error('Vendor not found');
  }

  // Check if vendor already has a listing for this MasterProduct
  const existingListing = await Product.findOne({
    vendorId: this.vendorId,
    masterProductId: existingMasterProductId,
    deletedAt: null,
  });

  if (existingListing) {
    throw new Error('Vendor already has a listing for this product');
  }

  // Create listing slug
  const baseSlug = masterProduct.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  let listingSlug = `${vendor.slug}-${baseSlug}`;
  let counter = 1;
  while (await Product.findOne({ slug: listingSlug })) {
    listingSlug = `${vendor.slug}-${baseSlug}-${counter}`;
    counter++;
  }

  // Create VendorListing linked to existing MasterProduct
  const listing = await Product.create({
    vendorId: this.vendorId,
    masterProductId: existingMasterProductId,
    productType: 'comparative',
    name: masterProduct.name,
    slug: listingSlug,
    brand: masterProduct.brand,
    productModel: masterProduct.modelNumber,
    category: masterProduct.category,
    description: this.description || masterProduct.description,
    price: this.proposedPrice,
    originalPrice: this.proposedOriginalPrice,
    stock: this.proposedStock,
    isInStock: this.proposedStock > 0,
    sku: this.proposedSku,
    images: this.images?.length ? this.images : masterProduct.images,
    currentBid: vendor.defaultBidAmount || 1,
    isActive: true,
    createdBy: this.vendorId,
  });

  // Update MasterProduct aggregates
  await masterProduct.updatePriceAggregates();

  // Update vendor product count
  await Vendor.updateOne(
    { _id: this.vendorId },
    { $inc: { totalProducts: 1, activeProducts: 1 } }
  );

  // Update request status
  this.status = 'merged';
  this.reviewedBy = reviewerId;
  this.reviewedAt = new Date();
  this.adminNotes = notes;
  this.mergedToMasterProductId = existingMasterProductId;
  this.createdListingId = listing._id;
  await this.save();

  return { listing };
};

// Static method: Get pending requests for moderator
MasterProductRequestSchema.statics.getPendingRequests = async function(
  options: {
    page?: number;
    limit?: number;
    sortBy?: 'date' | 'duplicateScore';
  } = {}
) {
  const page = options.page || 1;
  const limit = options.limit || 20;
  const skip = (page - 1) * limit;

  type SortOrder = 1 | -1;
  const sortField: Record<string, SortOrder> = options.sortBy === 'duplicateScore'
    ? { highestDuplicateScore: -1, createdAt: -1 }
    : { createdAt: -1 };

  const [requests, total] = await Promise.all([
    this.find({ status: 'pending' })
      .populate('vendorId', 'storeName slug email')
      .populate('categoryId', 'name slug')
      .populate('possibleDuplicates.masterProductId', 'name brand slug vendorCount minPrice maxPrice')
      .sort(sortField)
      .skip(skip)
      .limit(limit),
    this.countDocuments({ status: 'pending' }),
  ]);

  return {
    requests,
    total,
    pages: Math.ceil(total / limit),
  };
};

// Static method: Get vendor's requests
MasterProductRequestSchema.statics.getVendorRequests = async function(
  vendorId: mongoose.Types.ObjectId,
  status?: string
) {
  const query: Record<string, unknown> = { vendorId };
  if (status) {
    query.status = status;
  }

  return this.find(query)
    .populate('categoryId', 'name slug')
    .populate('createdMasterProductId', 'name slug')
    .populate('mergedToMasterProductId', 'name slug')
    .sort({ createdAt: -1 });
};

const MasterProductRequest = mongoose.models.MasterProductRequest ||
  mongoose.model<IMasterProductRequest, IMasterProductRequestModel>(
    'MasterProductRequest',
    MasterProductRequestSchema
  );

export default MasterProductRequest;

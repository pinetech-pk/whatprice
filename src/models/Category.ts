import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICategory extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  parent?: mongoose.Types.ObjectId;
  image?: string;
  icon?: string;
  isActive: boolean;
  order: number;
  metaTitle?: string;
  metaDescription?: string;

  // CPV Settings
  baseViewRate: number; // Base cost per 100 views (PKR)
  minBidAmount: number; // Minimum bid allowed
  maxBidAmount: number; // Maximum bid allowed
  currency: string;

  // Category Metrics
  totalProducts: number;
  totalViews: number;
  avgProductPrice?: number;
  competitiveness: 'low' | 'medium' | 'high';

  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Category slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    image: {
      type: String,
    },
    icon: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    metaTitle: {
      type: String,
      trim: true,
    },
    metaDescription: {
      type: String,
      trim: true,
    },

    // CPV Settings
    baseViewRate: {
      type: Number,
      default: 10, // PKR 10 per 100 views
      min: 5,
    },
    minBidAmount: {
      type: Number,
      default: 10,
      min: 5,
    },
    maxBidAmount: {
      type: Number,
      default: 100,
    },
    currency: {
      type: String,
      default: 'PKR',
    },

    // Category Metrics
    totalProducts: {
      type: Number,
      default: 0,
    },
    totalViews: {
      type: Number,
      default: 0,
    },
    avgProductPrice: Number,
    competitiveness: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
CategorySchema.index({ slug: 1 });
CategorySchema.index({ parent: 1 });
CategorySchema.index({ isActive: 1 });
CategorySchema.index({ order: 1 });

// Pre-save middleware to generate slug from name if not provided
CategorySchema.pre('save', function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Method to get all children categories
CategorySchema.methods.getChildren = async function () {
  return await mongoose.model('Category').find({ parent: this._id });
};

// Method to check if category is a parent
CategorySchema.methods.isParent = async function (): Promise<boolean> {
  const children = await mongoose.model('Category').countDocuments({ parent: this._id });
  return children > 0;
};

// Define interface for Category model with statics
interface ICategoryModel extends Model<ICategory> {
  getTree(): Promise<Array<ICategory & { children: Array<unknown> }>>;
}

// Static method to get category tree - OPTIMIZED: Single query + in-memory tree building
CategorySchema.statics.getTree = async function () {
  // Fetch ALL active categories in ONE query
  const allCategories = await this.find({ isActive: true })
    .sort({ order: 1, name: 1 })
    .lean();

  // Build a map for quick lookup by ID
  const categoryMap = new Map<string, ICategory & { children: Array<unknown> }>();

  // First pass: Create all category objects with empty children arrays
  for (const category of allCategories) {
    categoryMap.set(category._id.toString(), {
      ...category,
      children: [],
    });
  }

  // Second pass: Build the tree by assigning children to their parents
  const rootCategories: Array<ICategory & { children: Array<unknown> }> = [];

  for (const category of allCategories) {
    const categoryWithChildren = categoryMap.get(category._id.toString())!;

    if (category.parent) {
      // This category has a parent - add it to parent's children
      const parentCategory = categoryMap.get(category.parent.toString());
      if (parentCategory) {
        parentCategory.children.push(categoryWithChildren);
      } else {
        // Parent not found (maybe inactive), treat as root
        rootCategories.push(categoryWithChildren);
      }
    } else {
      // No parent - this is a root category
      rootCategories.push(categoryWithChildren);
    }
  }

  return rootCategories;
};

const Category = (mongoose.models.Category || mongoose.model<ICategory, ICategoryModel>('Category', CategorySchema)) as ICategoryModel;

export default Category;

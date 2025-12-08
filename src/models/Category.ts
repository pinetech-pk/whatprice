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
  getTree(parentId?: mongoose.Types.ObjectId | null): Promise<Array<ICategory & { children: Array<unknown> }>>;
}

// Static method to get category tree
CategorySchema.statics.getTree = async function (parentId: mongoose.Types.ObjectId | null = null) {
  const categories = await this.find({ parent: parentId, isActive: true }).sort({ order: 1 });

  const tree = [];
  for (const category of categories) {
    const children = await (this as ICategoryModel).getTree(category._id);
    tree.push({
      ...category.toObject(),
      children,
    });
  }

  return tree;
};

const Category = (mongoose.models.Category || mongoose.model<ICategory, ICategoryModel>('Category', CategorySchema)) as ICategoryModel;

export default Category;

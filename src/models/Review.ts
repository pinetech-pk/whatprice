import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReview extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  product?: mongoose.Types.ObjectId;
  retailer?: mongoose.Types.ObjectId;
  order?: mongoose.Types.ObjectId;
  rating: number;
  title?: string;
  comment: string;
  pros?: string[];
  cons?: string[];
  images?: string[];
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  unhelpfulCount: number;
  status: 'pending' | 'approved' | 'rejected';
  moderatorNote?: string;
  response?: {
    text: string;
    respondedBy: mongoose.Types.ObjectId;
    respondedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
    },
    retailer: {
      type: Schema.Types.ObjectId,
      ref: 'Retailer',
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },
    pros: {
      type: [String],
      default: [],
    },
    cons: {
      type: [String],
      default: [],
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: function (v: string[]) {
          return v.length <= 5;
        },
        message: 'Maximum 5 images allowed per review',
      },
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
    helpfulCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    unhelpfulCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    moderatorNote: {
      type: String,
      trim: true,
    },
    response: {
      text: {
        type: String,
        trim: true,
      },
      respondedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      respondedAt: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ReviewSchema.index({ user: 1 });
ReviewSchema.index({ product: 1 });
ReviewSchema.index({ retailer: 1 });
ReviewSchema.index({ order: 1 });
ReviewSchema.index({ rating: 1 });
ReviewSchema.index({ status: 1 });
ReviewSchema.index({ createdAt: -1 });

// Compound indexes
ReviewSchema.index({ product: 1, status: 1, rating: -1 });
ReviewSchema.index({ retailer: 1, status: 1, rating: -1 });

// Validation: Must have either product or retailer
ReviewSchema.pre('validate', function (next) {
  if (!this.product && !this.retailer) {
    this.invalidate('product', 'Review must be for either a product or a retailer');
    this.invalidate('retailer', 'Review must be for either a product or a retailer');
  }
  next();
});

// Method to mark as helpful
ReviewSchema.methods.markHelpful = async function () {
  this.helpfulCount += 1;
  await this.save();
};

// Method to mark as unhelpful
ReviewSchema.methods.markUnhelpful = async function () {
  this.unhelpfulCount += 1;
  await this.save();
};

// Method to approve review
ReviewSchema.methods.approve = async function (moderatorNote?: string) {
  this.status = 'approved';
  if (moderatorNote) {
    this.moderatorNote = moderatorNote;
  }
  await this.save();

  // Update product or retailer rating
  if (this.product) {
    const Product = mongoose.model('Product');
    const product = await Product.findById(this.product);
    if (product) {
      await product.updateRating(this.rating);
    }
  }

  if (this.retailer) {
    const Retailer = mongoose.model('Retailer');
    const retailer = await Retailer.findById(this.retailer);
    if (retailer) {
      await retailer.updateRating(this.rating);
    }
  }
};

// Method to reject review
ReviewSchema.methods.reject = async function (moderatorNote: string) {
  this.status = 'rejected';
  this.moderatorNote = moderatorNote;
  await this.save();
};

// Method to add response
ReviewSchema.methods.addResponse = async function (
  text: string,
  respondedBy: mongoose.Types.ObjectId
) {
  this.response = {
    text,
    respondedBy,
    respondedAt: new Date(),
  };
  await this.save();
};

// Static method to get average rating for product
ReviewSchema.statics.getProductAverageRating = async function (productId: mongoose.Types.ObjectId) {
  const result = await this.aggregate([
    { $match: { product: productId, status: 'approved' } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  return result.length > 0
    ? { averageRating: result[0].averageRating, totalReviews: result[0].totalReviews }
    : { averageRating: 0, totalReviews: 0 };
};

// Static method to get average rating for retailer
ReviewSchema.statics.getRetailerAverageRating = async function (
  retailerId: mongoose.Types.ObjectId
) {
  const result = await this.aggregate([
    { $match: { retailer: retailerId, status: 'approved' } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  return result.length > 0
    ? { averageRating: result[0].averageRating, totalReviews: result[0].totalReviews }
    : { averageRating: 0, totalReviews: 0 };
};

// Static method to get rating distribution for product
ReviewSchema.statics.getProductRatingDistribution = async function (
  productId: mongoose.Types.ObjectId
) {
  const distribution = await this.aggregate([
    { $match: { product: productId, status: 'approved' } },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: -1 } },
  ]);

  return distribution;
};

const Review: Model<IReview> = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);

export default Review;

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRetailer extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  email?: string;
  phone?: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  location?: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  contactPerson?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  isActive: boolean;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  createdBy?: mongoose.Types.ObjectId;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  businessHours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  deliveryOptions?: string[];
  paymentMethods?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const RetailerSchema = new Schema<IRetailer>(
  {
    name: {
      type: String,
      required: [true, 'Retailer name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Retailer slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    logo: {
      type: String,
    },
    website: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    contactPerson: {
      name: String,
      email: {
        type: String,
        lowercase: true,
        trim: true,
      },
      phone: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
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
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    socialMedia: {
      facebook: String,
      instagram: String,
      twitter: String,
      linkedin: String,
    },
    businessHours: {
      monday: String,
      tuesday: String,
      wednesday: String,
      thursday: String,
      friday: String,
      saturday: String,
      sunday: String,
    },
    deliveryOptions: {
      type: [String],
      default: [],
    },
    paymentMethods: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
RetailerSchema.index({ slug: 1 });
RetailerSchema.index({ isActive: 1 });
RetailerSchema.index({ isVerified: 1 });
RetailerSchema.index({ rating: -1 });
RetailerSchema.index({ location: '2dsphere' }); // For geospatial queries

// Pre-save middleware to generate slug from name if not provided
RetailerSchema.pre('save', function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Method to update rating
RetailerSchema.methods.updateRating = async function (newRating: number) {
  const totalRating = this.rating * this.reviewCount;
  this.reviewCount += 1;
  this.rating = (totalRating + newRating) / this.reviewCount;
  await this.save();
};

const Retailer: Model<IRetailer> = mongoose.models.Retailer || mongoose.model<IRetailer>('Retailer', RetailerSchema);

export default Retailer;

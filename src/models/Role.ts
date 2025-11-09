import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRole extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRole>(
  {
    name: {
      type: String,
      required: [true, 'Role name is required'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Role slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    permissions: {
      type: [String],
      default: [],
      validate: {
        validator: function (v: string[]) {
          // Ensure all permissions are unique
          return v.length === new Set(v).size;
        },
        message: 'Permissions must be unique',
      },
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
RoleSchema.index({ slug: 1 });
RoleSchema.index({ isActive: 1 });

// Method to check if role has a specific permission
RoleSchema.methods.hasPermission = function (permission: string): boolean {
  return this.permissions.includes(permission);
};

// Method to add permission
RoleSchema.methods.addPermission = function (permission: string): void {
  if (!this.permissions.includes(permission)) {
    this.permissions.push(permission);
  }
};

// Method to remove permission
RoleSchema.methods.removePermission = function (permission: string): void {
  this.permissions = this.permissions.filter((p: string) => p !== permission);
};

const Role: Model<IRole> = mongoose.models.Role || mongoose.model<IRole>('Role', RoleSchema);

export default Role;

// Common permission constants
export const PERMISSIONS = {
  // User permissions
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',

  // Product permissions
  PRODUCT_CREATE: 'product:create',
  PRODUCT_READ: 'product:read',
  PRODUCT_UPDATE: 'product:update',
  PRODUCT_DELETE: 'product:delete',

  // Retailer permissions
  RETAILER_CREATE: 'retailer:create',
  RETAILER_READ: 'retailer:read',
  RETAILER_UPDATE: 'retailer:update',
  RETAILER_DELETE: 'retailer:delete',

  // Order permissions
  ORDER_CREATE: 'order:create',
  ORDER_READ: 'order:read',
  ORDER_UPDATE: 'order:update',
  ORDER_DELETE: 'order:delete',

  // Review permissions
  REVIEW_CREATE: 'review:create',
  REVIEW_READ: 'review:read',
  REVIEW_UPDATE: 'review:update',
  REVIEW_DELETE: 'review:delete',

  // Category permissions
  CATEGORY_CREATE: 'category:create',
  CATEGORY_READ: 'category:read',
  CATEGORY_UPDATE: 'category:update',
  CATEGORY_DELETE: 'category:delete',

  // Admin permissions
  ADMIN_ACCESS: 'admin:access',
  ROLE_MANAGE: 'role:manage',
};

// Default roles
export const DEFAULT_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  RETAILER: 'retailer',
  MODERATOR: 'moderator',
};

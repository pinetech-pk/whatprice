import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPurchaseDetails {
  amount: number;
  currency: string;
  creditsAdded: number;
  pricePerCredit: number;
  paymentMethod: string;
  paymentId?: string;
  invoiceNumber?: string;
  receiptUrl?: string;
}

export interface IDeductionDetails {
  productViewId?: mongoose.Types.ObjectId;
  productId?: mongoose.Types.ObjectId;
  creditsDeducted: number;
  reason: 'view_charged' | 'expired' | 'adjustment' | 'refund';
}

export interface IViewTransaction extends Document {
  _id: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  transactionType: 'purchase' | 'deduction' | 'refund' | 'bonus' | 'adjustment';

  // Transaction Details
  purchaseDetails?: IPurchaseDetails;
  deductionDetails?: IDeductionDetails;

  // Balance Tracking
  creditBalanceBefore: number;
  creditBalanceAfter: number;
  creditChange: number;

  // Status
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  failureReason?: string;

  // Metadata
  description?: string;
  notes?: string;
  processedBy?: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const PurchaseDetailsSchema = new Schema<IPurchaseDetails>(
  {
    amount: { type: Number, required: true },
    currency: { type: String, default: 'PKR' },
    creditsAdded: { type: Number, required: true },
    pricePerCredit: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    paymentId: String,
    invoiceNumber: String,
    receiptUrl: String,
  },
  { _id: false }
);

const DeductionDetailsSchema = new Schema<IDeductionDetails>(
  {
    productViewId: { type: Schema.Types.ObjectId, ref: 'ProductView' },
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    creditsDeducted: { type: Number, required: true },
    reason: {
      type: String,
      enum: ['view_charged', 'expired', 'adjustment', 'refund'],
      required: true,
    },
  },
  { _id: false }
);

const ViewTransactionSchema = new Schema<IViewTransaction>(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    transactionType: {
      type: String,
      enum: ['purchase', 'deduction', 'refund', 'bonus', 'adjustment'],
      required: true,
    },

    purchaseDetails: PurchaseDetailsSchema,
    deductionDetails: DeductionDetailsSchema,

    creditBalanceBefore: {
      type: Number,
      required: true,
    },
    creditBalanceAfter: {
      type: Number,
      required: true,
    },
    creditChange: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
      default: 'pending',
    },
    failureReason: String,

    description: String,
    notes: String,
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ViewTransactionSchema.index({ vendorId: 1, createdAt: -1 });
ViewTransactionSchema.index({ transactionType: 1, status: 1 });
ViewTransactionSchema.index({ status: 1, createdAt: -1 });
ViewTransactionSchema.index({ createdAt: -1 });
ViewTransactionSchema.index({ 'purchaseDetails.invoiceNumber': 1 });
ViewTransactionSchema.index({ 'purchaseDetails.paymentId': 1 });

// Static: Create purchase transaction
ViewTransactionSchema.statics.createPurchase = async function (data: {
  vendorId: mongoose.Types.ObjectId;
  amount: number;
  currency?: string;
  credits: number;
  paymentMethod: string;
  paymentId?: string;
  currentBalance: number;
}): Promise<IViewTransaction> {
  const pricePerCredit = data.amount / data.credits;
  const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  const transaction = new this({
    vendorId: data.vendorId,
    transactionType: 'purchase',
    purchaseDetails: {
      amount: data.amount,
      currency: data.currency || 'PKR',
      creditsAdded: data.credits,
      pricePerCredit,
      paymentMethod: data.paymentMethod,
      paymentId: data.paymentId,
      invoiceNumber,
    },
    creditBalanceBefore: data.currentBalance,
    creditBalanceAfter: data.currentBalance + data.credits,
    creditChange: data.credits,
    status: 'completed',
    description: `Purchased ${data.credits} view credits`,
  });

  await transaction.save();
  return transaction;
};

// Static: Create deduction transaction
ViewTransactionSchema.statics.createDeduction = async function (data: {
  vendorId: mongoose.Types.ObjectId;
  productViewId?: mongoose.Types.ObjectId;
  productId?: mongoose.Types.ObjectId;
  credits: number;
  reason: 'view_charged' | 'expired' | 'adjustment';
  currentBalance: number;
}): Promise<IViewTransaction> {
  const transaction = new this({
    vendorId: data.vendorId,
    transactionType: 'deduction',
    deductionDetails: {
      productViewId: data.productViewId,
      productId: data.productId,
      creditsDeducted: data.credits,
      reason: data.reason,
    },
    creditBalanceBefore: data.currentBalance,
    creditBalanceAfter: data.currentBalance - data.credits,
    creditChange: -data.credits,
    status: 'completed',
    description: `Deducted ${data.credits} credits for ${data.reason}`,
  });

  await transaction.save();
  return transaction;
};

// Static: Create bonus transaction
ViewTransactionSchema.statics.createBonus = async function (data: {
  vendorId: mongoose.Types.ObjectId;
  credits: number;
  reason: string;
  currentBalance: number;
  processedBy?: mongoose.Types.ObjectId;
}): Promise<IViewTransaction> {
  const transaction = new this({
    vendorId: data.vendorId,
    transactionType: 'bonus',
    creditBalanceBefore: data.currentBalance,
    creditBalanceAfter: data.currentBalance + data.credits,
    creditChange: data.credits,
    status: 'completed',
    description: `Bonus: ${data.reason}`,
    processedBy: data.processedBy,
  });

  await transaction.save();
  return transaction;
};

// Static: Get vendor transaction history
ViewTransactionSchema.statics.getVendorHistory = async function (
  vendorId: mongoose.Types.ObjectId,
  options: {
    limit?: number;
    offset?: number;
    type?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}
) {
  const query: Record<string, unknown> = { vendorId };

  if (options.type) {
    query.transactionType = options.type;
  }

  if (options.startDate || options.endDate) {
    query.createdAt = {};
    if (options.startDate) {
      (query.createdAt as Record<string, Date>).$gte = options.startDate;
    }
    if (options.endDate) {
      (query.createdAt as Record<string, Date>).$lte = options.endDate;
    }
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(options.offset || 0)
    .limit(options.limit || 50);
};

// Static: Get spending summary
ViewTransactionSchema.statics.getSpendingSummary = async function (
  vendorId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date
) {
  return this.aggregate([
    {
      $match: {
        vendorId,
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'completed',
      },
    },
    {
      $group: {
        _id: '$transactionType',
        totalCredits: { $sum: '$creditChange' },
        count: { $sum: 1 },
        totalAmount: {
          $sum: { $ifNull: ['$purchaseDetails.amount', 0] },
        },
      },
    },
  ]);
};

const ViewTransaction: Model<IViewTransaction> =
  mongoose.models.ViewTransaction ||
  mongoose.model<IViewTransaction>('ViewTransaction', ViewTransactionSchema);

export default ViewTransaction;

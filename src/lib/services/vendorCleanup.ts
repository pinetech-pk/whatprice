/**
 * Vendor Cleanup Service
 *
 * Handles permanent deletion of vendors and all associated data.
 * This is called either:
 * 1. By a cron job after the grace period expires
 * 2. Manually by admin for immediate permanent deletion
 */

import mongoose from 'mongoose';
import connectDB from '@/lib/db/connection';
import Vendor from '@/models/Vendor';
import Product from '@/models/Product';
import ProductView from '@/models/ProductView';
import ViewTransaction from '@/models/ViewTransaction';
import VendorMetrics from '@/models/VendorMetrics';
import MasterProduct from '@/models/MasterProduct';
import MasterProductRequest from '@/models/MasterProductRequest';
import User from '@/models/User';
import { deleteImages } from './imageKit';

export interface DeletionResult {
  vendorId: string;
  storeName: string;
  deleted: {
    products: number;
    productViews: number;
    vendorMetrics: number;
    viewTransactionsArchived: number;
    productRequests: number;
    imagesDeleted: number;
    imagesFailed: number;
  };
  masterProductsUpdated: number;
  userDeleted: boolean;
  success: boolean;
  error?: string;
}

/**
 * Permanently delete a vendor and all associated data
 */
export async function permanentlyDeleteVendor(vendorId: string): Promise<DeletionResult> {
  await connectDB();

  const result: DeletionResult = {
    vendorId,
    storeName: '',
    deleted: {
      products: 0,
      productViews: 0,
      vendorMetrics: 0,
      viewTransactionsArchived: 0,
      productRequests: 0,
      imagesDeleted: 0,
      imagesFailed: 0,
    },
    masterProductsUpdated: 0,
    userDeleted: false,
    success: false,
  };

  try {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      result.error = 'Vendor not found';
      return result;
    }

    result.storeName = vendor.storeName;

    // Get all product IDs for this vendor (needed for MasterProduct updates)
    const vendorProducts = await Product.find(
      { vendorId: vendor._id },
      { masterProductId: 1, price: 1, images: 1 }
    );
    const masterProductIds = [
      ...new Set(
        vendorProducts
          .filter((p) => p.masterProductId)
          .map((p) => p.masterProductId!.toString())
      ),
    ];

    // Collect all image URLs from products
    const productImageUrls: string[] = [];
    for (const product of vendorProducts) {
      if (product.images && Array.isArray(product.images)) {
        productImageUrls.push(...product.images);
      }
    }

    // Get all product request images
    const vendorRequests = await MasterProductRequest.find(
      { vendorId: vendor._id },
      { images: 1 }
    );
    const requestImageUrls: string[] = [];
    for (const request of vendorRequests) {
      if (request.images && Array.isArray(request.images)) {
        requestImageUrls.push(...request.images);
      }
    }

    // Combine all image URLs
    const allImageUrls = [...productImageUrls, ...requestImageUrls];

    // 1. Delete images from ImageKit
    if (allImageUrls.length > 0) {
      console.log(`[VendorCleanup] Deleting ${allImageUrls.length} images from ImageKit...`);
      const imageResult = await deleteImages(allImageUrls);
      result.deleted.imagesDeleted = imageResult.deleted;
      result.deleted.imagesFailed = imageResult.failed;
    }

    // 2. Delete all ProductViews for this vendor
    const viewsResult = await ProductView.deleteMany({ vendorId: vendor._id });
    result.deleted.productViews = viewsResult.deletedCount || 0;

    // 3. Delete all VendorMetrics for this vendor
    const metricsResult = await VendorMetrics.deleteMany({ vendorId: vendor._id });
    result.deleted.vendorMetrics = metricsResult.deletedCount || 0;

    // 4. Archive ViewTransactions (keep for audit trail, but anonymize)
    const transactionsResult = await ViewTransaction.updateMany(
      { vendorId: vendor._id },
      {
        $set: {
          notes: `Archived - Vendor "${vendor.storeName}" deleted`,
        },
        $unset: { vendorId: 1 },
      }
    );
    result.deleted.viewTransactionsArchived = transactionsResult.modifiedCount || 0;

    // 5. Delete all MasterProductRequests for this vendor
    const requestsResult = await MasterProductRequest.deleteMany({ vendorId: vendor._id });
    result.deleted.productRequests = requestsResult.deletedCount || 0;

    // 6. Delete all Products for this vendor
    const productsResult = await Product.deleteMany({ vendorId: vendor._id });
    result.deleted.products = productsResult.deletedCount || 0;

    // 7. Update MasterProduct aggregates (recalculate prices and vendor counts)
    for (const mpId of masterProductIds) {
      await updateMasterProductAggregates(mpId);
      result.masterProductsUpdated++;
    }

    // 8. Delete the User account associated with this vendor
    if (vendor.userId) {
      await User.deleteOne({ _id: vendor.userId });
      result.userDeleted = true;
    }

    // 9. Finally, delete the Vendor record itself
    await Vendor.deleteOne({ _id: vendor._id });

    result.success = true;
    console.log(`[VendorCleanup] Permanently deleted vendor: ${vendor.storeName} (${vendorId})`);
    console.log(`[VendorCleanup] Summary:`, JSON.stringify(result.deleted, null, 2));

    return result;
  } catch (error) {
    console.error(`[VendorCleanup] Error deleting vendor ${vendorId}:`, error);
    result.error = error instanceof Error ? error.message : 'Unknown error';
    return result;
  }
}

/**
 * Update MasterProduct aggregates after a vendor's products are deleted
 */
async function updateMasterProductAggregates(masterProductId: string): Promise<void> {
  const remainingProducts = await Product.find(
    {
      masterProductId: new mongoose.Types.ObjectId(masterProductId),
      isActive: true,
      deletedAt: null,
    },
    { price: 1 }
  );

  if (remainingProducts.length === 0) {
    // No more vendors selling this product
    await MasterProduct.updateOne(
      { _id: masterProductId },
      {
        vendorCount: 0,
        $unset: { minPrice: 1, maxPrice: 1, avgPrice: 1 },
        priceLastUpdated: new Date(),
      }
    );
  } else {
    const prices = remainingProducts.map((p) => p.price);
    await MasterProduct.updateOne(
      { _id: masterProductId },
      {
        vendorCount: prices.length,
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
        avgPrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
        priceLastUpdated: new Date(),
      }
    );
  }
}

/**
 * Process all vendors scheduled for permanent deletion
 * This should be called by a cron job (e.g., daily)
 */
export async function processScheduledDeletions(): Promise<{
  processed: number;
  successful: number;
  failed: number;
  results: DeletionResult[];
}> {
  await connectDB();

  const vendorsToDelete = await Vendor.find({
    deletedAt: { $ne: null },
    deleteScheduledFor: { $lte: new Date() },
  });

  const results: DeletionResult[] = [];
  let successful = 0;
  let failed = 0;

  console.log(`[VendorCleanup] Found ${vendorsToDelete.length} vendors scheduled for deletion`);

  for (const vendor of vendorsToDelete) {
    const result = await permanentlyDeleteVendor(vendor._id.toString());
    results.push(result);

    if (result.success) {
      successful++;
    } else {
      failed++;
    }
  }

  console.log(
    `[VendorCleanup] Processed ${vendorsToDelete.length} deletions: ${successful} successful, ${failed} failed`
  );

  return {
    processed: vendorsToDelete.length,
    successful,
    failed,
    results,
  };
}

/**
 * Get statistics about vendors in trash
 */
export async function getTrashStats(): Promise<{
  totalInTrash: number;
  scheduledForDeletion: number;
  totalCreditsAtRisk: number;
  vendors: Array<{
    id: string;
    storeName: string;
    deletedAt: Date;
    deleteScheduledFor: Date;
    viewCredits: number;
    productCount: number;
  }>;
}> {
  await connectDB();

  const trashedVendors = await Vendor.find({
    deletedAt: { $ne: null },
  }).sort({ deleteScheduledFor: 1 });

  const now = new Date();
  let scheduledForDeletion = 0;
  let totalCreditsAtRisk = 0;

  const vendors = await Promise.all(
    trashedVendors.map(async (vendor) => {
      const productCount = await Product.countDocuments({ vendorId: vendor._id });

      if (vendor.deleteScheduledFor && vendor.deleteScheduledFor <= now) {
        scheduledForDeletion++;
      }
      totalCreditsAtRisk += vendor.viewCredits;

      return {
        id: vendor._id.toString(),
        storeName: vendor.storeName,
        deletedAt: vendor.deletedAt!,
        deleteScheduledFor: vendor.deleteScheduledFor!,
        viewCredits: vendor.viewCredits,
        productCount,
      };
    })
  );

  return {
    totalInTrash: trashedVendors.length,
    scheduledForDeletion,
    totalCreditsAtRisk,
    vendors,
  };
}

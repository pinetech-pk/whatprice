/**
 * Vendor Cleanup Cron Job Script
 *
 * Processes vendors that have been in trash past their grace period.
 * Run this script daily via cron job or scheduled task.
 *
 * Usage:
 *   npx tsx scripts/cleanupDeletedVendors.ts
 *
 * Cron example (run daily at 2 AM):
 *   0 2 * * * cd /path/to/whatprice && npx tsx scripts/cleanupDeletedVendors.ts >> /var/log/vendor-cleanup.log 2>&1
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { processScheduledDeletions, getTrashStats } from '../src/lib/services/vendorCleanup';

async function main() {
  console.log('='.repeat(60));
  console.log(`[${new Date().toISOString()}] Vendor Cleanup Job Started`);
  console.log('='.repeat(60));

  try {
    // First, show current trash stats
    const stats = await getTrashStats();
    console.log('\n📊 Current Trash Stats:');
    console.log(`   Total vendors in trash: ${stats.totalInTrash}`);
    console.log(`   Scheduled for deletion now: ${stats.scheduledForDeletion}`);
    console.log(`   Total credits at risk: ${stats.totalCreditsAtRisk} PKR`);

    if (stats.vendors.length > 0) {
      console.log('\n📋 Vendors in Trash:');
      for (const vendor of stats.vendors) {
        const isOverdue = new Date(vendor.deleteScheduledFor) <= new Date();
        console.log(
          `   - ${vendor.storeName} (${vendor.productCount} products, ${vendor.viewCredits} credits)` +
            `${isOverdue ? ' [READY FOR DELETION]' : ''}`
        );
        console.log(`     Scheduled for: ${vendor.deleteScheduledFor.toLocaleDateString()}`);
      }
    }

    // Process scheduled deletions
    if (stats.scheduledForDeletion > 0) {
      console.log('\n🗑️  Processing scheduled deletions...');
      const result = await processScheduledDeletions();

      console.log('\n✅ Cleanup Results:');
      console.log(`   Processed: ${result.processed}`);
      console.log(`   Successful: ${result.successful}`);
      console.log(`   Failed: ${result.failed}`);

      if (result.results.length > 0) {
        console.log('\n📝 Detailed Results:');
        for (const r of result.results) {
          if (r.success) {
            console.log(`   ✓ ${r.storeName}:`);
            console.log(`     - Products deleted: ${r.deleted.products}`);
            console.log(`     - Product views deleted: ${r.deleted.productViews}`);
            console.log(`     - Metrics deleted: ${r.deleted.vendorMetrics}`);
            console.log(`     - Transactions archived: ${r.deleted.viewTransactionsArchived}`);
            console.log(`     - Master products updated: ${r.masterProductsUpdated}`);
          } else {
            console.log(`   ✗ ${r.storeName || r.vendorId}: ${r.error}`);
          }
        }
      }
    } else {
      console.log('\n✨ No vendors scheduled for deletion at this time.');
    }

    console.log('\n' + '='.repeat(60));
    console.log(`[${new Date().toISOString()}] Vendor Cleanup Job Completed`);
    console.log('='.repeat(60));

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error running cleanup job:', error);
    process.exit(1);
  }
}

main();

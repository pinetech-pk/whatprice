import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
import Vendor from '@/models/Vendor';
import Product from '@/models/Product';
import { getVendorSession } from '@/lib/auth/vendorAuth';
import { searchMasterProducts } from '@/lib/services/duplicateDetection';

// GET: Search MasterProducts for vendor to link their price
export async function GET(request: Request) {
  try {
    const session = await getVendorSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Verify vendor
    const vendor = await Vendor.findById(session.vendorId);

    if (!vendor || vendor.deletedAt) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    if (vendor.verificationStatus !== 'verified') {
      return NextResponse.json(
        { error: 'Vendor must be verified to list products' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;
    const brand = searchParams.get('brand') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Search MasterProducts
    const result = await searchMasterProducts(
      { search, categoryId, brand },
      { page, limit }
    );

    // Get vendor's existing listings for these MasterProducts
    const masterProductIds = result.products.map((p) => p._id);
    const existingListings = await Product.find({
      vendorId: vendor._id,
      masterProductId: { $in: masterProductIds },
      deletedAt: null,
    }).select('masterProductId');

    const existingMasterProductIds = new Set(
      existingListings.map((l) => l.masterProductId?.toString())
    );

    // Add flag to indicate if vendor already has a listing
    const productsWithFlag = result.products.map((product) => ({
      ...product.toObject(),
      vendorHasListing: existingMasterProductIds.has(product._id.toString()),
    }));

    return NextResponse.json({
      success: true,
      products: productsWithFlag,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: result.pages,
      },
    });
  } catch (error) {
    console.error('Search master products error:', error);
    return NextResponse.json(
      { error: 'Failed to search products' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
import Vendor from '@/models/Vendor';
import Product from '@/models/Product';
import MasterProduct from '@/models/MasterProduct';
import Category from '@/models/Category';
import { getVendorSession } from '@/lib/auth/vendorAuth';

// POST: Add vendor's price listing to an existing MasterProduct
export async function POST(request: Request) {
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

    const body = await request.json();
    const {
      masterProductId,
      price,
      originalPrice,
      stock,
      sku,
      description,
      images,
      dailyBudget,
      totalBudget,
    } = body;

    // Validate required fields
    if (!masterProductId) {
      return NextResponse.json(
        { error: 'Master product ID is required' },
        { status: 400 }
      );
    }

    if (!price || price <= 0) {
      return NextResponse.json(
        { error: 'Valid price is required' },
        { status: 400 }
      );
    }

    // Get MasterProduct
    const masterProduct = await MasterProduct.findById(masterProductId);
    if (!masterProduct) {
      return NextResponse.json(
        { error: 'Master product not found' },
        { status: 404 }
      );
    }

    if (!masterProduct.isActive) {
      return NextResponse.json(
        { error: 'This product is not available for listing' },
        { status: 400 }
      );
    }

    // Check if vendor already has a listing for this MasterProduct
    const existingListing = await Product.findOne({
      vendorId: vendor._id,
      masterProductId: masterProductId,
      deletedAt: null,
    });

    if (existingListing) {
      return NextResponse.json(
        { error: 'You already have a listing for this product. Edit your existing listing instead.' },
        { status: 400 }
      );
    }

    // Get category for bid settings
    const category = await Category.findById(masterProduct.category);
    const defaultBid = category?.minBidAmount || vendor.defaultBidAmount || 1;

    // Generate unique slug
    const baseSlug = `${vendor.slug}-${masterProduct.slug}`;
    let slug = baseSlug;
    let counter = 1;
    while (await Product.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create the vendor listing
    const listing = await Product.create({
      vendorId: vendor._id,
      masterProductId: masterProduct._id,
      productType: 'comparative',

      // Product info from MasterProduct
      name: masterProduct.name,
      slug,
      brand: masterProduct.brand,
      productModel: masterProduct.modelNumber,
      category: masterProduct.category,

      // Vendor-specific data
      price,
      originalPrice: originalPrice || undefined,
      stock: stock || 0,
      isInStock: (stock || 0) > 0,
      sku: sku || undefined,
      description: description || masterProduct.description,
      images: images?.length ? images : masterProduct.images,

      // CPV settings
      currentBid: defaultBid,
      placementTier: 'standard',
      dailyBudget: dailyBudget || 100,
      totalBudget: totalBudget || 1000,

      // Status
      isActive: true,
      createdBy: vendor._id,
    });

    // Update MasterProduct aggregates
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (masterProduct as any).updatePriceAggregates();

    // Update vendor product count
    await Vendor.updateOne(
      { _id: vendor._id },
      { $inc: { totalProducts: 1, activeProducts: 1 } }
    );

    return NextResponse.json({
      success: true,
      message: 'Listing created successfully',
      listing: {
        _id: listing._id,
        slug: listing.slug,
        price: listing.price,
        masterProduct: {
          _id: masterProduct._id,
          name: masterProduct.name,
          slug: masterProduct.slug,
        },
      },
    });
  } catch (error) {
    console.error('Create listing error:', error);
    return NextResponse.json(
      { error: 'Failed to create listing' },
      { status: 500 }
    );
  }
}

// GET: Get vendor's listings
export async function GET(request: Request) {
  try {
    const session = await getVendorSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const vendor = await Vendor.findById(session.vendorId);

    if (!vendor || vendor.deletedAt) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status'); // 'active', 'inactive', 'all'
    const search = searchParams.get('search');

    const query: Record<string, unknown> = {
      vendorId: vendor._id,
      deletedAt: null,
    };

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [listings, total] = await Promise.all([
      Product.find(query)
        .populate('masterProductId', 'name slug vendorCount minPrice maxPrice')
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(query),
    ]);

    // Get stats
    const stats = await Product.aggregate([
      { $match: { vendorId: vendor._id, deletedAt: null } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } },
          comparative: { $sum: { $cond: [{ $eq: ['$productType', 'comparative'] }, 1, 0] } },
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      listings,
      stats: stats[0] || { total: 0, active: 0, comparative: 0 },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get listings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}

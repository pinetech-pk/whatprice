import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
import Product from '@/models/Product';
import Vendor from '@/models/Vendor';

// GET: Public product listing with CPV-based ranking
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const categoryId = searchParams.get('category');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const brand = searchParams.get('brand');
    const city = searchParams.get('city');
    const sort = searchParams.get('sort') || 'recommended'; // recommended, price_low, price_high, newest, rating

    await connectDB();

    // Build query for active products from verified vendors
    const query: Record<string, unknown> = {
      isActive: true,
      isInStock: true,
    };

    if (categoryId) {
      query.category = categoryId;
    }

    if (brand) {
      query.brand = { $regex: brand, $options: 'i' };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) {
        (query.price as Record<string, number>).$gte = Number(minPrice);
      }
      if (maxPrice) {
        (query.price as Record<string, number>).$lte = Number(maxPrice);
      }
    }

    // Get verified vendor IDs
    const vendorQuery: Record<string, unknown> = {
      verificationStatus: 'verified',
      isActive: true,
    };

    if (city) {
      vendorQuery['address.city'] = { $regex: city, $options: 'i' };
    }

    const verifiedVendors = await Vendor.find(vendorQuery).select('_id');
    const vendorIds = verifiedVendors.map((v) => v._id);
    query.vendorId = { $in: vendorIds };

    // Build sort options
    let sortOption: Record<string, 1 | -1> = {};

    switch (sort) {
      case 'price_low':
        sortOption = { price: 1 };
        break;
      case 'price_high':
        sortOption = { price: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'rating':
        sortOption = { rating: -1, reviewCount: -1 };
        break;
      case 'recommended':
      default:
        // CPV-based ranking: higher bid = better placement
        sortOption = { placementTier: -1, currentBid: -1, rating: -1 };
        break;
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .populate('vendorId', 'storeName slug rating address.city')
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .select(
          'name slug description brand images price originalPrice currency rating reviewCount viewCount category vendorId placementTier createdAt'
        ),
      Product.countDocuments(query),
    ]);

    // Get unique brands for filters
    const brands = await Product.distinct('brand', {
      ...query,
      brand: { $exists: true, $ne: '' },
    });

    // Get price range for filters
    const priceStats = await Product.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      products,
      filters: {
        brands: brands.filter(Boolean).slice(0, 50),
        priceRange: priceStats[0] || { minPrice: 0, maxPrice: 0 },
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

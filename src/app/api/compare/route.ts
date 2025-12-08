import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
import Product from '@/models/Product';
import MasterProduct from '@/models/MasterProduct';
import Vendor from '@/models/Vendor';

// GET: Compare prices for a product across vendors
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const masterProductId = searchParams.get('masterProductId');
    const productName = searchParams.get('name');
    const categoryId = searchParams.get('category');
    const brand = searchParams.get('brand');
    const sort = searchParams.get('sort') || 'price_low'; // price_low, price_high, rating, bid

    await connectDB();

    let masterProduct = null;
    let matchingProducts = [];

    if (masterProductId) {
      // Get master product and all vendor listings
      masterProduct = await MasterProduct.findById(masterProductId)
        .populate('category', 'name slug');

      if (!masterProduct) {
        return NextResponse.json(
          { error: 'Product not found for comparison' },
          { status: 404 }
        );
      }

      // Get verified vendor IDs
      const verifiedVendors = await Vendor.find({
        verificationStatus: 'verified',
        isActive: true,
      }).select('_id');
      const vendorIds = verifiedVendors.map((v) => v._id);

      // Find all products linked to this master product
      matchingProducts = await Product.find({
        masterProductId: masterProduct._id,
        isActive: true,
        isInStock: true,
        vendorId: { $in: vendorIds },
      })
        .populate('vendorId', 'storeName slug rating reviewCount address.city phone whatsapp')
        .lean();
    } else if (productName || (categoryId && brand)) {
      // Search for similar products by name/brand/category
      const verifiedVendors = await Vendor.find({
        verificationStatus: 'verified',
        isActive: true,
      }).select('_id');
      const vendorIds = verifiedVendors.map((v) => v._id);

      const query: Record<string, unknown> = {
        isActive: true,
        isInStock: true,
        vendorId: { $in: vendorIds },
      };

      if (productName) {
        query.$or = [
          { name: { $regex: productName, $options: 'i' } },
          { brand: { $regex: productName, $options: 'i' } },
          { productModel: { $regex: productName, $options: 'i' } },
        ];
      }

      if (categoryId) {
        query.category = categoryId;
      }

      if (brand) {
        query.brand = { $regex: brand, $options: 'i' };
      }

      matchingProducts = await Product.find(query)
        .populate('vendorId', 'storeName slug rating reviewCount address.city phone whatsapp')
        .populate('category', 'name slug')
        .lean();
    } else {
      return NextResponse.json(
        { error: 'Please provide masterProductId, name, or category with brand' },
        { status: 400 }
      );
    }

    // Sort products
    switch (sort) {
      case 'price_low':
        matchingProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        matchingProducts.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        matchingProducts.sort((a, b) => {
          const vendorA = a.vendorId as { rating?: number } | null;
          const vendorB = b.vendorId as { rating?: number } | null;
          return (vendorB?.rating || 0) - (vendorA?.rating || 0);
        });
        break;
      case 'bid':
        // CPV-based ranking
        matchingProducts.sort((a, b) => {
          const tierOrder = { premium: 3, enhanced: 2, standard: 1 };
          const tierDiff = (tierOrder[b.placementTier as keyof typeof tierOrder] || 1) -
                           (tierOrder[a.placementTier as keyof typeof tierOrder] || 1);
          if (tierDiff !== 0) return tierDiff;
          return b.currentBid - a.currentBid;
        });
        break;
    }

    // Calculate price statistics
    const prices = matchingProducts.map((p) => p.price);
    const priceStats = prices.length > 0
      ? {
          min: Math.min(...prices),
          max: Math.max(...prices),
          avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
          count: prices.length,
        }
      : { min: 0, max: 0, avg: 0, count: 0 };

    // Format vendor listings
    const vendorListings = matchingProducts.map((product) => {
      const vendor = product.vendorId as unknown as {
        _id: string;
        storeName: string;
        slug: string;
        rating: number;
        reviewCount: number;
        address?: { city?: string };
        phone?: string;
        whatsapp?: string;
      } | null;

      return {
        productId: product._id,
        productSlug: product.slug,
        productName: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        currency: product.currency,
        discount: product.originalPrice
          ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
          : 0,
        isInStock: product.isInStock,
        stock: product.stock,
        rating: product.rating,
        reviewCount: product.reviewCount,
        images: product.images?.slice(0, 2),
        vendor: vendor
          ? {
              id: vendor._id,
              name: vendor.storeName,
              slug: vendor.slug,
              rating: vendor.rating,
              reviewCount: vendor.reviewCount,
              city: vendor.address?.city,
              phone: vendor.phone,
              whatsapp: vendor.whatsapp,
            }
          : null,
        placementTier: product.placementTier,
      };
    });

    // Get unique cities for filtering
    const cities = [...new Set(
      vendorListings
        .map((l) => l.vendor?.city)
        .filter(Boolean)
    )];

    return NextResponse.json({
      success: true,
      masterProduct: masterProduct
        ? {
            id: masterProduct._id,
            name: masterProduct.name,
            slug: masterProduct.slug,
            brand: masterProduct.brand,
            modelNumber: masterProduct.modelNumber,
            images: masterProduct.images,
            category: masterProduct.category,
            specifications: masterProduct.specifications,
          }
        : null,
      priceStats,
      vendorListings,
      filters: {
        cities,
        sortOptions: [
          { value: 'price_low', label: 'Lowest Price' },
          { value: 'price_high', label: 'Highest Price' },
          { value: 'rating', label: 'Best Rating' },
          { value: 'bid', label: 'Featured' },
        ],
      },
    });
  } catch (error) {
    console.error('Compare prices error:', error);
    return NextResponse.json(
      { error: 'Failed to compare prices' },
      { status: 500 }
    );
  }
}

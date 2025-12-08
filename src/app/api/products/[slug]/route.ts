import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
import Product from '@/models/Product';
import Vendor from '@/models/Vendor';

// GET: Public product detail
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await connectDB();

    const product = await Product.findOne({
      slug,
      isActive: true,
    })
      .populate('category', 'name slug parent')
      .populate('vendorId', 'storeName slug description logo rating reviewCount address phone whatsapp verificationStatus');

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check vendor status
    const vendor = product.vendorId as unknown as {
      verificationStatus: string;
      [key: string]: unknown;
    };

    if (!vendor || vendor.verificationStatus !== 'verified') {
      return NextResponse.json(
        { error: 'Product not available' },
        { status: 404 }
      );
    }

    // Get related products from same category
    const relatedProducts = await Product.find({
      _id: { $ne: product._id },
      category: product.category,
      isActive: true,
      isInStock: true,
    })
      .populate('vendorId', 'storeName slug rating')
      .sort({ rating: -1, viewCount: -1 })
      .limit(8)
      .select('name slug images price originalPrice rating reviewCount vendorId');

    // Get other products from same vendor
    const vendorProducts = await Product.find({
      _id: { $ne: product._id },
      vendorId: product.vendorId,
      isActive: true,
      isInStock: true,
    })
      .sort({ viewCount: -1 })
      .limit(4)
      .select('name slug images price originalPrice rating');

    // Increment view count (non-blocking)
    Product.updateOne(
      { _id: product._id },
      { $inc: { viewCount: 1, impressions: 1 } }
    ).exec();

    return NextResponse.json({
      success: true,
      product: {
        id: product._id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        brand: product.brand,
        productModel: product.productModel,
        sku: product.sku,
        images: product.images,
        price: product.price,
        originalPrice: product.originalPrice,
        currency: product.currency,
        stock: product.stock,
        isInStock: product.isInStock,
        category: product.category,
        specifications: product.specifications,
        features: product.features,
        tags: product.tags,
        rating: product.rating,
        reviewCount: product.reviewCount,
        viewCount: product.viewCount,
        vendor: product.vendorId,
        metaTitle: product.metaTitle,
        metaDescription: product.metaDescription,
        createdAt: product.createdAt,
      },
      relatedProducts,
      vendorProducts,
    });
  } catch (error) {
    console.error('Get product detail error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
import Product from '@/models/Product';
import Vendor from '@/models/Vendor';
import Category from '@/models/Category';
import { getVendorSession, sanitizeInput } from '@/lib/auth/vendorAuth';

// GET: List vendor's products
export async function GET(request: Request) {
  try {
    const session = await getVendorSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status'); // active, inactive, all
    const search = searchParams.get('search');
    const categoryId = searchParams.get('category');

    await connectDB();

    // Build query
    const query: Record<string, unknown> = { vendorId: session.vendorId };

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    if (categoryId) {
      query.category = categoryId;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get vendor products error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST: Create a new product
export async function POST(request: Request) {
  try {
    const session = await getVendorSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    await connectDB();

    // Check vendor status
    const vendor = await Vendor.findById(session.vendorId);
    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    if (vendor.verificationStatus !== 'verified') {
      return NextResponse.json(
        { error: 'Your vendor account must be verified before listing products' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const requiredFields = ['name', 'price', 'category'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Validate category exists
    const category = await Category.findById(body.category);
    if (!category) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Generate slug
    const baseSlug = sanitizeInput(body.name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check for duplicate slug and make unique
    let slug = baseSlug;
    let counter = 1;
    while (await Product.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Get CPV settings from category or use defaults
    const defaultBid = Math.max(
      category.minBidAmount || 10,
      vendor.defaultBidAmount
    );

    // Create product
    const product = await Product.create({
      vendorId: vendor._id,
      name: sanitizeInput(body.name),
      slug,
      description: body.description ? sanitizeInput(body.description) : undefined,
      brand: body.brand ? sanitizeInput(body.brand) : undefined,
      productModel: body.productModel ? sanitizeInput(body.productModel) : undefined,
      sku: body.sku ? sanitizeInput(body.sku) : undefined,
      barcode: body.barcode ? sanitizeInput(body.barcode) : undefined,
      category: category._id,
      images: body.images || [],
      productType: body.productType || 'unique',
      masterProductId: body.masterProductId || undefined,
      price: Number(body.price),
      originalPrice: body.originalPrice ? Number(body.originalPrice) : undefined,
      currency: body.currency || 'PKR',
      stock: body.stock ? Number(body.stock) : 0,
      isInStock: body.stock > 0,
      specifications: body.specifications || {},
      features: body.features || [],
      tags: body.tags || [],
      isActive: true,
      currentBid: defaultBid,
      placementTier: 'standard',
      dailyBudget: body.dailyBudget ? Number(body.dailyBudget) : undefined,
      totalBudget: body.totalBudget ? Number(body.totalBudget) : undefined,
      metaTitle: body.metaTitle ? sanitizeInput(body.metaTitle) : undefined,
      metaDescription: body.metaDescription ? sanitizeInput(body.metaDescription) : undefined,
    });

    // Update vendor product count
    vendor.totalProducts += 1;
    vendor.activeProducts += 1;
    await vendor.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Product created successfully',
        product: {
          id: product._id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          isActive: product.isActive,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
import Product from '@/models/Product';
import Vendor from '@/models/Vendor';
import Category from '@/models/Category';
import { getVendorSession, sanitizeInput } from '@/lib/auth/vendorAuth';

// GET: Get single product details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getVendorSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    await connectDB();

    const product = await Product.findOne({
      _id: id,
      vendorId: session.vendorId,
    }).populate('category', 'name slug');

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error('Get product error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PUT: Update product
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getVendorSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    await connectDB();

    const product = await Product.findOne({
      _id: id,
      vendorId: session.vendorId,
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const vendor = await Vendor.findById(session.vendorId);

    // Track if product is being activated/deactivated
    const wasActive = product.isActive;

    // Update allowed fields
    if (body.name !== undefined) {
      product.name = sanitizeInput(body.name);
    }
    if (body.description !== undefined) {
      product.description = sanitizeInput(body.description);
    }
    if (body.brand !== undefined) {
      product.brand = sanitizeInput(body.brand);
    }
    if (body.productModel !== undefined) {
      product.productModel = sanitizeInput(body.productModel);
    }
    if (body.sku !== undefined) {
      product.sku = sanitizeInput(body.sku);
    }
    if (body.barcode !== undefined) {
      product.barcode = sanitizeInput(body.barcode);
    }
    if (body.images !== undefined) {
      product.images = body.images;
    }
    if (body.price !== undefined) {
      product.price = Number(body.price);
    }
    if (body.originalPrice !== undefined) {
      product.originalPrice = Number(body.originalPrice);
    }
    if (body.stock !== undefined) {
      product.stock = Number(body.stock);
      product.isInStock = product.stock > 0;
    }
    if (body.specifications !== undefined) {
      product.specifications = body.specifications;
    }
    if (body.features !== undefined) {
      product.features = body.features;
    }
    if (body.tags !== undefined) {
      product.tags = body.tags;
    }
    if (body.isActive !== undefined) {
      product.isActive = body.isActive;
    }
    if (body.metaTitle !== undefined) {
      product.metaTitle = sanitizeInput(body.metaTitle);
    }
    if (body.metaDescription !== undefined) {
      product.metaDescription = sanitizeInput(body.metaDescription);
    }

    // CPV Settings
    if (body.currentBid !== undefined) {
      const bid = Number(body.currentBid);
      if (bid < 10) {
        return NextResponse.json(
          { error: 'Minimum bid amount is PKR 10' },
          { status: 400 }
        );
      }
      product.currentBid = bid;
    }
    if (body.placementTier !== undefined) {
      if (!['standard', 'enhanced', 'premium'].includes(body.placementTier)) {
        return NextResponse.json(
          { error: 'Invalid placement tier' },
          { status: 400 }
        );
      }
      product.placementTier = body.placementTier;
    }
    if (body.dailyBudget !== undefined) {
      product.dailyBudget = body.dailyBudget ? Number(body.dailyBudget) : undefined;
    }
    if (body.totalBudget !== undefined) {
      product.totalBudget = body.totalBudget ? Number(body.totalBudget) : undefined;
    }

    // Update category if provided
    if (body.category) {
      const category = await Category.findById(body.category);
      if (!category) {
        return NextResponse.json(
          { error: 'Invalid category' },
          { status: 400 }
        );
      }
      product.category = category._id;
    }

    await product.save();

    // Update vendor active product count if status changed
    if (vendor && wasActive !== product.isActive) {
      if (product.isActive) {
        vendor.activeProducts += 1;
      } else {
        vendor.activeProducts -= 1;
      }
      await vendor.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      product: {
        id: product._id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        isActive: product.isActive,
      },
    });
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE: Delete product
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getVendorSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    await connectDB();

    const product = await Product.findOne({
      _id: id,
      vendorId: session.vendorId,
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const wasActive = product.isActive;

    // Soft delete - just mark as inactive and delete
    await Product.deleteOne({ _id: product._id });

    // Update vendor product counts
    const vendor = await Vendor.findById(session.vendorId);
    if (vendor) {
      vendor.totalProducts -= 1;
      if (wasActive) {
        vendor.activeProducts -= 1;
      }
      await vendor.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}

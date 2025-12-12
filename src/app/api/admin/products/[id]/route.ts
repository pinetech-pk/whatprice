import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db/connection';
import Product from '@/models/Product';
import ProductView from '@/models/ProductView';

async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return !!session;
}

// GET: Get single product details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const product = await Product.findById(id)
      .populate('vendorId', 'storeName slug email phone verificationStatus')
      .populate('category', 'name slug');

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get view stats
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const viewStats = await ProductView.aggregate([
      {
        $match: {
          productId: product._id,
          timestamp: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: null,
          totalViews: { $sum: 1 },
          qualifiedViews: { $sum: { $cond: ['$isQualifiedView', 1, 0] } },
          clicks: { $sum: { $cond: ['$clickedContact', 1, 0] } },
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      product: {
        ...product.toObject(),
        recentStats: viewStats[0] || { totalViews: 0, qualifiedViews: 0, clicks: 0 },
      },
    });
  } catch (error) {
    console.error('Admin get product error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PUT: Update product (activate/deactivate, feature)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    await connectDB();

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Handle activation/deactivation
    if (body.action === 'activate') {
      product.isActive = true;
      await product.save();
      return NextResponse.json({
        success: true,
        message: 'Product activated',
      });
    }

    if (body.action === 'deactivate') {
      product.isActive = false;
      await product.save();
      return NextResponse.json({
        success: true,
        message: 'Product deactivated',
      });
    }

    // Handle feature toggle (switch between premium and standard)
    if (body.action === 'feature') {
      product.placementTier = product.placementTier === 'premium' ? 'standard' : 'premium';
      await product.save();
      return NextResponse.json({
        success: true,
        message: product.placementTier === 'premium' ? 'Product featured' : 'Product unfeatured',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Admin update product error:', error);
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
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Soft delete - just deactivate
    product.isActive = false;
    await product.save();

    return NextResponse.json({
      success: true,
      message: 'Product deleted (deactivated)',
    });
  } catch (error) {
    console.error('Admin delete product error:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}

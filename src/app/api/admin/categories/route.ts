import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db/connection';
import Category from '@/models/Category';
import Product from '@/models/Product';

async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return !!session;
}

// GET: List all categories with hierarchy
export async function GET(request: Request) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'flat'; // flat or tree
    const includeInactive = searchParams.get('includeInactive') === 'true';

    await connectDB();

    const query: Record<string, unknown> = {};
    if (!includeInactive) {
      query.isActive = true;
    }

    if (format === 'tree') {
      const tree = await Category.getTree();
      return NextResponse.json({
        success: true,
        categories: tree,
      });
    }

    // Flat list with all details
    const categories = await Category.find(query)
      .sort({ order: 1, name: 1 })
      .lean();

    // Get product counts for each category
    const productCounts = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    const countMap = new Map(productCounts.map((p) => [p._id?.toString(), p.count]));

    const categoriesWithCounts = categories.map((cat) => ({
      ...cat,
      _id: cat._id.toString(),
      parent: cat.parent?.toString() || null,
      productCount: countMap.get(cat._id.toString()) || 0,
    }));

    // Get stats
    const stats = {
      total: categories.length,
      active: categories.filter((c) => c.isActive).length,
      withProducts: categoriesWithCounts.filter((c) => c.productCount > 0).length,
      rootCategories: categories.filter((c) => !c.parent).length,
    };

    return NextResponse.json({
      success: true,
      categories: categoriesWithCounts,
      stats,
    });
  } catch (error) {
    console.error('Admin get categories error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST: Create new category
export async function POST(request: Request) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      parent,
      icon,
      order,
      baseViewRate,
      minBidAmount,
      maxBidAmount,
      competitiveness,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Generate slug
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check for duplicate slug
    const existing = await Category.findOne({ slug });
    if (existing) {
      return NextResponse.json(
        { error: 'A category with this name already exists' },
        { status: 400 }
      );
    }

    // Validate parent if provided
    if (parent) {
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        return NextResponse.json(
          { error: 'Parent category not found' },
          { status: 400 }
        );
      }
    }

    const category = new Category({
      name: name.trim(),
      slug,
      description: description?.trim(),
      parent: parent || null,
      icon,
      order: order || 0,
      baseViewRate: baseViewRate || 10,
      minBidAmount: minBidAmount || 10,
      maxBidAmount: maxBidAmount || 100,
      competitiveness: competitiveness || 'low',
      isActive: true,
      currency: 'PKR',
      totalProducts: 0,
      totalViews: 0,
    });

    await category.save();

    return NextResponse.json({
      success: true,
      message: 'Category created successfully',
      category: {
        _id: category._id.toString(),
        name: category.name,
        slug: category.slug,
      },
    });
  } catch (error) {
    console.error('Admin create category error:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}

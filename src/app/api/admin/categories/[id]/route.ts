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

// GET: Get single category details
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

    const category = await Category.findById(id).populate('parent', 'name slug');
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Get children
    const children = await Category.find({ parent: id })
      .select('name slug isActive')
      .sort({ order: 1 });

    // Get product count
    const productCount = await Product.countDocuments({ category: id });

    return NextResponse.json({
      success: true,
      category: {
        ...category.toObject(),
        children,
        productCount,
      },
    });
  } catch (error) {
    console.error('Admin get category error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

// PUT: Update category
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

    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Handle specific actions
    if (body.action === 'toggle') {
      category.isActive = !category.isActive;
      await category.save();
      return NextResponse.json({
        success: true,
        message: category.isActive ? 'Category activated' : 'Category deactivated',
      });
    }

    // Update fields
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

    if (name) {
      // Check for duplicate if name changed
      const newSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      if (newSlug !== category.slug) {
        const existing = await Category.findOne({ slug: newSlug, _id: { $ne: id } });
        if (existing) {
          return NextResponse.json(
            { error: 'A category with this name already exists' },
            { status: 400 }
          );
        }
        category.slug = newSlug;
      }
      category.name = name.trim();
    }

    if (description !== undefined) category.description = description?.trim();
    if (icon !== undefined) category.icon = icon;
    if (order !== undefined) category.order = order;
    if (baseViewRate !== undefined) category.baseViewRate = baseViewRate;
    if (minBidAmount !== undefined) category.minBidAmount = minBidAmount;
    if (maxBidAmount !== undefined) category.maxBidAmount = maxBidAmount;
    if (competitiveness !== undefined) category.competitiveness = competitiveness;

    // Handle parent change
    if (parent !== undefined) {
      // Prevent circular reference
      if (parent === id) {
        return NextResponse.json(
          { error: 'Category cannot be its own parent' },
          { status: 400 }
        );
      }

      // Check if new parent is a descendant
      if (parent) {
        let currentParent = parent;
        while (currentParent) {
          if (currentParent === id) {
            return NextResponse.json(
              { error: 'Cannot set a descendant as parent' },
              { status: 400 }
            );
          }
          const parentCat = await Category.findById(currentParent);
          currentParent = parentCat?.parent?.toString() || null;
        }
      }

      category.parent = parent || null;
    }

    await category.save();

    return NextResponse.json({
      success: true,
      message: 'Category updated successfully',
      category: {
        _id: category._id.toString(),
        name: category.name,
        slug: category.slug,
      },
    });
  } catch (error) {
    console.error('Admin update category error:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE: Delete category
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

    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Check for children
    const childCount = await Category.countDocuments({ parent: id });
    if (childCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete category with ${childCount} subcategories. Delete or move them first.`,
        },
        { status: 400 }
      );
    }

    // Check for products
    const productCount = await Product.countDocuments({ category: id });
    if (productCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete category with ${productCount} products. Move products to another category first.`,
        },
        { status: 400 }
      );
    }

    await Category.deleteOne({ _id: id });

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    console.error('Admin delete category error:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}

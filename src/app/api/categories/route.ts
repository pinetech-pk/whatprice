import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
import Category from '@/models/Category';

export interface CategoryTreeNode {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parent: string | null;
  baseViewRate: number;
  minBidAmount: number;
  maxBidAmount: number;
  competitiveness: 'low' | 'medium' | 'high';
  children?: CategoryTreeNode[];
}

// GET: Fetch categories (supports flat list or tree structure)
export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'flat'; // 'flat' or 'tree'
    const parentId = searchParams.get('parent'); // Filter by parent ID
    const includeAll = searchParams.get('includeAll') === 'true'; // Include inactive

    // Build query
    const query: Record<string, unknown> = {};
    if (!includeAll) {
      query.isActive = true;
    }
    if (parentId === 'null' || parentId === '') {
      query.parent = null;
    } else if (parentId) {
      query.parent = parentId;
    }

    if (format === 'tree') {
      // Return hierarchical tree structure
      const tree = await Category.getTree();
      return NextResponse.json({
        success: true,
        categories: tree,
      });
    }

    // Return flat list with all useful fields
    const categories = await Category.find(query)
      .select('name slug description icon parent baseViewRate minBidAmount maxBidAmount competitiveness order')
      .sort({ order: 1, name: 1 });

    // Transform for response
    const formattedCategories = categories.map((cat) => ({
      _id: cat._id.toString(),
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      icon: cat.icon,
      parent: cat.parent?.toString() || null,
      baseViewRate: cat.baseViewRate,
      minBidAmount: cat.minBidAmount,
      maxBidAmount: cat.maxBidAmount,
      competitiveness: cat.competitiveness,
    }));

    return NextResponse.json({
      success: true,
      categories: formattedCategories,
    });
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// GET /api/categories/[id]/children - Get child categories
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, parentId } = body;

    await connectDB();

    if (action === 'getChildren') {
      const query: Record<string, unknown> = {
        isActive: true,
        parent: parentId || null,
      };

      const children = await Category.find(query)
        .select('name slug description icon parent baseViewRate minBidAmount maxBidAmount competitiveness order')
        .sort({ order: 1, name: 1 });

      const formattedChildren = children.map((cat) => ({
        _id: cat._id.toString(),
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        icon: cat.icon,
        parent: cat.parent?.toString() || null,
        baseViewRate: cat.baseViewRate,
        minBidAmount: cat.minBidAmount,
        maxBidAmount: cat.maxBidAmount,
        competitiveness: cat.competitiveness,
      }));

      return NextResponse.json({
        success: true,
        categories: formattedChildren,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Categories POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
import Vendor from '@/models/Vendor';
import Category from '@/models/Category';
import MasterProductRequest from '@/models/MasterProductRequest';
import { getVendorSession } from '@/lib/auth/vendorAuth';
import { detectDuplicates, checkExactDuplicate } from '@/lib/services/duplicateDetection';

// POST: Submit a new MasterProduct request
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
        { error: 'Vendor must be verified to request new products' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      brand,
      modelNumber,
      categoryId,
      description,
      specifications,
      images,
      features,
      proposedPrice,
      proposedOriginalPrice,
      proposedStock,
      proposedSku,
    } = body;

    // Validate required fields
    if (!name || !brand || !categoryId || !proposedPrice) {
      return NextResponse.json(
        { error: 'Name, brand, category, and price are required' },
        { status: 400 }
      );
    }

    // Validate category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Check for exact duplicate first
    if (modelNumber) {
      const exactDuplicate = await checkExactDuplicate(brand, modelNumber, categoryId);
      if (exactDuplicate.exists) {
        return NextResponse.json({
          error: 'exact_duplicate',
          message: 'A product with this exact brand and model already exists',
          existingProduct: {
            _id: exactDuplicate.masterProduct?._id,
            name: exactDuplicate.masterProduct?.name,
            slug: exactDuplicate.masterProduct?.slug,
          },
        }, { status: 409 });
      }
    }

    // Run duplicate detection
    const duplicateResult = await detectDuplicates(
      { name, brand, modelNumber, categoryId },
      { threshold: 50, maxResults: 5 }
    );

    // Check if vendor has a pending request for similar product
    const pendingRequest = await MasterProductRequest.findOne({
      vendorId: vendor._id,
      status: 'pending',
      $or: [
        { name: { $regex: new RegExp(`^${name}$`, 'i') } },
        modelNumber ? { modelNumber: { $regex: new RegExp(`^${modelNumber}$`, 'i') } } : {},
      ].filter(q => Object.keys(q).length > 0),
    });

    if (pendingRequest) {
      return NextResponse.json({
        error: 'pending_request',
        message: 'You already have a pending request for a similar product',
        existingRequest: {
          _id: pendingRequest._id,
          name: pendingRequest.name,
          status: pendingRequest.status,
          createdAt: pendingRequest.createdAt,
        },
      }, { status: 409 });
    }

    // Create the product request
    const productRequest = await MasterProductRequest.create({
      vendorId: vendor._id,
      name: name.trim(),
      brand: brand.trim(),
      modelNumber: modelNumber?.trim(),
      categoryId,
      description: description?.trim(),
      specifications: specifications || {},
      images: images || [],
      features: features || [],
      proposedPrice,
      proposedOriginalPrice,
      proposedStock: proposedStock || 0,
      proposedSku: proposedSku?.trim(),
      status: 'pending',
      possibleDuplicates: duplicateResult.candidates.map(c => ({
        masterProductId: c.masterProductId,
        matchScore: c.matchScore,
        matchReasons: c.matchReasons,
      })),
      highestDuplicateScore: duplicateResult.highestScore,
    });

    // Prepare response based on duplicate detection
    const response: Record<string, unknown> = {
      success: true,
      message: 'Product request submitted for review',
      request: {
        _id: productRequest._id,
        name: productRequest.name,
        status: productRequest.status,
        createdAt: productRequest.createdAt,
      },
    };

    // Warn if high duplicate score
    if (duplicateResult.highestScore >= 70) {
      response.warning = 'Similar products already exist. Your request may be merged with an existing product.';
      response.possibleMatches = duplicateResult.candidates.slice(0, 3).map(c => ({
        name: c.product.name,
        brand: c.product.brand,
        vendorCount: c.product.vendorCount,
        priceRange: `PKR ${c.product.minPrice.toLocaleString()} - ${c.product.maxPrice.toLocaleString()}`,
        matchScore: c.matchScore,
      }));
    }

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Create product request error:', error);
    return NextResponse.json(
      { error: 'Failed to submit product request' },
      { status: 500 }
    );
  }
}

// GET: Get vendor's product requests
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
    const status = searchParams.get('status'); // 'pending', 'approved', 'rejected', 'merged', or null for all
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const requests = await (MasterProductRequest as any).getVendorRequests(
      vendor._id,
      status || undefined
    );

    // Get stats
    const stats = await MasterProductRequest.aggregate([
      { $match: { vendorId: vendor._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const statusCounts = {
      pending: 0,
      approved: 0,
      rejected: 0,
      merged: 0,
    };

    for (const stat of stats) {
      if (stat._id in statusCounts) {
        statusCounts[stat._id as keyof typeof statusCounts] = stat.count;
      }
    }

    // Paginate
    const skip = (page - 1) * limit;
    const paginatedRequests = requests.slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      requests: paginatedRequests,
      stats: statusCounts,
      pagination: {
        page,
        limit,
        total: requests.length,
        pages: Math.ceil(requests.length / limit),
      },
    });
  } catch (error) {
    console.error('Get product requests error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product requests' },
      { status: 500 }
    );
  }
}

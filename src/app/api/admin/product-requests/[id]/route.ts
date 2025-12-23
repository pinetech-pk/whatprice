import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/connection';
import MasterProductRequest from '@/models/MasterProductRequest';
import MasterProduct from '@/models/MasterProduct';

async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return !!session;
}

// For now, use a placeholder admin ID
// In production, extract from session
async function getAdminId(): Promise<mongoose.Types.ObjectId> {
  // TODO: Get actual admin user ID from session
  return new mongoose.Types.ObjectId();
}

// GET: Get single product request details
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

    const productRequest = await MasterProductRequest.findById(id)
      .populate('vendorId', 'storeName slug email phone address')
      .populate('categoryId', 'name slug parentId')
      .populate('reviewedBy', 'firstName lastName email')
      .populate('createdMasterProductId', 'name slug vendorCount')
      .populate('mergedToMasterProductId', 'name slug vendorCount')
      .populate('possibleDuplicates.masterProductId', 'name brand slug vendorCount minPrice maxPrice images');

    if (!productRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      request: productRequest,
    });
  } catch (error) {
    console.error('Admin get product request error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product request' },
      { status: 500 }
    );
  }
}

// PUT: Take action on product request (approve, reject, merge)
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
    const { action, reason, notes, mergeToMasterProductId } = body;

    await connectDB();

    const productRequest = await MasterProductRequest.findById(id);
    if (!productRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (productRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Request has already been processed' },
        { status: 400 }
      );
    }

    const adminId = await getAdminId();

    switch (action) {
      case 'approve': {
        // Approve and create new MasterProduct + Listing
        const result = await productRequest.approve(adminId, notes);

        return NextResponse.json({
          success: true,
          message: 'Product request approved',
          masterProduct: {
            _id: result.masterProduct._id,
            name: (result.masterProduct as { name: string }).name,
            slug: (result.masterProduct as { slug: string }).slug,
          },
          listing: {
            _id: result.listing._id,
            slug: (result.listing as { slug: string }).slug,
          },
        });
      }

      case 'reject': {
        if (!reason) {
          return NextResponse.json(
            { error: 'Rejection reason is required' },
            { status: 400 }
          );
        }

        await productRequest.reject(adminId, reason);

        return NextResponse.json({
          success: true,
          message: 'Product request rejected',
        });
      }

      case 'merge': {
        if (!mergeToMasterProductId) {
          return NextResponse.json(
            { error: 'Target master product ID is required for merge' },
            { status: 400 }
          );
        }

        // Validate target MasterProduct exists
        const targetProduct = await MasterProduct.findById(mergeToMasterProductId);
        if (!targetProduct) {
          return NextResponse.json(
            { error: 'Target master product not found' },
            { status: 404 }
          );
        }

        const result = await productRequest.mergeToExisting(
          adminId,
          new mongoose.Types.ObjectId(mergeToMasterProductId),
          notes
        );

        return NextResponse.json({
          success: true,
          message: `Vendor listing linked to existing product: ${targetProduct.name}`,
          masterProduct: {
            _id: targetProduct._id,
            name: targetProduct.name,
            slug: targetProduct.slug,
          },
          listing: {
            _id: result.listing._id,
            slug: (result.listing as { slug: string }).slug,
          },
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: approve, reject, or merge' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Admin product request action error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process request' },
      { status: 500 }
    );
  }
}

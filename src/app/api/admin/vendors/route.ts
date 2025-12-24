import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db/connection';
import Vendor from '@/models/Vendor';
import User from '@/models/User';
import { getOrCreateVendorRole } from '@/lib/auth/vendorAuth';

async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return !!session;
}

// GET: List all vendors with filtering
export async function GET(request: Request) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status'); // pending, verified, rejected
    const search = searchParams.get('search');
    const tier = searchParams.get('tier'); // starter, growth, standard
    const city = searchParams.get('city');
    const showTrashed = searchParams.get('trashed') === 'true'; // Show only trashed vendors

    await connectDB();

    // Build query
    const query: Record<string, unknown> = {};

    // By default, exclude soft-deleted vendors unless explicitly requesting trashed
    if (showTrashed) {
      query.deletedAt = { $ne: null };
    } else {
      query.deletedAt = null;
    }

    if (status) {
      query.verificationStatus = status;
    }

    if (tier) {
      query.graduationTier = tier;
    }

    if (city) {
      query['address.city'] = { $regex: city, $options: 'i' };
    }

    if (search) {
      query.$or = [
        { storeName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [vendors, total] = await Promise.all([
      Vendor.find(query)
        .populate('userId', 'firstName lastName email')
        .sort(showTrashed ? { deletedAt: -1 } : { createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Vendor.countDocuments(query),
    ]);

    // Get stats (excluding trashed vendors)
    const stats = await Vendor.aggregate([
      {
        $match: { deletedAt: null },
      },
      {
        $group: {
          _id: '$verificationStatus',
          count: { $sum: 1 },
        },
      },
    ]);

    // Count trashed vendors separately
    const trashedCount = await Vendor.countDocuments({ deletedAt: { $ne: null } });

    const statusCounts = {
      pending: 0,
      verified: 0,
      rejected: 0,
      trashed: trashedCount,
    };

    for (const stat of stats) {
      if (stat._id in statusCounts) {
        statusCounts[stat._id as keyof typeof statusCounts] = stat.count;
      }
    }

    return NextResponse.json({
      success: true,
      vendors,
      stats: statusCounts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin get vendors error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendors' },
      { status: 500 }
    );
  }
}

// POST: Create a new vendor (admin only)
export async function POST(request: Request) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      'email',
      'password',
      'firstName',
      'lastName',
      'storeName',
      'phone',
      'street',
      'city',
      'state',
      'zipCode',
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    await connectDB();

    // Check if email already exists
    const existingUser = await User.findOne({ email: body.email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Generate slug from store name
    const storeSlug = body.storeName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if store name/slug already exists
    const existingVendor = await Vendor.findOne({ slug: storeSlug });
    if (existingVendor) {
      return NextResponse.json(
        { error: 'A store with this name already exists' },
        { status: 400 }
      );
    }

    // Get or create vendor role
    const vendorRoleId = await getOrCreateVendorRole();

    // Hash password
    const hashedPassword = await bcrypt.hash(body.password, 12);

    // Create user
    const user = await User.create({
      email: body.email.toLowerCase().trim(),
      password: hashedPassword,
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      phone: body.phone.replace(/[\s-]/g, ''),
      role: vendorRoleId,
      isActive: true,
      isEmailVerified: true, // Admin-created accounts are pre-verified
    });

    // Create vendor
    const vendor = await Vendor.create({
      userId: user._id,
      storeName: body.storeName.trim(),
      slug: storeSlug,
      email: body.email.toLowerCase().trim(),
      phone: body.phone.replace(/[\s-]/g, ''),
      whatsapp: body.whatsapp?.replace(/[\s-]/g, '') || body.phone.replace(/[\s-]/g, ''),
      website: body.website?.trim() || undefined,
      description: body.description?.trim() || undefined,
      address: {
        street: body.street.trim(),
        city: body.city.trim(),
        state: body.state.trim(),
        zipCode: body.zipCode.trim(),
        country: body.country || 'Pakistan',
      },
      verificationStatus: body.verificationStatus || 'verified', // Admin can set status
      verifiedAt: body.verificationStatus === 'verified' || !body.verificationStatus ? new Date() : undefined,
      viewCredits: body.viewCredits || 100, // Default 100 credits
      graduationTier: body.graduationTier || 'starter',
      tierStartDate: new Date(),
      isActive: true,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Vendor created successfully',
        vendor: {
          _id: vendor._id,
          storeName: vendor.storeName,
          slug: vendor.slug,
          email: vendor.email,
          verificationStatus: vendor.verificationStatus,
          viewCredits: vendor.viewCredits,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Admin create vendor error:', error);
    return NextResponse.json(
      { error: 'Failed to create vendor' },
      { status: 500 }
    );
  }
}

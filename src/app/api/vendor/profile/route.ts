import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
import User from '@/models/User';
import Vendor from '@/models/Vendor';
import {
  getVendorSession,
  createVendorSession,
  sanitizeInput,
  validatePhone,
} from '@/lib/auth/vendorAuth';

// GET: Fetch vendor profile
export async function GET() {
  try {
    const session = await getVendorSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    await connectDB();

    const vendor = await Vendor.findById(session.vendorId);
    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    const user = await User.findById(session.userId).select('-password');
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get CPV rate
    const cpvRate = vendor.getCpvRate();

    return NextResponse.json({
      success: true,
      vendor: {
        id: vendor._id,
        storeName: vendor.storeName,
        slug: vendor.slug,
        description: vendor.description,
        logo: vendor.logo,
        coverImage: vendor.coverImage,
        website: vendor.website,
        email: vendor.email,
        phone: vendor.phone,
        whatsapp: vendor.whatsapp,
        address: vendor.address,
        verificationStatus: vendor.verificationStatus,
        verifiedAt: vendor.verifiedAt,
        rejectionReason: vendor.rejectionReason,

        // Credits & Billing
        viewCredits: vendor.viewCredits,
        totalCreditsPurchased: vendor.totalCreditsPurchased,
        totalCreditsUsed: vendor.totalCreditsUsed,
        totalSpent: vendor.totalSpent,

        // Graduation Tier
        graduationTier: vendor.graduationTier,
        tierStartDate: vendor.tierStartDate,
        cpvRate,

        // Performance
        totalProducts: vendor.totalProducts,
        activeProducts: vendor.activeProducts,
        totalViews: vendor.totalViews,
        totalClicks: vendor.totalClicks,
        totalSales: vendor.totalSales,
        conversionRate: vendor.conversionRate,
        rating: vendor.rating,
        reviewCount: vendor.reviewCount,

        // CPV Settings
        defaultBidAmount: vendor.defaultBidAmount,
        maxDailyBudget: vendor.maxDailyBudget,
        currentDailySpend: vendor.currentDailySpend,

        isFeatured: vendor.isFeatured,
        createdAt: vendor.createdAt,
      },
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error('Get vendor profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PUT: Update vendor profile
export async function PUT(request: Request) {
  try {
    const session = await getVendorSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const body = await request.json();

    await connectDB();

    const vendor = await Vendor.findById(session.vendorId);
    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    const user = await User.findById(session.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update allowed vendor fields
    if (body.description !== undefined) {
      vendor.description = sanitizeInput(body.description);
    }
    if (body.logo !== undefined) {
      vendor.logo = body.logo;
    }
    if (body.coverImage !== undefined) {
      vendor.coverImage = body.coverImage;
    }
    if (body.website !== undefined) {
      vendor.website = body.website;
    }
    if (body.phone !== undefined) {
      const phone = body.phone.replace(/[\s-]/g, '');
      if (!validatePhone(phone)) {
        return NextResponse.json(
          { error: 'Invalid phone number format' },
          { status: 400 }
        );
      }
      vendor.phone = phone;
    }
    if (body.whatsapp !== undefined) {
      const whatsapp = body.whatsapp.replace(/[\s-]/g, '');
      if (!validatePhone(whatsapp)) {
        return NextResponse.json(
          { error: 'Invalid WhatsApp number format' },
          { status: 400 }
        );
      }
      vendor.whatsapp = whatsapp;
    }
    if (body.defaultBidAmount !== undefined) {
      const bid = Number(body.defaultBidAmount);
      if (bid < 10) {
        return NextResponse.json(
          { error: 'Minimum bid amount is PKR 10' },
          { status: 400 }
        );
      }
      vendor.defaultBidAmount = bid;
    }
    if (body.maxDailyBudget !== undefined) {
      vendor.maxDailyBudget = body.maxDailyBudget ? Number(body.maxDailyBudget) : undefined;
    }

    // Update address if provided
    if (body.address) {
      const addressFields = ['street', 'city', 'state', 'zipCode'];
      for (const field of addressFields) {
        if (body.address[field]) {
          vendor.address[field as keyof typeof vendor.address] = sanitizeInput(body.address[field]);
        }
      }
    }

    // Update allowed user fields
    if (body.firstName) {
      user.firstName = sanitizeInput(body.firstName);
    }
    if (body.lastName) {
      user.lastName = sanitizeInput(body.lastName);
    }
    if (body.avatar) {
      user.avatar = body.avatar;
    }

    await vendor.save();
    await user.save();

    // Update session if store name changed (shouldn't happen but handle it)
    if (body.storeName && body.storeName !== vendor.storeName) {
      await createVendorSession({
        userId: user._id.toString(),
        vendorId: vendor._id.toString(),
        email: user.email,
        storeName: vendor.storeName,
        verificationStatus: vendor.verificationStatus,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Update vendor profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

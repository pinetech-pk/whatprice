import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db/connection';
import User from '@/models/User';
import Vendor from '@/models/Vendor';
import {
  createVendorSession,
  validateEmail,
  checkRateLimit,
  recordAuthAttempt,
} from '@/lib/auth/vendorAuth';

interface LoginRequest {
  email: string;
  password: string;
}

export async function POST(request: Request) {
  try {
    // Get IP for rate limiting
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';

    // Check rate limit
    const rateLimit = checkRateLimit(`login:${ip}`);
    if (!rateLimit.allowed) {
      const minutes = Math.ceil((rateLimit.remainingTime || 0) / 60000);
      return NextResponse.json(
        { error: `Too many login attempts. Try again in ${minutes} minutes.` },
        { status: 429 }
      );
    }

    const body: LoginRequest = await request.json();

    // Validate required fields
    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!validateEmail(body.email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find user by email (include password field)
    const user = await User.findOne({ email: body.email.toLowerCase() }).select('+password');

    if (!user) {
      recordAuthAttempt(`login:${ip}`, false);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      recordAuthAttempt(`login:${ip}`, false);
      return NextResponse.json(
        { error: 'Your account has been deactivated. Please contact support.' },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(body.password, user.password);

    if (!isPasswordValid) {
      recordAuthAttempt(`login:${ip}`, false);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Find associated vendor
    const vendor = await Vendor.findOne({ userId: user._id });

    if (!vendor) {
      recordAuthAttempt(`login:${ip}`, false);
      return NextResponse.json(
        { error: 'No vendor account found. Please register as a vendor.' },
        { status: 404 }
      );
    }

    // Check if vendor is active
    if (!vendor.isActive) {
      recordAuthAttempt(`login:${ip}`, false);
      return NextResponse.json(
        { error: 'Your vendor account has been deactivated. Please contact support.' },
        { status: 403 }
      );
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Update vendor graduation tier if needed
    await vendor.updateGraduationTier();

    // Record successful login
    recordAuthAttempt(`login:${ip}`, true);

    // Create session
    await createVendorSession({
      userId: user._id.toString(),
      vendorId: vendor._id.toString(),
      email: user.email,
      storeName: vendor.storeName,
      verificationStatus: vendor.verificationStatus,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        vendor: {
          id: vendor._id,
          storeName: vendor.storeName,
          slug: vendor.slug,
          verificationStatus: vendor.verificationStatus,
          viewCredits: vendor.viewCredits,
          graduationTier: vendor.graduationTier,
          totalProducts: vendor.totalProducts,
          activeProducts: vendor.activeProducts,
        },
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Vendor login error:', error);
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}

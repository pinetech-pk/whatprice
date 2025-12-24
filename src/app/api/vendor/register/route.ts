import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db/connection';
import User from '@/models/User';
import Vendor from '@/models/Vendor';
import {
  createVendorSession,
  getOrCreateVendorRole,
  validateEmail,
  validatePassword,
  validatePhone,
  sanitizeInput,
  checkRateLimit,
  recordAuthAttempt,
} from '@/lib/auth/vendorAuth';

interface RegisterRequest {
  // User info
  email: string;
  password: string;
  firstName: string;
  lastName: string;

  // Vendor info
  storeName: string;
  phone: string;
  whatsapp?: string;
  website?: string;
  description?: string;

  // Address - simplified for registration
  city: string;
  address?: string;  // Optional street address
  street?: string;   // Alternative field name
  state?: string;    // Optional - will be derived from city
  zipCode?: string;  // Optional - will use default
}

// Map Pakistani cities to their provinces/states
const cityToState: Record<string, string> = {
  'karachi': 'Sindh',
  'lahore': 'Punjab',
  'islamabad': 'Islamabad Capital Territory',
  'rawalpindi': 'Punjab',
  'faisalabad': 'Punjab',
  'multan': 'Punjab',
  'peshawar': 'Khyber Pakhtunkhwa',
  'quetta': 'Balochistan',
  'sialkot': 'Punjab',
  'gujranwala': 'Punjab',
  'hyderabad': 'Sindh',
  'gujrat': 'Punjab',
  'bahawalpur': 'Punjab',
  'sargodha': 'Punjab',
  'sukkur': 'Sindh',
  'larkana': 'Sindh',
  'sheikhupura': 'Punjab',
  'mirpur khas': 'Sindh',
  'rahim yar khan': 'Punjab',
  'mardan': 'Khyber Pakhtunkhwa',
  'abbottabad': 'Khyber Pakhtunkhwa',
  'mingora': 'Khyber Pakhtunkhwa',
  'dera ghazi khan': 'Punjab',
  'nawabshah': 'Sindh',
};

export async function POST(request: Request) {
  try {
    // Get IP for rate limiting
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';

    // Check rate limit
    const rateLimit = checkRateLimit(`register:${ip}`);
    if (!rateLimit.allowed) {
      const minutes = Math.ceil((rateLimit.remainingTime || 0) / 60000);
      return NextResponse.json(
        { error: `Too many registration attempts. Try again in ${minutes} minutes.` },
        { status: 429 }
      );
    }

    const body: RegisterRequest = await request.json();

    // Validate required fields (simplified - only essential fields)
    const requiredFields = ['email', 'password', 'firstName', 'lastName', 'storeName', 'phone', 'city'];
    for (const field of requiredFields) {
      if (!body[field as keyof RegisterRequest]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Derive state from city if not provided
    const cityLower = body.city.toLowerCase().trim();
    const derivedState = body.state || cityToState[cityLower] || 'Punjab';

    // Use address or street, default to "Not provided"
    const streetAddress = body.street || body.address || 'Address pending';

    // Use provided zipCode or default
    const zipCode = body.zipCode || '00000';

    // Validate email
    if (!validateEmail(body.email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Validate password
    const passwordValidation = validatePassword(body.password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.message },
        { status: 400 }
      );
    }

    // Validate phone
    if (!validatePhone(body.phone)) {
      return NextResponse.json(
        { error: 'Please provide a valid Pakistani phone number' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if email already exists
    const existingUser = await User.findOne({ email: body.email.toLowerCase() });
    if (existingUser) {
      recordAuthAttempt(`register:${ip}`, false);
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Check if store name already exists
    const storeSlug = sanitizeInput(body.storeName)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const existingVendor = await Vendor.findOne({ slug: storeSlug });
    if (existingVendor) {
      recordAuthAttempt(`register:${ip}`, false);
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
      firstName: sanitizeInput(body.firstName),
      lastName: sanitizeInput(body.lastName),
      phone: body.phone.replace(/[\s-]/g, ''),
      role: vendorRoleId,
      isActive: true,
      isEmailVerified: false, // Will need email verification
    });

    // Create vendor
    const vendor = await Vendor.create({
      userId: user._id,
      storeName: sanitizeInput(body.storeName),
      slug: storeSlug,
      email: body.email.toLowerCase().trim(),
      phone: body.phone.replace(/[\s-]/g, ''),
      whatsapp: body.whatsapp?.replace(/[\s-]/g, '') || body.phone.replace(/[\s-]/g, ''),
      website: body.website?.trim(),
      description: body.description ? sanitizeInput(body.description) : undefined,
      address: {
        street: sanitizeInput(streetAddress),
        city: sanitizeInput(body.city),
        state: sanitizeInput(derivedState),
        zipCode: sanitizeInput(zipCode),
        country: 'Pakistan',
      },
      verificationStatus: 'pending',
      viewCredits: 100, // Give 100 free credits to start
      graduationTier: 'starter',
      tierStartDate: new Date(),
      isActive: true,
    });

    // Record successful registration
    recordAuthAttempt(`register:${ip}`, true);

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
        message: 'Registration successful! Your store is pending verification.',
        vendor: {
          id: vendor._id,
          storeName: vendor.storeName,
          slug: vendor.slug,
          verificationStatus: vendor.verificationStatus,
          viewCredits: vendor.viewCredits,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Vendor registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}

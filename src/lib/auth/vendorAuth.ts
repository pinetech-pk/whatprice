import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import connectDB from '@/lib/db/connection';
import User from '@/models/User';
import Vendor from '@/models/Vendor';
import Role from '@/models/Role';
import { DEFAULT_ROLES } from '@/models/Role';
import mongoose from 'mongoose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'whatprice-vendor-secret-key-change-in-production'
);

const COOKIE_NAME = 'vendor_session';
const TOKEN_EXPIRY = '7d';

export interface VendorSession {
  userId: string;
  vendorId: string;
  email: string;
  storeName: string;
  verificationStatus: string;
}

export async function createVendorSession(data: VendorSession): Promise<string> {
  const token = await new SignJWT({
    userId: data.userId,
    vendorId: data.vendorId,
    email: data.email,
    storeName: data.storeName,
    verificationStatus: data.verificationStatus,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });

  return token;
}

export async function getVendorSession(): Promise<VendorSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);

    return {
      userId: payload.userId as string,
      vendorId: payload.vendorId as string,
      email: payload.email as string,
      storeName: payload.storeName as string,
      verificationStatus: payload.verificationStatus as string,
    };
  } catch {
    return null;
  }
}

export async function clearVendorSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getOrCreateVendorRole(): Promise<mongoose.Types.ObjectId> {
  await connectDB();

  let vendorRole = await Role.findOne({ slug: DEFAULT_ROLES.VENDOR });

  if (!vendorRole) {
    vendorRole = await Role.create({
      name: 'Vendor',
      slug: DEFAULT_ROLES.VENDOR,
      description: 'Marketplace vendor with product management capabilities',
      permissions: [
        'vendor:dashboard',
        'vendor:products',
        'vendor:analytics',
        'vendor:billing',
        'vendor:settings',
        'product:create',
        'product:read',
        'product:update',
        'product:delete',
      ],
      isActive: true,
    });
  }

  return vendorRole._id;
}

export async function getVendorWithUser(vendorId: string) {
  await connectDB();

  const vendor = await Vendor.findById(vendorId);
  if (!vendor) {
    return null;
  }

  const user = await User.findById(vendor.userId).select('-password');
  if (!user) {
    return null;
  }

  return {
    vendor,
    user,
  };
}

// Rate limiting for vendor auth endpoints
const authAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_AUTH_ATTEMPTS = 5;
const AUTH_LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export function checkRateLimit(identifier: string): { allowed: boolean; remainingTime?: number } {
  const now = Date.now();
  const attempt = authAttempts.get(identifier);

  if (attempt) {
    // Check if lockout period has passed
    if (now - attempt.lastAttempt > AUTH_LOCKOUT_DURATION) {
      authAttempts.delete(identifier);
      return { allowed: true };
    }

    // Check if max attempts reached
    if (attempt.count >= MAX_AUTH_ATTEMPTS) {
      const remainingTime = AUTH_LOCKOUT_DURATION - (now - attempt.lastAttempt);
      return { allowed: false, remainingTime };
    }
  }

  return { allowed: true };
}

export function recordAuthAttempt(identifier: string, success: boolean): void {
  if (success) {
    authAttempts.delete(identifier);
    return;
  }

  const now = Date.now();
  const attempt = authAttempts.get(identifier);

  if (attempt) {
    attempt.count += 1;
    attempt.lastAttempt = now;
  } else {
    authAttempts.set(identifier, { count: 1, lastAttempt: now });
  }
}

// Input validation helpers
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true };
}

export function validatePhone(phone: string): boolean {
  // Pakistani phone format: +92XXXXXXXXXX or 03XXXXXXXXX
  const phoneRegex = /^(\+92|0)?[0-9]{10}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .slice(0, 1000); // Limit length
}

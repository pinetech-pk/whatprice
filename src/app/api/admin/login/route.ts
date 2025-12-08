// src/app/api/admin/login/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";

// Rate limiting store (in production, use Redis)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

function getRateLimitKey(request: Request): string {
  return request.headers.get("x-forwarded-for") || "unknown";
}

function isRateLimited(key: string): { limited: boolean; remainingTime?: number } {
  const record = loginAttempts.get(key);
  if (!record) return { limited: false };

  const timeSinceLastAttempt = Date.now() - record.lastAttempt;

  // Reset if lockout duration has passed
  if (timeSinceLastAttempt > LOCKOUT_DURATION) {
    loginAttempts.delete(key);
    return { limited: false };
  }

  if (record.count >= MAX_ATTEMPTS) {
    const remainingTime = Math.ceil((LOCKOUT_DURATION - timeSinceLastAttempt) / 1000 / 60);
    return { limited: true, remainingTime };
  }

  return { limited: false };
}

function recordFailedAttempt(key: string): void {
  const record = loginAttempts.get(key) || { count: 0, lastAttempt: 0 };
  record.count += 1;
  record.lastAttempt = Date.now();
  loginAttempts.set(key, record);
}

function clearAttempts(key: string): void {
  loginAttempts.delete(key);
}

// Use environment variables for credentials
// ADMIN_PASSWORD_HASH should be a bcrypt hash (generate with: npx bcryptjs hash "yourpassword")
// For backward compatibility, also support plain text password
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const ADMIN_PASSWORD_PLAIN = process.env.ADMIN_PASSWORD; // Fallback for migration

async function verifyPassword(inputPassword: string): Promise<boolean> {
  // If a hash is provided, use bcrypt comparison
  if (ADMIN_PASSWORD_HASH) {
    return bcrypt.compare(inputPassword, ADMIN_PASSWORD_HASH);
  }

  // Fallback to plain text comparison (deprecated - log warning)
  if (ADMIN_PASSWORD_PLAIN) {
    console.warn("WARNING: Using plain text password. Set ADMIN_PASSWORD_HASH for better security.");
    return inputPassword === ADMIN_PASSWORD_PLAIN;
  }

  return false;
}

export async function POST(request: Request) {
  try {
    const rateLimitKey = getRateLimitKey(request);

    // Check rate limiting
    const { limited, remainingTime } = isRateLimited(rateLimitKey);
    if (limited) {
      return NextResponse.json(
        { error: `Too many login attempts. Try again in ${remainingTime} minutes.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { username, password } = body;

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Check credentials
    const isValidUsername = username === ADMIN_USERNAME;
    const isValidPassword = await verifyPassword(password);

    if (isValidUsername && isValidPassword) {
      // Clear failed attempts on successful login
      clearAttempts(rateLimitKey);

      // Generate session token
      const token = crypto.randomBytes(32).toString("hex");

      // Set cookie with secure options
      const cookieStore = await cookies();
      cookieStore.set("admin_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict", // Changed to strict for better CSRF protection
        maxAge: 60 * 60 * 24, // 24 hours
        path: "/",
      });

      return NextResponse.json(
        { success: true, message: "Login successful" },
        { status: 200 }
      );
    }

    // Record failed attempt
    recordFailedAttempt(rateLimitKey);

    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}

// Utility endpoint to generate password hash (remove in production)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const password = searchParams.get("generate");

  if (password && process.env.NODE_ENV === "development") {
    const hash = await bcrypt.hash(password, 12);
    return NextResponse.json({
      hash,
      instruction: "Add this as ADMIN_PASSWORD_HASH in your environment variables"
    });
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

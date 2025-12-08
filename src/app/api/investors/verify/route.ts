// src/app/api/investors/verify/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

// Rate limiting store
const verifyAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 10;
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes

function getRateLimitKey(request: Request): string {
  return request.headers.get("x-forwarded-for") || "unknown";
}

function isRateLimited(key: string): { limited: boolean; remainingTime?: number } {
  const record = verifyAttempts.get(key);
  if (!record) return { limited: false };

  const timeSinceLastAttempt = Date.now() - record.lastAttempt;

  if (timeSinceLastAttempt > LOCKOUT_DURATION) {
    verifyAttempts.delete(key);
    return { limited: false };
  }

  if (record.count >= MAX_ATTEMPTS) {
    const remainingTime = Math.ceil((LOCKOUT_DURATION - timeSinceLastAttempt) / 1000 / 60);
    return { limited: true, remainingTime };
  }

  return { limited: false };
}

function recordFailedAttempt(key: string): void {
  const record = verifyAttempts.get(key) || { count: 0, lastAttempt: 0 };
  record.count += 1;
  record.lastAttempt = Date.now();
  verifyAttempts.set(key, record);
}

function clearAttempts(key: string): void {
  verifyAttempts.delete(key);
}

// Server-side only investor key (NOT exposed to client)
const INVESTOR_KEY = process.env.INVESTOR_KEY;

export async function POST(request: Request) {
  try {
    const rateLimitKey = getRateLimitKey(request);

    // Check rate limiting
    const { limited, remainingTime } = isRateLimited(rateLimitKey);
    if (limited) {
      return NextResponse.json(
        { error: `Too many attempts. Try again in ${remainingTime} minutes.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { accessKey } = body;

    if (!accessKey) {
      return NextResponse.json(
        { error: "Access key is required" },
        { status: 400 }
      );
    }

    // Verify the access key server-side
    if (!INVESTOR_KEY) {
      console.error("INVESTOR_KEY environment variable not set");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Use timing-safe comparison to prevent timing attacks
    const inputBuffer = Buffer.from(accessKey);
    const keyBuffer = Buffer.from(INVESTOR_KEY);

    const isValid = inputBuffer.length === keyBuffer.length &&
                    crypto.timingSafeEqual(inputBuffer, keyBuffer);

    if (isValid) {
      // Clear failed attempts on success
      clearAttempts(rateLimitKey);

      // Generate session token
      const token = crypto.randomBytes(32).toString("hex");

      // Set secure cookie
      const cookieStore = await cookies();
      cookieStore.set("investor_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });

      return NextResponse.json(
        { success: true, message: "Access granted" },
        { status: 200 }
      );
    }

    // Record failed attempt
    recordFailedAttempt(rateLimitKey);

    return NextResponse.json(
      { error: "Invalid access key" },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}

// src/app/api/submit-form/route.ts
import { NextResponse } from "next/server";
import { put, list } from "@vercel/blob";

interface FormSubmission {
  id: string;
  name: string;
  email: string;
  company: string;
  message: string;
  submittedAt: string;
  ipAddress?: string;
}

// Rate limiting store
const submissionAttempts = new Map<string, { count: number; firstAttempt: number }>();
const MAX_SUBMISSIONS_PER_HOUR = 5;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

function getRateLimitKey(request: Request): string {
  return request.headers.get("x-forwarded-for") || "unknown";
}

function isRateLimited(key: string): boolean {
  const record = submissionAttempts.get(key);
  if (!record) return false;

  const timeSinceFirst = Date.now() - record.firstAttempt;

  // Reset if window has passed
  if (timeSinceFirst > RATE_LIMIT_WINDOW) {
    submissionAttempts.delete(key);
    return false;
  }

  return record.count >= MAX_SUBMISSIONS_PER_HOUR;
}

function recordSubmission(key: string): void {
  const record = submissionAttempts.get(key);
  if (record) {
    record.count += 1;
  } else {
    submissionAttempts.set(key, { count: 1, firstAttempt: Date.now() });
  }
}

// Basic email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Sanitize input to prevent XSS
function sanitizeInput(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .trim();
}

export async function POST(request: Request) {
  try {
    const rateLimitKey = getRateLimitKey(request);

    // Check rate limiting
    if (isRateLimited(rateLimitKey)) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(body.email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    // Validate input lengths
    if (body.name.length > 100 || body.email.length > 100) {
      return NextResponse.json(
        { error: "Input too long" },
        { status: 400 }
      );
    }

    if (body.company && body.company.length > 200) {
      return NextResponse.json(
        { error: "Company name too long" },
        { status: 400 }
      );
    }

    if (body.message && body.message.length > 2000) {
      return NextResponse.json(
        { error: "Message too long (max 2000 characters)" },
        { status: 400 }
      );
    }

    // Try to get existing submissions
    let submissions: FormSubmission[] = [];
    try {
      const { blobs } = await list({
        prefix: "submissions",
      });

      // Find our submissions file
      const submissionsBlob = blobs.find((blob) =>
        blob.pathname.includes("submissions.json")
      );

      if (submissionsBlob) {
        // Fetch the content from the blob URL
        const response = await fetch(submissionsBlob.url);
        submissions = await response.json();
      }
    } catch {
      console.log("No existing submissions found, starting fresh");
    }

    // Create new submission with sanitized inputs
    const newSubmission: FormSubmission = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: sanitizeInput(body.name),
      email: sanitizeInput(body.email),
      company: body.company ? sanitizeInput(body.company) : "",
      message: body.message ? sanitizeInput(body.message) : "",
      submittedAt: new Date().toISOString(),
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    };

    // Add to submissions
    submissions.push(newSubmission);

    // Record this submission for rate limiting
    recordSubmission(rateLimitKey);

    // Save to Blob (this will overwrite the existing file)
    await put(
      "submissions.json",
      JSON.stringify(submissions, null, 2),
      {
        access: "public",
        contentType: "application/json",
        addRandomSuffix: false,
        allowOverwrite: true,
      }
    );

    return NextResponse.json(
      { success: true, message: "Form submitted successfully" },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to submit form" },
      { status: 500 }
    );
  }
}

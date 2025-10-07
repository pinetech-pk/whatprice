// src/app/api/submit-form/route.ts
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

interface FormSubmission {
  id: string;
  name: string;
  email: string;
  company: string;
  message: string;
  submittedAt: string;
  ipAddress?: string;
}

const DATA_FILE = path.join(process.cwd(), "data", "submissions.json");

async function ensureDataFile() {
  const dir = path.join(process.cwd(), "data");

  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }

  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2));
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Ensure data file exists
    await ensureDataFile();

    // Read existing submissions
    const fileContent = await fs.readFile(DATA_FILE, "utf-8");
    const submissions: FormSubmission[] = JSON.parse(fileContent);

    // Create new submission
    const newSubmission: FormSubmission = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: body.name,
      email: body.email,
      company: body.company || "",
      message: body.message || "",
      submittedAt: new Date().toISOString(),
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    };

    // Add to submissions
    submissions.push(newSubmission);

    // Write back to file
    await fs.writeFile(DATA_FILE, JSON.stringify(submissions, null, 2));

    return NextResponse.json(
      { success: true, message: "Form submitted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error submitting form:", error);
    return NextResponse.json(
      { error: "Failed to submit form" },
      { status: 500 }
    );
  }
}

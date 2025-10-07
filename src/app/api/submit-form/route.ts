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

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: "Name and email are required" },
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
    } catch (error) {
      console.log("No existing submissions found, starting fresh");
    }

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

    // Save to Blob (this will overwrite the existing file)
    const blob = await put(
      "submissions.json",
      JSON.stringify(submissions, null, 2),
      {
        access: "public",
        contentType: "application/json",
        addRandomSuffix: false,
        allowOverwrite: true, // Add this line
      }
    );

    console.log("Submission saved successfully:", blob.url);

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

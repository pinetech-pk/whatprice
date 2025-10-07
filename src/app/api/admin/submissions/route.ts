// src/app/api/admin/submissions/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { put, list } from "@vercel/blob";

interface Submission {
  id: string;
  name: string;
  email: string;
  company: string;
  message: string;
  submittedAt: string;
  ipAddress?: string;
}

async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return !!session;
}

// Helper function to get submissions
async function getSubmissions(): Promise<Submission[]> {
  try {
    const { blobs } = await list({
      prefix: "submissions",
    });

    const submissionsBlob = blobs.find((blob) =>
      blob.pathname.includes("submissions.json")
    );

    if (submissionsBlob) {
      const response = await fetch(submissionsBlob.url);
      return await response.json();
    }
  } catch (error) {
    console.log("No submissions found");
  }
  return [];
}

export async function GET() {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const submissions = await getSubmissions();

    return NextResponse.json({ submissions }, { status: 200 });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // Get current submissions
    let submissions = await getSubmissions();

    // Filter out the submission to delete
    submissions = submissions.filter((sub: Submission) => sub.id !== id);

    // Save updated submissions back to Blob
    await put("submissions.json", JSON.stringify(submissions, null, 2), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true, // Add this line
    });

    return NextResponse.json(
      { success: true, message: "Submission deleted" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting submission:", error);
    return NextResponse.json(
      { error: "Failed to delete submission" },
      { status: 500 }
    );
  }
}

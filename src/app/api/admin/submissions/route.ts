// src/app/api/admin/submissions/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import fs from "fs/promises";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "submissions.json");

// Simple auth check (in production, validate the session token properly)
async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return !!session;
}

export async function GET() {
  try {
    // Check authentication
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure file exists
    try {
      await fs.access(DATA_FILE);
    } catch {
      await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2));
    }

    // Read submissions
    const fileContent = await fs.readFile(DATA_FILE, "utf-8");
    const submissions = JSON.parse(fileContent);

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
    // Check authentication
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // Read submissions
    const fileContent = await fs.readFile(DATA_FILE, "utf-8");
    let submissions = JSON.parse(fileContent);

    // Filter out the submission to delete
    submissions = submissions.filter((sub: any) => sub.id !== id);

    // Write back to file
    await fs.writeFile(DATA_FILE, JSON.stringify(submissions, null, 2));

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

// src/app/api/admin/check-auth/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");

  return NextResponse.json({ authenticated: !!session });
}

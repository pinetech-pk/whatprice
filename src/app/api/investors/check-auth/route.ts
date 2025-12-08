// src/app/api/investors/check-auth/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("investor_session");

    return NextResponse.json({
      authenticated: !!session?.value,
    });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}

// This endpoint is no longer used; NextAuth handles magic link at /api/auth/[...nextauth].
import { NextResponse } from "next/server";
export async function POST() {
  return NextResponse.json(
    { success: false, error: "Use /api/auth/[...nextauth]" },
    { status: 400 },
  );
}


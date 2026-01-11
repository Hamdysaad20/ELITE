import { NextResponse } from "next/server";

export async function GET() {
  // Check critical environment variables
  const checks = {
    NEXTAUTH_SECRET:
      !!process.env.NEXTAUTH_SECRET &&
      process.env.NEXTAUTH_SECRET !== "placeholder-for-build",
    NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
    EMAIL_SERVER_HOST: !!process.env.EMAIL_SERVER_HOST,
    EMAIL_SERVER_USER: !!process.env.EMAIL_SERVER_USER,
    EMAIL_SERVER_PASSWORD: !!process.env.EMAIL_SERVER_PASSWORD,
    EMAIL_FROM: !!process.env.EMAIL_FROM,
    DATABASE_URL: !!process.env.DATABASE_URL,
  };

  const allPassing = Object.values(checks).every(Boolean);

  return NextResponse.json({
    status: allPassing ? "healthy" : "unhealthy",
    checks,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
}

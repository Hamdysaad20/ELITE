import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    env: {
      EMAIL_SERVER_HOST: process.env.EMAIL_SERVER_HOST
        ? "✅ Set"
        : "❌ Missing",
      EMAIL_SERVER_PORT: process.env.EMAIL_SERVER_PORT || "❌ Missing",
      EMAIL_SERVER_USER: process.env.EMAIL_SERVER_USER
        ? "✅ Set"
        : "❌ Missing",
      EMAIL_SERVER_PASSWORD: process.env.EMAIL_SERVER_PASSWORD
        ? "✅ Set"
        : "❌ Missing",
      EMAIL_FROM: process.env.EMAIL_FROM || "❌ Missing",
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "✅ Set" : "❌ Missing",
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || "❌ Missing",
    },
  });
}

/**
 * Points Transaction History API Endpoint
 * GET /api/user/points/history
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/server/auth/options";
import { getPointsTransactions } from "@/lib/analytics/points";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(getAuthOptions());
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);

    // Get transactions
    const transactions = await getPointsTransactions(userId, limit);

    return NextResponse.json({
      transactions,
      total: transactions.length,
      page,
    });
  } catch (error) {
    console.error("Error fetching points history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

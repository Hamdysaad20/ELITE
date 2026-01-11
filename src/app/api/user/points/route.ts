/**
 * User Points API Endpoint
 * GET /api/user/points
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/server/auth/options";
import { getUserPoints, getPointsTransactions } from "@/lib/analytics/points";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(getAuthOptions());
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user points data
    const points = await getUserPoints(userId);

    // Get recent transactions
    const recentTransactions = await getPointsTransactions(userId, 10);

    return NextResponse.json({
      currentBalance: points.totalPoints,
      totalEarned: points.totalEarned,
      totalRedeemed: points.totalRedeemed,
      tier: points.tier,
      nextTierAt: points.nextTierAt,
      pointsToNextTier: points.pointsToNextTier,
      recentTransactions,
    });
  } catch (error) {
    console.error("Error fetching user points:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

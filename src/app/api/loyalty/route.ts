import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { prisma } from "@/server/db/client";
import { jsonResponse, successResponse, errorResponse } from "@/server/utils/apiHelpers";

/**
 * GET /api/loyalty - Get user's loyalty information
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const loyalty = await prisma.loyaltyAccount.findUnique({
      where: { userId: user.id },
    });

    // Get recent activity (last 20 transactions)
    const recentActivity = await prisma.loyaltyLedger.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        order: {
          select: {
            id: true,
            total: true,
            createdAt: true,
          },
        },
      },
    });

    // Calculate next tier info
    const tiers = [
      { level: "bronze", minPoints: 0, benefits: ["Earn 1 point per 10 EGP", "Birthday reward"] },
      { level: "silver", minPoints: 100, benefits: ["Earn 1.5 points per 10 EGP", "Free delivery", "Birthday reward"] },
      { level: "gold", minPoints: 500, benefits: ["Earn 2 points per 10 EGP", "Free delivery", "Priority support", "Exclusive offers"] },
      { level: "platinum", minPoints: 1000, benefits: ["Earn 3 points per 10 EGP", "Free delivery", "Priority support", "Exclusive offers", "VIP events"] },
    ];

    const currentLevel = loyalty?.level || "bronze";
    const currentPoints = loyalty?.points || 0;
    const currentTierIndex = tiers.findIndex(t => t.level === currentLevel);
    const nextTier = currentTierIndex < tiers.length - 1 ? tiers[currentTierIndex + 1] : null;

    return jsonResponse(
      successResponse({
        account: {
          points: loyalty?.points || 0,
          totalSpent: loyalty?.totalSpent || 0,
          level: currentLevel,
          updatedAt: loyalty?.updatedAt || new Date(),
        },
        recentActivity: recentActivity.map(item => ({
          id: item.id,
          deltaPoints: item.deltaPoints,
          reason: item.reason,
          orderId: item.orderId,
          orderTotal: item.order?.total,
          createdAt: item.createdAt,
        })),
        tiers: {
          current: tiers[currentTierIndex],
          next: nextTier,
          all: tiers,
          progress: nextTier
            ? Math.min(100, ((currentPoints - tiers[currentTierIndex].minPoints) / (nextTier.minPoints - tiers[currentTierIndex].minPoints)) * 100)
            : 100,
        },
      }),
    );
  } catch (error: any) {
    console.error("Loyalty fetch error:", error);
    const message = error?.message || "Failed to fetch loyalty information";
    return jsonResponse(errorResponse(message), error?.message === "Authentication required" ? 401 : 500);
  }
}



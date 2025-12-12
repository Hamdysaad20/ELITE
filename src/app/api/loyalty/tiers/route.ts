import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { prisma } from "@/server/db/client";
import { jsonResponse, successResponse, errorResponse } from "@/server/utils/apiHelpers";
import {
  ELITE_TIERS,
  TIER_ORDER,
  getNextTier,
  calculateTierProgress,
  checkAndUpdateTier,
} from "@/server/services/eliteLoyalty";

/**
 * GET /api/loyalty/tiers - Get user's tier status and progress
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const loyalty = await prisma.loyaltyAccount.findUnique({
      where: { userId: user.id },
    });

    if (!loyalty) {
      return jsonResponse(
        successResponse({
          current: ELITE_TIERS.starter,
          next: ELITE_TIERS.black,
          progress: { overallProgress: 0 },
          allTiers: TIER_ORDER.map((id) => ELITE_TIERS[id]),
          monthlyProgress: null,
        }),
      );
    }

    const monthlyProgress = await prisma.monthlyTierProgress.findUnique({
      where: { userId: user.id },
    });

    const currentTier = ELITE_TIERS[loyalty.tier];
    const nextTier = getNextTier(loyalty.tier);

    const progress = monthlyProgress
      ? calculateTierProgress(loyalty.tier, {
          coinsEarned: monthlyProgress.coinsEarned,
          purchaseCount: monthlyProgress.purchaseCount,
          challengesComplete: monthlyProgress.challengesComplete,
          eliteChallengesComplete: monthlyProgress.eliteChallengesComplete,
          maxStreakDays: monthlyProgress.maxStreakDays,
        })
      : {
          coinsProgress: 0,
          purchasesProgress: 0,
          challengesProgress: 0,
          streakProgress: 0,
          overallProgress: 0,
        };

    const visibleTiers = TIER_ORDER.slice(0, TIER_ORDER.indexOf(loyalty.tier) + 3).map(
      (id) => ELITE_TIERS[id],
    );

    return jsonResponse(
      successResponse({
        current: currentTier,
        next: nextTier,
        progress,
        visibleTiers,
        allTiers: TIER_ORDER.map((id) => ELITE_TIERS[id]),
        monthlyProgress: monthlyProgress
          ? {
              coinsEarned: monthlyProgress.coinsEarned,
              purchaseCount: monthlyProgress.purchaseCount,
              challengesComplete: monthlyProgress.challengesComplete,
              eliteChallengesComplete: monthlyProgress.eliteChallengesComplete,
              maxStreakDays: monthlyProgress.maxStreakDays,
              currentStreakDays: monthlyProgress.currentStreakDays,
              meetsRequirements: monthlyProgress.meetsRequirements,
            }
          : null,
      }),
    );
  } catch (error) {
    console.error("Tiers fetch error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch tier information";
    const isAuthError = error instanceof Error && error.message === "Authentication required";
    return jsonResponse(errorResponse(message), isAuthError ? 401 : 500);
  }
}

/**
 * POST /api/loyalty/tiers/check - Manually trigger tier check (admin or cron)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const newTier = await checkAndUpdateTier(user.id);

    return jsonResponse(
      successResponse({
        tier: newTier,
        tierConfig: ELITE_TIERS[newTier],
        message: `Tier updated to ${ELITE_TIERS[newTier].name}`,
      }),
    );
  } catch (error) {
    console.error("Tier check error:", error);
    const message = error instanceof Error ? error.message : "Failed to check tier";
    const isAuthError = error instanceof Error && error.message === "Authentication required";
    return jsonResponse(errorResponse(message), isAuthError ? 401 : 500);
  }
}

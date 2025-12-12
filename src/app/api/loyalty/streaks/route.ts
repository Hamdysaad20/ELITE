import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { prisma } from "@/server/db/client";
import { jsonResponse, successResponse, errorResponse } from "@/server/utils/apiHelpers";
import { STREAK_REWARDS } from "@/server/services/eliteLoyalty";

/**
 * GET /api/loyalty/streaks - Get user's streak status
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    let streak = await prisma.userStreak.findUnique({
      where: { userId: user.id },
    });

    if (!streak) {
      streak = await prisma.userStreak.create({
        data: {
          userId: user.id,
          currentDaily: 0,
          longestDaily: 0,
          weeklyCount: 0,
          monthlyCount: 0,
          totalDaysActive: 0,
        },
      });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastActivity = streak.lastActivityDate
      ? new Date(
          streak.lastActivityDate.getFullYear(),
          streak.lastActivityDate.getMonth(),
          streak.lastActivityDate.getDate(),
        )
      : null;

    const daysSinceActivity = lastActivity
      ? Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const isActive = daysSinceActivity !== null && daysSinceActivity <= 1;

    const nextDailyMilestone = STREAK_REWARDS.daily.find((m) => m.days > streak.currentDaily);

    const claimedMilestones = STREAK_REWARDS.daily.filter(
      (m) => m.days <= streak.longestDaily,
    );

    return jsonResponse(
      successResponse({
        current: {
          daily: streak.currentDaily,
          weekly: streak.weeklyCount,
          monthly: streak.monthlyCount,
        },
        longest: {
          daily: streak.longestDaily,
          totalDaysActive: streak.totalDaysActive,
        },
        status: {
          isActive,
          daysSinceLastActivity: daysSinceActivity,
          lastActivityDate: streak.lastActivityDate,
        },
        nextMilestone: nextDailyMilestone
          ? {
              days: nextDailyMilestone.days,
              coins: nextDailyMilestone.coins,
              label: nextDailyMilestone.label,
              daysRemaining: nextDailyMilestone.days - streak.currentDaily,
            }
          : null,
        milestones: {
          daily: STREAK_REWARDS.daily,
          weekly: STREAK_REWARDS.weekly.orders,
          monthly: STREAK_REWARDS.monthly.orders,
        },
        claimed: claimedMilestones,
      }),
    );
  } catch (error) {
    console.error("Streaks fetch error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch streak information";
    const isAuthError = error instanceof Error && error.message === "Authentication required";
    return jsonResponse(errorResponse(message), isAuthError ? 401 : 500);
  }
}

/**
 * GET /api/gamification/achievements
 * Get user's achievements and progress
 */

import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { getUserAchievements } from "@/server/services/gamification/achievementService";
import { jsonResponse, successResponse, errorResponse } from "@/server/utils/apiHelpers";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const achievements = await getUserAchievements(user.id);

    return jsonResponse(
      successResponse({
        achievements,
        total: achievements.length,
        completed: achievements.filter((a: { isCompleted: boolean }) => a.isCompleted).length,
      })
    );
  } catch (error) {
    console.error("Error fetching achievements:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch achievements";
    const isAuthError = error instanceof Error && error.message === "Authentication required";
    return jsonResponse(errorResponse(message), isAuthError ? 401 : 500);
  }
}


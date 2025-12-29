/**
 * GET /api/gamification/streaks
 * Get user's streaks
 */

import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { getUserStreaks } from "@/server/services/gamification/streakService";
import { jsonResponse, successResponse, errorResponse } from "@/server/utils/apiHelpers";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const streaks = await getUserStreaks(user.id);

    return jsonResponse(
      successResponse({
        streaks,
        total: streaks.length,
        activeStreaks: streaks.filter((s) => s.currentStreak > 0).length,
      })
    );
  } catch (error) {
    console.error("Error fetching streaks:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch streaks";
    const isAuthError = error instanceof Error && error.message === "Authentication required";
    return jsonResponse(errorResponse(message), isAuthError ? 401 : 500);
  }
}


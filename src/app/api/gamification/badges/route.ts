/**
 * GET /api/gamification/badges
 * Get user's unlocked badges
 */

import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { getUserBadges } from "@/server/services/gamification/badgeService";
import {
  jsonResponse,
  successResponse,
  errorResponse,
} from "@/server/utils/apiHelpers";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const badges = await getUserBadges(user.id);

    return jsonResponse(
      successResponse({
        badges,
        total: badges.length,
      }),
    );
  } catch (error) {
    console.error("Error fetching badges:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch badges";
    const isAuthError =
      error instanceof Error && error.message === "Authentication required";
    return jsonResponse(errorResponse(message), isAuthError ? 401 : 500);
  }
}

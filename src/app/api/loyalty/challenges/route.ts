import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { jsonResponse, successResponse, errorResponse } from "@/server/utils/apiHelpers";
import { getActiveChallenges } from "@/server/services/challengeService";

/**
 * GET /api/loyalty/challenges - Get active challenges for user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const challenges = await getActiveChallenges(user.id);

    const normalChallenges = challenges.filter((c) => c.tier === "normal");
    const eliteChallenges = challenges.filter((c) => c.tier === "elite");

    return jsonResponse(
      successResponse({
        normal: normalChallenges.map((c) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          type: c.type,
          coinsReward: c.coinsReward,
          avatarUnlock: c.avatarUnlock,
          imageUrl: c.imageUrl,
          progress: c.userProgress,
          completedAt: c.completedAt,
          isCompleted: c.isCompleted,
          startDate: c.startDate,
          endDate: c.endDate,
        })),
        elite: eliteChallenges.map((c) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          type: c.type,
          coinsReward: c.coinsReward,
          avatarUnlock: c.avatarUnlock,
          imageUrl: c.imageUrl,
          progress: c.userProgress,
          completedAt: c.completedAt,
          isCompleted: c.isCompleted,
          startDate: c.startDate,
          endDate: c.endDate,
        })),
        totalActive: challenges.length,
        completedCount: challenges.filter((c) => c.isCompleted).length,
      }),
    );
  } catch (error) {
    console.error("Challenges fetch error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch challenges";
    const isAuthError = error instanceof Error && error.message === "Authentication required";
    return jsonResponse(errorResponse(message), isAuthError ? 401 : 500);
  }
}

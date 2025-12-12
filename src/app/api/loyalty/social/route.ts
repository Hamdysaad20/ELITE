import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { jsonResponse, successResponse, errorResponse } from "@/server/utils/apiHelpers";
import { awardSocialCoins, SOCIAL_REWARDS } from "@/server/services/eliteLoyalty";
import { trackSocialChallenge } from "@/server/services/challengeService";

/**
 * POST /api/loyalty/social - Award coins for social actions
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const { actionType, targetId, metadata } = body;

    if (!actionType) {
      return jsonResponse(errorResponse("Missing actionType"), 400);
    }

    const validActions = ["review", "rating", "share", "referral"];
    if (!validActions.includes(actionType)) {
      return jsonResponse(
        errorResponse(`Invalid actionType. Must be one of: ${validActions.join(", ")}`),
        400,
      );
    }

    const success = await awardSocialCoins(
      user.id,
      actionType as "review" | "rating" | "share" | "referral",
      targetId,
      metadata,
    );

    if (!success) {
      return jsonResponse(errorResponse("Social action already rewarded or failed"), 400);
    }

    if (actionType === "review" || actionType === "rating" || actionType === "share") {
      await trackSocialChallenge(user.id, actionType);
    }

    const coinsAwarded = SOCIAL_REWARDS[actionType as keyof typeof SOCIAL_REWARDS] || 0;

    return jsonResponse(
      successResponse({
        coinsAwarded,
        message: `Earned ${coinsAwarded} coins for ${actionType}`,
      }),
    );
  } catch (error) {
    console.error("Social action error:", error);
    const message = error instanceof Error ? error.message : "Failed to process social action";
    return jsonResponse(errorResponse(message), 500);
  }
}

/**
 * GET /api/loyalty/social - Get social rewards info
 */
export async function GET() {
  try {
    return jsonResponse(
      successResponse({
        rewards: SOCIAL_REWARDS,
        actions: [
          {
            type: "review",
            coins: SOCIAL_REWARDS.review,
            description: "Write a detailed product review",
          },
          {
            type: "rating",
            coins: SOCIAL_REWARDS.rating,
            description: "Rate a product (1-5 stars)",
          },
          {
            type: "share",
            coins: SOCIAL_REWARDS.share,
            description: "Share a product or order",
          },
          {
            type: "referral",
            coins: SOCIAL_REWARDS.referral,
            description: "Refer a friend who completes their first order",
          },
        ],
      }),
    );
  } catch (error) {
    console.error("Social info fetch error:", error);
    return jsonResponse(errorResponse("Failed to fetch social rewards info"), 500);
  }
}

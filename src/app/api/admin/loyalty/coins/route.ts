import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { jsonResponse, successResponse, errorResponse } from "@/server/utils/apiHelpers";
import { addBonusCoins } from "@/server/services/eliteLoyalty";

/**
 * POST /api/admin/loyalty/coins - Award bonus coins to users (admin)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== "admin") {
      return jsonResponse(errorResponse("Admin access required"), 403);
    }

    const body = await request.json();
    const { userId, coins, reason } = body;

    if (!userId || !coins || !reason) {
      return jsonResponse(errorResponse("Missing required fields: userId, coins, reason"), 400);
    }

    if (typeof coins !== "number" || coins <= 0) {
      return jsonResponse(errorResponse("Coins must be a positive number"), 400);
    }

    const success = await addBonusCoins(userId, coins, reason, {
      adminId: user.id,
      adminEmail: user.email,
    });

    if (!success) {
      return jsonResponse(errorResponse("Failed to award coins"), 500);
    }

    return jsonResponse(
      successResponse(
        {
          userId,
          coinsAwarded: coins,
          reason,
        },
        "Coins awarded successfully",
      ),
    );
  } catch (error) {
    console.error("Admin coins award error:", error);
    const message = error instanceof Error ? error.message : "Failed to award coins";
    return jsonResponse(errorResponse(message), 500);
  }
}

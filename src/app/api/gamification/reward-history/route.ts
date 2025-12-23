/**
 * GET /api/gamification/reward-history
 * Get user's reward history
 */

import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { prisma } from "@/server/db/client";
import { jsonResponse, successResponse, errorResponse } from "@/server/utils/apiHelpers";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);

    const rewardEvents = await prisma.rewardEvent.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 100),
    });

    return jsonResponse(
      successResponse({
        events: rewardEvents.map((event: {
          id: string;
          triggerType: string;
          triggerId: string | null;
          rewards: unknown;
          status: string;
          createdAt: Date;
          processedAt: Date | null;
        }) => ({
          id: event.id,
          triggerType: event.triggerType,
          triggerId: event.triggerId,
          rewards: event.rewards,
          status: event.status,
          createdAt: event.createdAt,
          processedAt: event.processedAt,
        })),
        total: rewardEvents.length,
      })
    );
  } catch (error) {
    console.error("Error fetching reward history:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch reward history";
    const isAuthError = error instanceof Error && error.message === "Authentication required";
    return jsonResponse(errorResponse(message), isAuthError ? 401 : 500);
  }
}


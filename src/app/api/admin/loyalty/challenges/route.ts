import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { prisma } from "@/server/db/client";
import { jsonResponse, successResponse, errorResponse } from "@/server/utils/apiHelpers";

/**
 * GET /api/admin/loyalty/challenges - Get all challenges (admin)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== "admin") {
      return jsonResponse(errorResponse("Admin access required"), 403);
    }

    const challenges = await prisma.challenge.findMany({
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      include: {
        _count: {
          select: { completions: true },
        },
      },
    });

    return jsonResponse(
      successResponse({
        challenges: challenges.map((c) => ({
          ...c,
          completionsCount: c._count.completions,
        })),
      }),
    );
  } catch (error) {
    console.error("Admin challenges fetch error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch challenges";
    const isAuthError = error instanceof Error && error.message === "Authentication required";
    return jsonResponse(errorResponse(message), isAuthError ? 401 : 500);
  }
}

/**
 * POST /api/admin/loyalty/challenges - Create a new challenge (admin)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== "admin") {
      return jsonResponse(errorResponse("Admin access required"), 403);
    }

    const body = await request.json();
    const {
      title,
      description,
      type,
      tier,
      requirement,
      coinsReward,
      avatarUnlock,
      startDate,
      endDate,
      isRecurring,
      recurringPeriod,
      priority,
      imageUrl,
    } = body;

    if (!title || !description || !type || !requirement || !coinsReward) {
      return jsonResponse(
        errorResponse("Missing required fields: title, description, type, requirement, coinsReward"),
        400,
      );
    }

    const challenge = await prisma.challenge.create({
      data: {
        title,
        description,
        type,
        tier: tier || "normal",
        requirement,
        coinsReward,
        avatarUnlock: avatarUnlock || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isRecurring: isRecurring || false,
        recurringPeriod: recurringPeriod || null,
        priority: priority || 0,
        imageUrl: imageUrl || null,
        isActive: true,
      },
    });

    return jsonResponse(successResponse({ challenge }, "Challenge created successfully"));
  } catch (error) {
    console.error("Challenge creation error:", error);
    const message = error instanceof Error ? error.message : "Failed to create challenge";
    return jsonResponse(errorResponse(message), 500);
  }
}

import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { prisma } from "@/server/db/client";
import { jsonResponse, successResponse, errorResponse } from "@/server/utils/apiHelpers";

/**
 * GET /api/admin/loyalty/rewards - Get all reward items (admin)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== "admin") {
      return jsonResponse(errorResponse("Admin access required"), 403);
    }

    const items = await prisma.rewardItem.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        _count: {
          select: { redemptions: true },
        },
      },
    });

    return jsonResponse(
      successResponse({
        items: items.map((item) => ({
          ...item,
          redemptionsCount: item._count.redemptions,
        })),
      }),
    );
  } catch (error) {
    console.error("Admin rewards fetch error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch reward items";
    const isAuthError = error instanceof Error && error.message === "Authentication required";
    return jsonResponse(errorResponse(message), isAuthError ? 401 : 500);
  }
}

/**
 * POST /api/admin/loyalty/rewards - Create a new reward item (admin)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== "admin") {
      return jsonResponse(errorResponse("Admin access required"), 403);
    }

    const body = await request.json();
    const {
      name,
      description,
      type,
      coinsCost,
      egpValue,
      imageUrl,
      stockQty,
      maxPerUser,
      category,
      metadata,
      sortOrder,
    } = body;

    if (!name || !description || !type || !coinsCost) {
      return jsonResponse(
        errorResponse("Missing required fields: name, description, type, coinsCost"),
        400,
      );
    }

    const item = await prisma.rewardItem.create({
      data: {
        name,
        description,
        type,
        coinsCost,
        egpValue: egpValue || null,
        imageUrl: imageUrl || null,
        stockQty: stockQty || null,
        maxPerUser: maxPerUser || null,
        category: category || null,
        metadata: metadata || null,
        sortOrder: sortOrder || 0,
        isActive: true,
      },
    });

    return jsonResponse(successResponse({ item }, "Reward item created successfully"));
  } catch (error) {
    console.error("Reward item creation error:", error);
    const message = error instanceof Error ? error.message : "Failed to create reward item";
    return jsonResponse(errorResponse(message), 500);
  }
}

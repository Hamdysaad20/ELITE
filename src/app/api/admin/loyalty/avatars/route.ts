import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { prisma } from "@/server/db/client";
import { jsonResponse, successResponse, errorResponse } from "@/server/utils/apiHelpers";

/**
 * GET /api/admin/loyalty/avatars - Get all avatars (admin)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== "admin") {
      return jsonResponse(errorResponse("Admin access required"), 403);
    }

    const avatars = await prisma.avatar.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        _count: {
          select: { unlockedBy: true },
        },
      },
    });

    return jsonResponse(
      successResponse({
        avatars: avatars.map((avatar) => ({
          ...avatar,
          unlockedCount: avatar._count.unlockedBy,
        })),
      }),
    );
  } catch (error) {
    console.error("Admin avatars fetch error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch avatars";
    const isAuthError = error instanceof Error && error.message === "Authentication required";
    return jsonResponse(errorResponse(message), isAuthError ? 401 : 500);
  }
}

/**
 * POST /api/admin/loyalty/avatars - Create a new avatar (admin)
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
      imageUrl,
      thumbnailUrl,
      rarity,
      unlockType,
      unlockValue,
      description,
      isLimited,
      availableFrom,
      availableUntil,
      sortOrder,
    } = body;

    if (!name || !imageUrl || !unlockType) {
      return jsonResponse(
        errorResponse("Missing required fields: name, imageUrl, unlockType"),
        400,
      );
    }

    const avatar = await prisma.avatar.create({
      data: {
        name,
        imageUrl,
        thumbnailUrl: thumbnailUrl || null,
        rarity: rarity || "common",
        unlockType,
        unlockValue: unlockValue || null,
        description: description || null,
        isLimited: isLimited || false,
        availableFrom: availableFrom ? new Date(availableFrom) : null,
        availableUntil: availableUntil ? new Date(availableUntil) : null,
        sortOrder: sortOrder || 0,
        isActive: true,
      },
    });

    return jsonResponse(successResponse({ avatar }, "Avatar created successfully"));
  } catch (error) {
    console.error("Avatar creation error:", error);
    const message = error instanceof Error ? error.message : "Failed to create avatar";
    return jsonResponse(errorResponse(message), 500);
  }
}

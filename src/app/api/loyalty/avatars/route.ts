import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { prisma } from "@/server/db/client";
import { jsonResponse, successResponse, errorResponse } from "@/server/utils/apiHelpers";

/**
 * GET /api/loyalty/avatars - Get available and unlocked avatars
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const avatars = await prisma.avatar.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    const unlockedAvatars = await prisma.userAvatar.findMany({
      where: { userId: user.id },
      include: {
        avatar: true,
      },
    });

    const unlockedIds = new Set(unlockedAvatars.map((ua) => ua.avatarId));
    const equippedAvatar = unlockedAvatars.find((ua) => ua.isEquipped);

    const loyalty = await prisma.loyaltyAccount.findUnique({
      where: { userId: user.id },
    });

    const userTier = loyalty?.tier || "starter";

    const categorized = {
      unlocked: avatars.filter((a) => unlockedIds.has(a.id)),
      locked: avatars.filter((a) => !unlockedIds.has(a.id)),
      byRarity: {
        common: avatars.filter((a) => a.rarity === "common"),
        rare: avatars.filter((a) => a.rarity === "rare"),
        epic: avatars.filter((a) => a.rarity === "epic"),
        legendary: avatars.filter((a) => a.rarity === "legendary"),
      },
    };

    return jsonResponse(
      successResponse({
        equipped: equippedAvatar
          ? {
              id: equippedAvatar.avatar.id,
              name: equippedAvatar.avatar.name,
              imageUrl: equippedAvatar.avatar.imageUrl,
              thumbnailUrl: equippedAvatar.avatar.thumbnailUrl,
              rarity: equippedAvatar.avatar.rarity,
            }
          : null,
        avatars: categorized,
        stats: {
          total: avatars.length,
          unlocked: unlockedIds.size,
          remaining: avatars.length - unlockedIds.size,
        },
        userTier,
      }),
    );
  } catch (error) {
    console.error("Avatars fetch error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch avatars";
    const isAuthError = error instanceof Error && error.message === "Authentication required";
    return jsonResponse(errorResponse(message), isAuthError ? 401 : 500);
  }
}

/**
 * POST /api/loyalty/avatars - Equip or unlock an avatar
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const { avatarId, action } = body;

    if (!avatarId || !action) {
      return jsonResponse(errorResponse("Missing avatarId or action"), 400);
    }

    if (action === "equip") {
      const userAvatar = await prisma.userAvatar.findUnique({
        where: {
          userId_avatarId: {
            userId: user.id,
            avatarId,
          },
        },
      });

      if (!userAvatar) {
        return jsonResponse(errorResponse("Avatar not unlocked"), 403);
      }

      await prisma.userAvatar.updateMany({
        where: { userId: user.id },
        data: { isEquipped: false },
      });

      await prisma.userAvatar.update({
        where: {
          userId_avatarId: {
            userId: user.id,
            avatarId,
          },
        },
        data: { isEquipped: true },
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { currentAvatarId: avatarId },
      });

      return jsonResponse(successResponse({ message: "Avatar equipped successfully" }));
    }

    if (action === "unlock") {
      const avatar = await prisma.avatar.findUnique({
        where: { id: avatarId },
      });

      if (!avatar) {
        return jsonResponse(errorResponse("Avatar not found"), 404);
      }

      if (avatar.unlockType === "coins") {
        const coinsCost = Number.parseInt(avatar.unlockValue || "0", 10);

        const loyalty = await prisma.loyaltyAccount.findUnique({
          where: { userId: user.id },
        });

        if (!loyalty || loyalty.coins < coinsCost) {
          return jsonResponse(errorResponse("Insufficient coins"), 403);
        }

        await prisma.loyaltyLedger.create({
          data: {
            userId: user.id,
            deltaCoins: -coinsCost,
            reason: `Unlocked avatar: ${avatar.name}`,
            source: "redemption",
            metadata: { avatarId, type: "avatar" },
          },
        });

        await prisma.loyaltyAccount.update({
          where: { userId: user.id },
          data: {
            coins: { decrement: coinsCost },
          },
        });
      }

      await prisma.userAvatar.create({
        data: {
          userId: user.id,
          avatarId,
          unlockedAt: new Date(),
        },
      });

      return jsonResponse(successResponse({ message: "Avatar unlocked successfully" }));
    }

    return jsonResponse(errorResponse("Invalid action"), 400);
  } catch (error) {
    console.error("Avatar action error:", error);
    const message = error instanceof Error ? error.message : "Failed to process avatar action";
    return jsonResponse(errorResponse(message), 500);
  }
}

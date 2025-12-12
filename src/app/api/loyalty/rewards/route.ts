import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { prisma } from "@/server/db/client";
import { jsonResponse, successResponse, errorResponse } from "@/server/utils/apiHelpers";
import { redeemCoins, COINS_PER_EGP } from "@/server/services/eliteLoyalty";

/**
 * GET /api/loyalty/rewards - Get rewards shop items
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type");
    const category = searchParams.get("category");

    const where: {
      isActive: boolean;
      type?: string;
      category?: string;
    } = {
      isActive: true,
    };

    if (type) {
      where.type = type;
    }

    if (category) {
      where.category = category;
    }

    const items = await prisma.rewardItem.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { coinsCost: "asc" }],
      include: {
        _count: {
          select: { redemptions: true },
        },
      },
    });

    const loyalty = await prisma.loyaltyAccount.findUnique({
      where: { userId: user.id },
    });

    const userCoins = loyalty?.coins || 0;

    const userRedemptions = await prisma.rewardRedemption.findMany({
      where: { userId: user.id },
      select: {
        rewardItemId: true,
      },
    });

    const redemptionCounts = userRedemptions.reduce(
      (acc, r) => {
        acc[r.rewardItemId] = (acc[r.rewardItemId] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const itemsWithStatus = items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      type: item.type,
      category: item.category,
      coinsCost: item.coinsCost,
      egpValue: item.egpValue ? Number(item.egpValue) : null,
      imageUrl: item.imageUrl,
      stockQty: item.stockQty,
      maxPerUser: item.maxPerUser,
      metadata: item.metadata,
      totalRedemptions: item._count.redemptions,
      userRedemptions: redemptionCounts[item.id] || 0,
      canAfford: userCoins >= item.coinsCost,
      canRedeem:
        userCoins >= item.coinsCost &&
        (item.stockQty === null || item.stockQty > 0) &&
        (item.maxPerUser === null || (redemptionCounts[item.id] || 0) < item.maxPerUser),
      inStock: item.stockQty === null || item.stockQty > 0,
    }));

    const categories = [
      ...new Set(items.map((item) => item.category).filter((c): c is string => c !== null)),
    ];
    const types = [...new Set(items.map((item) => item.type))];

    return jsonResponse(
      successResponse({
        items: itemsWithStatus,
        userCoins,
        filters: {
          categories,
          types,
        },
        stats: {
          total: items.length,
          affordable: itemsWithStatus.filter((i) => i.canAfford).length,
          redeemable: itemsWithStatus.filter((i) => i.canRedeem).length,
        },
      }),
    );
  } catch (error) {
    console.error("Rewards fetch error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch rewards";
    const isAuthError = error instanceof Error && error.message === "Authentication required";
    return jsonResponse(errorResponse(message), isAuthError ? 401 : 500);
  }
}

/**
 * POST /api/loyalty/rewards - Redeem a reward
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const { rewardItemId, deliveryMethod, deliveryAddress, notes } = body;

    if (!rewardItemId) {
      return jsonResponse(errorResponse("Missing rewardItemId"), 400);
    }

    const item = await prisma.rewardItem.findUnique({
      where: { id: rewardItemId },
    });

    if (!item || !item.isActive) {
      return jsonResponse(errorResponse("Reward not found or inactive"), 404);
    }

    if (item.stockQty !== null && item.stockQty <= 0) {
      return jsonResponse(errorResponse("Reward out of stock"), 400);
    }

    if (item.maxPerUser) {
      const userRedemptionCount = await prisma.rewardRedemption.count({
        where: {
          userId: user.id,
          rewardItemId,
        },
      });

      if (userRedemptionCount >= item.maxPerUser) {
        return jsonResponse(errorResponse("Maximum redemptions reached for this reward"), 400);
      }
    }

    const success = await redeemCoins(user.id, rewardItemId, item.coinsCost);

    if (!success) {
      return jsonResponse(errorResponse("Insufficient coins or redemption failed"), 400);
    }

    const redemption = await prisma.rewardRedemption.create({
      data: {
        userId: user.id,
        rewardItemId,
        coinsSpent: item.coinsCost,
        deliveryMethod: deliveryMethod || null,
        deliveryAddress: deliveryAddress || null,
        notes: notes || null,
        status: "pending",
      },
      include: {
        rewardItem: true,
      },
    });

    if (item.stockQty !== null) {
      await prisma.rewardItem.update({
        where: { id: rewardItemId },
        data: {
          stockQty: { decrement: 1 },
        },
      });
    }

    return jsonResponse(
      successResponse({
        redemption: {
          id: redemption.id,
          item: {
            name: redemption.rewardItem.name,
            description: redemption.rewardItem.description,
            imageUrl: redemption.rewardItem.imageUrl,
          },
          coinsSpent: redemption.coinsSpent,
          status: redemption.status,
          redeemedAt: redemption.redeemedAt,
        },
        message: "Reward redeemed successfully",
      }),
    );
  } catch (error) {
    console.error("Reward redemption error:", error);
    const message = error instanceof Error ? error.message : "Failed to redeem reward";
    return jsonResponse(errorResponse(message), 500);
  }
}

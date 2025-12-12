import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { prisma } from "@/server/db/client";
import { jsonResponse, successResponse, errorResponse } from "@/server/utils/apiHelpers";
import { COINS_PER_EGP } from "@/server/services/eliteLoyalty";

/**
 * GET /api/loyalty/coins - Get user's coin balance and history
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const loyalty = await prisma.loyaltyAccount.findUnique({
      where: { userId: user.id },
    });

    const searchParams = request.nextUrl.searchParams;
    const limit = Number.parseInt(searchParams.get("limit") || "50", 10);
    const offset = Number.parseInt(searchParams.get("offset") || "0", 10);

    const history = await prisma.loyaltyLedger.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        order: {
          select: {
            id: true,
            total: true,
            createdAt: true,
          },
        },
      },
    });

    const totalTransactions = await prisma.loyaltyLedger.count({
      where: { userId: user.id },
    });

    return jsonResponse(
      successResponse({
        balance: loyalty?.coins || 0,
        lifetimeCoins: loyalty?.lifetimeCoins || 0,
        coinsValueEGP: ((loyalty?.coins || 0) / COINS_PER_EGP).toFixed(2),
        history: history.map((item) => ({
          id: item.id,
          deltaCoins: item.deltaCoins,
          reason: item.reason,
          source: item.source,
          metadata: item.metadata,
          orderId: item.orderId,
          orderTotal: item.order?.total,
          createdAt: item.createdAt,
        })),
        pagination: {
          limit,
          offset,
          total: totalTransactions,
          hasMore: offset + limit < totalTransactions,
        },
      }),
    );
  } catch (error) {
    console.error("Coins fetch error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch coins";
    const isAuthError = error instanceof Error && error.message === "Authentication required";
    return jsonResponse(errorResponse(message), isAuthError ? 401 : 500);
  }
}

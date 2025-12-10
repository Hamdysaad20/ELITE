import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { prisma } from "@/server/db/client";
import { jsonResponse, successResponse, errorResponse } from "@/server/utils/apiHelpers";

/**
 * GET /api/user/purchases - Get user's purchase history (products they've ordered)
 * Used to verify if user can leave a review
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Get all distinct products the user has purchased from confirmed orders
    const purchasedItems = await prisma.orderItem.findMany({
      where: {
        order: {
          userId: user.id,
          status: { in: ["CONFIRMED", "DELIVERED", "COMPLETED"] },
        },
      },
      select: {
        productId: true,
        productName: true,
        order: {
          select: {
            createdAt: true,
            status: true,
          },
        },
      },
      orderBy: {
        order: {
          createdAt: "desc",
        },
      },
    });

    // Create a map of unique products with their latest purchase date
    const uniqueProducts = new Map<string, { productName: string; purchaseDate: Date }>();
    
    purchasedItems.forEach((item) => {
      if (!uniqueProducts.has(item.productId)) {
        uniqueProducts.set(item.productId, {
          productName: item.productName,
          purchaseDate: item.order.createdAt,
        });
      }
    });

    // Convert to array format
    const purchases = Array.from(uniqueProducts.entries()).map(([productId, data]) => ({
      productId,
      productName: data.productName,
      purchaseDate: data.purchaseDate,
    }));

    return jsonResponse(
      successResponse(purchases, `Found ${purchases.length} purchased products`),
    );
  } catch (error) {
    console.error("Purchase history fetch error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch purchase history";
    return jsonResponse(errorResponse(message), 500);
  }
}

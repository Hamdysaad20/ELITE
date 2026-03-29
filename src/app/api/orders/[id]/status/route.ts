import { NextRequest } from "next/server";
import { prisma } from "@/server/db/client";
import {
  jsonResponse,
  successResponse,
  errorResponse,
  getUserId,
} from "@/server/utils/apiHelpers";
import { getAuthUser } from "@/server/auth/session";
import { awardOrderPoints } from "@/server/services/loyalty";
import { createOdooClient, isOdooConfigured } from "@/server/utils/odooClient";

function mapSaleStateToOrderStatus(saleState?: string): string | null {
  switch ((saleState || "").toLowerCase()) {
    case "draft":
    case "sent":
      return "PENDING";
    case "sale":
      return "CONFIRMED";
    case "done":
      return "DELIVERED";
    case "cancel":
      return "CANCELLED";
    default:
      return null;
  }
}

function mapPosStateToOrderStatus(posState?: string): string | null {
  switch ((posState || "").toLowerCase()) {
    case "draft":
      return "PENDING";
    case "paid":
    case "invoiced":
      return "CONFIRMED";
    case "done":
      return "DELIVERED";
    case "cancel":
    case "cancelled":
      return "CANCELLED";
    default:
      return null;
  }
}

function resolveStatusPriority(
  current: string,
  saleMapped: string | null,
  posMapped: string | null,
): string {
  const candidates = [current, saleMapped || "", posMapped || ""].filter(
    Boolean,
  );

  if (candidates.includes("CANCELLED")) return "CANCELLED";
  if (candidates.includes("DELIVERED")) return "DELIVERED";
  if (candidates.includes("OUT_FOR_DELIVERY")) return "OUT_FOR_DELIVERY";
  if (candidates.includes("READY")) return "READY";
  if (candidates.includes("PREPARING")) return "PREPARING";
  if (candidates.includes("CONFIRMED")) return "CONFIRMED";
  return "PENDING";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(request);
    const userId = authUser?.id || getUserId(request);

    let order = await prisma.order.findFirst({
      where: { id, userId },
      select: {
        id: true,
        saleOrderId: true,
        posOrderId: true,
        odooWebUrl: true,
        odooStatusSale: true,
        odooStatusPos: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!order) {
      return jsonResponse(errorResponse("Order not found"), 404);
    }
    // Hide unpaid online-payment orders (awaiting webhook confirmation).
    // CASH orders are auto-marked PAID; this is a safety net.
    if (order.paymentStatus !== "PAID" && order.paymentMethod !== "CASH") {
      return jsonResponse(errorResponse("Order not found"), 404);
    }

    // Auto-sync local status from Odoo whenever IDs are present.
    if (isOdooConfigured() && (order.saleOrderId || order.posOrderId)) {
      try {
        const client = createOdooClient();
        if (client) {
          const sale = order.saleOrderId
            ? await client.getSaleOrderStatus(order.saleOrderId)
            : null;
          const pos = order.posOrderId
            ? await client.getPosOrderStatus(order.posOrderId)
            : null;

          const saleMapped = mapSaleStateToOrderStatus(sale?.state);
          const posMapped = mapPosStateToOrderStatus(pos?.state);
          const nextStatus = resolveStatusPriority(
            order.status,
            saleMapped,
            posMapped,
          );

          const nextOdooSale = sale?.state || order.odooStatusSale || "pending";
          const nextOdooPos = pos?.state || order.odooStatusPos || "pending";

          if (
            nextStatus !== order.status ||
            nextOdooSale !== (order.odooStatusSale || "pending") ||
            nextOdooPos !== (order.odooStatusPos || "pending")
          ) {
            const updated = await prisma.order.update({
              where: { id: order.id },
              data: {
                status: nextStatus,
                odooStatusSale: nextOdooSale,
                odooStatusPos: nextOdooPos,
                updatedAt: new Date(),
              },
              select: {
                id: true,
                saleOrderId: true,
                posOrderId: true,
                odooWebUrl: true,
                odooStatusSale: true,
                odooStatusPos: true,
                status: true,
                paymentStatus: true,
                paymentMethod: true,
                createdAt: true,
                updatedAt: true,
              },
            });
            order = updated;
          }
        }
      } catch (syncErr) {
        // Do not fail status endpoint when Odoo is temporarily unreachable.
        console.warn(
          `[orders/status] Odoo status sync skipped for ${id}:`,
          syncErr,
        );
      }
    }

    return jsonResponse(
      successResponse({
        id: order.id,
        status: order.status,
        paymentStatus: order.paymentStatus,
        saleOrderId: order.saleOrderId,
        posOrderId: order.posOrderId,
        odooWebUrl: order.odooWebUrl,
        odooStatusSale: order.odooStatusSale || "pending",
        odooStatusPos: order.odooStatusPos || "pending",
        updatedAt: order.updatedAt,
        createdAt: order.createdAt,
      }),
    );
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Failed to fetch order status";
    return jsonResponse(errorResponse(msg), 500);
  }
}

/**
 * PATCH /api/orders/[id]/status - Update order status
 * This endpoint allows updating the order status (e.g., to DELIVERED, COMPLETED)
 * and automatically awards loyalty points when appropriate
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(request);
    const userId = authUser?.id || getUserId(request);

    const body = await request.json();
    const { status, paymentStatus } = body;

    // Validate status
    const validStatuses = [
      "PENDING",
      "CONFIRMED",
      "PREPARING",
      "READY",
      "DELIVERING",
      "DELIVERED",
      "COMPLETED",
      "CANCELLED",
    ];
    if (status && !validStatuses.includes(status)) {
      return jsonResponse(
        errorResponse(
          `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        ),
        400,
      );
    }

    // Fetch existing order
    const order = await prisma.order.findFirst({
      where: { id, userId },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        userId: true,
      },
    });

    if (!order) {
      return jsonResponse(errorResponse("Order not found"), 404);
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(paymentStatus && { paymentStatus }),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        userId: true,
        saleOrderId: true,
        posOrderId: true,
        odooWebUrl: true,
        odooStatusSale: true,
        odooStatusPos: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Award loyalty points if order is completed/delivered AND payment is confirmed
    // For online payments, points are only awarded after payment is confirmed (PAID status)
    const isPaid = updatedOrder.paymentStatus === "PAID";
    const isCashPayment = updatedOrder.paymentMethod === "CASH";
    const isCompleted = status && ["DELIVERED", "COMPLETED"].includes(status);

    if (isCompleted && updatedOrder.userId && (isPaid || isCashPayment)) {
      const result = await awardOrderPoints(id, updatedOrder.userId);
      if (result) {
        console.log(
          `✅ Awarded ${result.pointsAwarded} points for order ${id}`,
        );
      }

      // Process gamification rewards (achievements, badges, streaks)
      // Note: Deal detection will be enhanced in future iterations
      // Idempotency: Check if rewards already processed for this order
      try {
        const { prisma: prismaClient } = await import("@/server/db/client");
        const existingReward = await prismaClient.rewardEvent.findFirst({
          where: {
            userId: updatedOrder.userId,
            triggerType: "deal_purchased",
            triggerId: id,
            status: { in: ["awarded", "pending"] },
          },
        });

        if (!existingReward) {
          const { processDealPurchaseRewards } = await import(
            "@/server/services/gamification/dealRewards"
          );
          const orderWithItems = await prisma.order.findUnique({
            where: { id },
            include: { items: true },
          });

          if (orderWithItems && orderWithItems.items.length > 0) {
            // For now, process generic deal purchase rewards
            // Future: Detect specific deal types from order items
            await processDealPurchaseRewards({
              userId: updatedOrder.userId,
              orderId: id,
              dealType: "General Deals", // Will be enhanced to detect actual deal type
              dealProducts: orderWithItems.items.map((item) => item.productId),
              orderTotal: Number(orderWithItems.total),
            });
          }
        } else {
          console.log(`Rewards already processed for order ${id}`);
        }
      } catch (error) {
        // Don't fail order update if gamification fails
        console.error(
          `⚠️ Failed to process gamification rewards for order ${id}:`,
          error,
        );
      }
    }

    return jsonResponse(
      successResponse(
        {
          id: updatedOrder.id,
          status: updatedOrder.status,
          paymentStatus: updatedOrder.paymentStatus,
          saleOrderId: updatedOrder.saleOrderId,
          posOrderId: updatedOrder.posOrderId,
          odooWebUrl: updatedOrder.odooWebUrl,
          odooStatusSale: updatedOrder.odooStatusSale || "pending",
          odooStatusPos: updatedOrder.odooStatusPos || "pending",
          updatedAt: updatedOrder.updatedAt,
          createdAt: updatedOrder.createdAt,
        },
        "Order status updated successfully",
      ),
    );
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Failed to update order status";
    return jsonResponse(errorResponse(msg), 500);
  }
}

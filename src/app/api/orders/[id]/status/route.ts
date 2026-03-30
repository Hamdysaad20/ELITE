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
import { notifyOrderStatusChange } from "@/server/services/orderStatusNotifications";
import { createOdooClient, isOdooConfigured } from "@/server/utils/odooClient";
import {
  mapPosStateToOrderStatus,
  mapSaleStateToOrderStatus,
  normalizeOrderStatus,
  resolveOrderStatusPriority,
  getAcceptedOrderStatusValues,
} from "@/lib/orderStatus";

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
        userId: true,
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

          const deliveryRollup = order.saleOrderId
            ? await client.getSaleOutgoingDeliveryRollup(order.saleOrderId)
            : { states: [], rolledState: null as null };

          let effectiveSaleState = sale?.state;
          if (deliveryRollup.rolledState === "done") {
            effectiveSaleState = "done";
          } else if (deliveryRollup.rolledState === "cancel") {
            effectiveSaleState = "cancel";
          }

          const saleMapped = mapSaleStateToOrderStatus(effectiveSaleState);
          const posMapped = mapPosStateToOrderStatus(pos?.state);
          const hasOdooMappedStatus = Boolean(saleMapped || posMapped);
          const nextStatus = hasOdooMappedStatus
            ? resolveOrderStatusPriority("PENDING", saleMapped, posMapped)
            : normalizeOrderStatus(order.status);

          const nextOdooSale =
            effectiveSaleState || order.odooStatusSale || "pending";
          const nextOdooPos = pos?.state || order.odooStatusPos || "pending";

          if (
            nextStatus !== order.status ||
            nextOdooSale !== (order.odooStatusSale || "pending") ||
            nextOdooPos !== (order.odooStatusPos || "pending")
          ) {
            const previousStatus = order.status;
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
                userId: true,
                createdAt: true,
                updatedAt: true,
              },
            });

            await notifyOrderStatusChange({
              orderId: order.id,
              userId: order.userId,
              previousStatus,
              nextStatus,
              source: "odoo-poll",
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
        status: normalizeOrderStatus(order.status),
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
    const validStatuses = getAcceptedOrderStatusValues();
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
        ...(status && { status: normalizeOrderStatus(status) }),
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
    const isCompleted =
      (status ? normalizeOrderStatus(status) : updatedOrder.status) ===
      "DELIVERED";

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
          status: normalizeOrderStatus(updatedOrder.status),
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

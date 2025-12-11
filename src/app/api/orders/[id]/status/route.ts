import { NextRequest } from "next/server";
import { prisma } from "@/server/db/client";
import {
  jsonResponse,
  successResponse,
  errorResponse,
} from "@/server/utils/apiHelpers";
import { getAuthUser } from "@/server/auth/session";
import { awardOrderPoints } from "@/server/services/loyalty";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(request);
    const userId = authUser?.id || request.headers.get("x-user-id") || "demo-user";

    const order = await prisma.order.findFirst({
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
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!order) {
      return jsonResponse(errorResponse("Order not found"), 404);
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
    const msg = err instanceof Error ? err.message : "Failed to fetch order status";
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
    const userId = authUser?.id || request.headers.get("x-user-id") || "demo-user";

    const body = await request.json();
    const { status, paymentStatus } = body;

    // Validate status
    const validStatuses = ["PENDING", "CONFIRMED", "PREPARING", "READY", "DELIVERING", "DELIVERED", "COMPLETED", "CANCELLED"];
    if (status && !validStatuses.includes(status)) {
      return jsonResponse(errorResponse(`Invalid status. Must be one of: ${validStatuses.join(", ")}`), 400);
    }

    // Fetch existing order
    const order = await prisma.order.findFirst({
      where: { id, userId },
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

    // Award loyalty points if order is completed/delivered
    if (status && ["DELIVERED", "COMPLETED"].includes(status) && updatedOrder.userId) {
      const result = await awardOrderPoints(id, updatedOrder.userId);
      if (result) {
        console.log(`✅ Awarded ${result.pointsAwarded} points for order ${id}`);
      }
    }

    return jsonResponse(
      successResponse({
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
      }, "Order status updated successfully"),
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update order status";
    return jsonResponse(errorResponse(msg), 500);
  }
}

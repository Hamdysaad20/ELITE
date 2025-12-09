import { NextRequest } from "next/server";
import { prisma } from "@/server/db/client";
import {
  jsonResponse,
  successResponse,
  errorResponse,
} from "@/server/utils/apiHelpers";
import { getAuthUser } from "@/server/auth/session";

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


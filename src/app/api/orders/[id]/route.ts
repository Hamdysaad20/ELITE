import { NextRequest } from "next/server";
import { prisma } from "@/server/db/client";
import type { Order as PrismaOrder, OrderItem as PrismaOrderItem } from "@prisma/client";
import {
  successResponse,
  jsonResponse,
  handleApiError,
} from "@/server/utils/apiHelpers";

type DbOrderWithItems = PrismaOrder & { items: PrismaOrderItem[] };

function serializeOrder(dbOrder: DbOrderWithItems) {
  return {
    id: dbOrder.id,
    orderNumber: dbOrder.id,
    userId: dbOrder.userId || "demo-user",
    status: dbOrder.status,
    paymentStatus: dbOrder.paymentStatus,
    paymentMethod: dbOrder.paymentMethod,
    orderType: dbOrder.orderType,
    subtotal: Number(dbOrder.subtotal),
    deliveryFee: Number(dbOrder.deliveryFee),
    discount: Number(dbOrder.discount),
    total: Number(dbOrder.total),
    notes: dbOrder.notes || undefined,
    integrations: {
      odoo: {
        saleOrderId: dbOrder.saleOrderId || undefined,
        posOrderId: dbOrder.posOrderId || undefined,
        url: dbOrder.odooWebUrl || undefined,
      },
    },
    items: (dbOrder.items || []).map((it) => ({
      id: it.id,
      menuItemId: it.productId,
      quantity: it.quantity,
      unitPrice: Number(it.unitPrice),
      totalPrice: Number(it.totalPrice),
      menuItem: it.name
        ? {
            id: it.productId,
            name: it.name,
            description: it.name,
            price: Number(it.unitPrice),
            category: it.categoryId || "unknown",
            subCategory: it.categoryId || "unknown",
            images: [],
            featured: false,
            available: true,
            allergens: [],
            sizes: [],
            flavors: [],
            toppings: [],
          }
        : undefined,
    })),
    createdAt: dbOrder.createdAt,
    updatedAt: dbOrder.updatedAt,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const userId = request.headers.get("x-user-id") || "demo-user";

    const order = await prisma.order.findFirst({
      where: { id, userId },
      include: { items: true },
    });

    if (!order) {
      return jsonResponse({ success: false, error: "Order not found" }, 404);
    }

    return jsonResponse(successResponse(serializeOrder(order)));
  } catch (error) {
    return handleApiError(error);
  }
}

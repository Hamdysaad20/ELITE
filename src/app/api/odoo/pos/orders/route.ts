/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { createOdooClient, isOdooConfigured } from "@/server/utils/odooClient";
import {
  jsonResponse,
  successResponse,
  errorResponse,
} from "@/server/utils/apiHelpers";
import type { Order, OrderItem } from "@/types";

function genId(prefix = "ord"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

type PartnerInput = {
  name: string;
  email?: string;
  phone?: string;
  street?: string;
  city?: string;
  zip?: string;
};

type CreatePosOrderBody = {
  items: Array<{
    menuItemId?: string;
    name?: string;
    quantity: number;
    unitPrice: number;
  }>;
  partner: PartnerInput;
  notes?: string;
  orderNumber?: string;
  userId?: string;
  posConfigId?: number;
  posConfigName?: string;
};

export async function POST(req: NextRequest) {
  try {
    // Diagnostic-only: prefer /api/orders with enablePos for production
    if (req.headers.get("x-diagnostic") !== "true") {
      return jsonResponse(
        errorResponse(
          "This endpoint is diagnostic-only. Use /api/orders with POS enabled for production.",
        ),
        400,
      );
    }
    if (!isOdooConfigured()) {
      return jsonResponse(errorResponse("Odoo not configured"), 500);
    }

    const body = (await req.json()) as CreatePosOrderBody;

    if (!body?.partner?.name) {
      return jsonResponse(errorResponse("partner.name is required"), 400);
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return jsonResponse(
        errorResponse("items array is required and must not be empty"),
        400,
      );
    }
    for (const it of body.items) {
      if (!it?.quantity || it.quantity <= 0) {
        return jsonResponse(
          errorResponse("each item.quantity must be > 0"),
          400,
        );
      }
      if (!it?.unitPrice || it.unitPrice <= 0) {
        return jsonResponse(
          errorResponse("each item.unitPrice must be > 0"),
          400,
        );
      }
      if (!it.menuItemId && !it.name) {
        return jsonResponse(
          errorResponse("each item must include menuItemId or name"),
          400,
        );
      }
    }

    const client = createOdooClient();
    if (!client)
      return jsonResponse(errorResponse("Failed to init Odoo client"), 500);

    // Ensure POS model is available
    const hasPos = await client.modelExists("pos.order").catch(() => false);
    if (!hasPos) {
      return jsonResponse(
        errorResponse(
          "Odoo 'pos.order' model isn't available. Install the Point of Sale (Restaurant) app in this database.",
        ),
        400,
      );
    }

    // Build minimal Order from body
    const id = body.orderNumber || genId("web");
    const now = new Date();
    const subtotal = body.items.reduce(
      (sum, it) => sum + it.quantity * it.unitPrice,
      0,
    );

    const orderItems: OrderItem[] = body.items.map((it, idx) => ({
      id: genId(`item${idx}`),
      menuItemId: it.menuItemId || it.name || `item-${idx}`,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      totalPrice: it.quantity * it.unitPrice,
      menuItem: it.name
        ? {
            id: it.menuItemId || it.name || `item-${idx}`,
            name: it.name,
            description: it.name,
            price: it.unitPrice,
            category: "website",
            subCategory: "website",
            images: [],
            featured: false,
            available: true,
            allergens: [],
            sizes: [],
            flavors: [],
            toppings: [],
          }
        : undefined,
    }));

    const order: Order = {
      id,
      orderNumber: id.toUpperCase(),
      userId: body.userId || "website-user",
      status: "PENDING" as any,
      paymentStatus: "PENDING" as any,
      paymentMethod: "ONLINE" as any,
      orderType: "PICKUP" as any,
      subtotal,
      deliveryFee: 0,
      discount: 0,
      total: subtotal,
      notes: body.notes,
      items: orderItems,
      createdAt: now as any,
      updatedAt: now as any,
    };

    const posOrderId = await client.createPosOrderFromWebsiteOrder(
      order,
      body.partner,
      { posConfigId: body.posConfigId, posConfigName: body.posConfigName },
    );

    const host = (process.env.ODOO_HOST || "").replace(/\/$/, "");
    const webUrl = host
      ? `${host}/web#model=pos.order&id=${posOrderId}&view_type=form`
      : undefined;

    return jsonResponse(
      successResponse(
        { posOrderId, orderNumber: id, webUrl },
        "POS order created (sent to kitchen if Kitchen Display is configured)",
      ),
    );
  } catch (err: any) {
    return jsonResponse(
      errorResponse(err?.message || "Failed to create POS order"),
      500,
    );
  }
}

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

type CreateOrderBody = {
  items: Array<{
    menuItemId?: string; // used as SKU (default_code) if provided
    name?: string; // fallback to name if no menuItemId
    quantity: number;
    unitPrice: number;
  }>;
  partner: PartnerInput;
  notes?: string;
  autoConfirm?: boolean; // if true, confirm the quotation
  orderNumber?: string; // optional external reference
  userId?: string; // optional external user id
};

export async function POST(req: NextRequest) {
  try {
    // Diagnostic-only: prefer /api/orders (DB + queue) for production
    if (req.headers.get("x-diagnostic") !== "true") {
      return jsonResponse(
        errorResponse(
          "This endpoint is diagnostic-only. Use /api/orders for production orders.",
        ),
        400,
      );
    }
    if (!isOdooConfigured()) {
      return jsonResponse(errorResponse("Odoo not configured"), 500);
    }

    const body = (await req.json()) as CreateOrderBody;

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

    // Ensure Sales app is installed
    const hasSale = await client.modelExists("sale.order").catch(() => false);
    if (!hasSale) {
      return jsonResponse(
        errorResponse(
          "Odoo 'sale.order' model isn't available. Install the Sales app (sale_management) in this database to create sale orders.",
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

    const saleId = await client.createSaleOrderFromWebsiteOrder(
      order,
      body.partner,
    );

    let confirmed = false;
    if (body.autoConfirm) {
      try {
        await client.confirmSaleOrder(saleId);
        confirmed = true;
      } catch (err) {
        console.warn("Failed to confirm sale order", err);
      }
    }

    const host = (process.env.ODOO_HOST || "").replace(/\/$/, "");
    const webUrl = host
      ? `${host}/web#model=sale.order&id=${saleId}&view_type=form`
      : undefined;

    return jsonResponse(
      successResponse(
        { saleId, quotationNumber: id, confirmed, webUrl },
        confirmed
          ? "Sale order created and confirmed"
          : body.autoConfirm
            ? "Quotation created (confirmation attempted)"
            : "Quotation created",
      ),
    );
  } catch (err: any) {
    return jsonResponse(
      errorResponse(err?.message || "Failed to create order in Odoo"),
      500,
    );
  }
}

export async function GET() {
  try {
    const configured = isOdooConfigured();
    if (!configured)
      return jsonResponse(
        successResponse(
          { configured, hasSale: false },
          "Odoo not configured (diagnostic endpoint)",
        ),
      );

    const client = createOdooClient();
    if (!client)
      return jsonResponse(errorResponse("Failed to init Odoo client"), 500);

    const ping = await client.ping();
    const hasSale = await client.modelExists("sale.order").catch(() => false);
    const productCount = await client
      .searchCount("product.product", [["sale_ok", "=", true]])
      .catch(() => 0);

    return jsonResponse(
      successResponse(
        { configured, ping, hasSale, productCount },
        "Odoo orders diagnostics",
      ),
    );
  } catch (err: any) {
    return jsonResponse(
      errorResponse(err?.message || "Failed to get diagnostics"),
      500,
    );
  }
}

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

export async function POST(req: NextRequest) {
  try {
    if (!isOdooConfigured()) {
      return jsonResponse(errorResponse("Odoo not configured"), 500);
    }

    const body = await req.json().catch(() => ({}) as any);
    const quantity: number = Number(body.quantity ?? 1);
    const itemName: string = String(body.itemName ?? "Water");
    const unitPrice: number = Number(body.unitPrice ?? 10);
    const menuItemId: string = String(body.menuItemId ?? "water");

    if (!quantity || quantity <= 0) {
      return jsonResponse(errorResponse("quantity must be > 0"), 400);
    }
    if (!unitPrice || unitPrice <= 0) {
      return jsonResponse(errorResponse("unitPrice must be > 0"), 400);
    }

    // Build a minimal website order
    const id = genId();
    const now = new Date();
    const subtotal = unitPrice * quantity;

    const item: OrderItem = {
      id: genId("item"),
      menuItemId,
      quantity,
      unitPrice,
      totalPrice: subtotal,
      menuItem: {
        id: menuItemId,
        name: itemName,
        description: itemName,
        price: unitPrice,
        category: "test",
        subCategory: "test",
        images: [],
        featured: false,
        available: true,
        allergens: [],
        sizes: [],
        flavors: [],
        toppings: [],
      },
    };

    const order: Order = {
      id,
      orderNumber: id.toUpperCase(),
      userId: "test-user",
      status: "PENDING" as any,
      paymentStatus: "PENDING" as any,
      paymentMethod: "CASH" as any,
      orderType: "PICKUP" as any,
      subtotal,
      deliveryFee: 0,
      codFee: 0,
      discount: 0,
      total: subtotal,
      notes: body.notes ?? `Test order for ${quantity} ${itemName}`,
      items: [item],
      createdAt: now as any,
      updatedAt: now as any,
    };

    const client = createOdooClient();
    if (!client)
      return jsonResponse(errorResponse("Failed to init Odoo client"), 500);

    // Preflight: ensure 'sale.order' model is installed (Sales app)
    const hasSale = await client.modelExists("sale.order").catch(() => false);
    if (!hasSale) {
      return jsonResponse(
        errorResponse(
          "Odoo 'sale.order' model isn't available. Install the Sales app (sale_management) in this database to create sale orders.",
        ),
        400,
      );
    }

    const saleId = await client.createSaleOrderFromWebsiteOrder(order, {
      name: body?.partner?.name ?? "Test Customer",
      email: body?.partner?.email,
      phone: body?.partner?.phone,
      street: body?.partner?.street,
      city: body?.partner?.city,
      zip: body?.partner?.zip,
    });

    const host = (process.env.ODOO_HOST || "").replace(/\/$/, "");
    const webUrl = host
      ? `${host}/web#model=sale.order&id=${saleId}&view_type=form`
      : undefined;

    return jsonResponse(
      successResponse({ saleId, order, webUrl }, "Sale order created"),
    );
  } catch (err: any) {
    return jsonResponse(
      errorResponse(err?.message || "Failed to create sale order"),
      500,
    );
  }
}

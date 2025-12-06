/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/server/db/client";
import {
  createOdooClient,
  isOdooConfigured,
} from "@/server/utils/odooClient";
import { OrderStatus } from "@/types";
import { odooQueue, type OdooJobData, createOdooWorker } from "@/server/queue/odooQueue";

export type OrderSyncPayload = OdooJobData;

export async function enqueueOrderSync(payload: OrderSyncPayload): Promise<void> {
  if (odooQueue) {
    await odooQueue.add("sync-order", payload);
    return;
  }
  // fallback inline if queue unavailable
  setImmediate(() => {
    processOrderSync(payload).catch((err) => {
      console.error("Order sync failed", err);
    });
  });
}

export function startOdooWorker() {
  return createOdooWorker(async (job) => {
    await processOrderSync(job.data);
  });
}

async function processOrderSync(payload: OrderSyncPayload): Promise<void> {
  if (!isOdooConfigured()) {
    await prisma.order.update({
      where: { id: payload.orderId },
      data: { odooStatusSale: "skipped", odooStatusPos: "skipped" },
    });
    return;
  }

  const order = await prisma.order.findUnique({
    where: { id: payload.orderId },
    include: { items: true },
  });
  if (!order) {
    return;
  }

  const client = createOdooClient();
  if (!client) return;

  // Build order-like structure for Odoo client
  const orderForOdoo = {
    id: payload.clientOrderRef,
    orderNumber: order.id.toUpperCase(),
    userId: order.userId || "website-user",
    status: OrderStatus.PENDING as any,
    paymentStatus: order.paymentStatus as any,
    paymentMethod: order.paymentMethod as any,
    orderType: order.orderType as any,
    subtotal: Number(order.subtotal),
    deliveryFee: Number(order.deliveryFee),
    discount: Number(order.discount),
    total: Number(order.total),
    notes: order.notes || undefined,
    integrations: {},
    items: order.items.map((it: any) => ({
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
            category: it.categoryId || "website",
            subCategory: it.categoryId || "website",
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
    createdAt: order.createdAt as any,
    updatedAt: order.updatedAt as any,
  };

  let saleId: number | undefined;
  let posOrderId: number | undefined;
  let odooWebUrl: string | undefined;

  try {
    if (payload.enableSale) {
      saleId = await client.createSaleOrderFromWebsiteOrder(
        orderForOdoo as any,
        payload.partner,
      );
      if (payload.autoConfirm && saleId) {
        await client.confirmSaleOrder(saleId).catch(() => null);
      }
    }
    if (payload.enablePos) {
      posOrderId = await client.createPosOrderFromWebsiteOrder(
        orderForOdoo as any,
        payload.partner,
        {
          posConfigId: payload.posConfigId,
          posConfigName: payload.posConfigName,
          customerNotePerLine: payload.customerNotePerLine,
        },
      );
    }

    const host = (process.env.ODOO_HOST || "").replace(/\/$/, "");
    if (saleId && host) {
      odooWebUrl = `${host}/web#model=sale.order&id=${saleId}&view_type=form`;
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        saleOrderId: saleId,
        posOrderId,
        odooWebUrl,
        status: saleId ? OrderStatus.CONFIRMED : order.status,
        odooStatusSale: payload.enableSale ? "synced" : "skipped",
        odooStatusPos: payload.enablePos ? "synced" : "skipped",
      },
    });
  } catch (err) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        odooStatusSale: payload.enableSale ? "failed" : "skipped",
        odooStatusPos: payload.enablePos ? "failed" : "skipped",
      },
    });
    throw err;
  }
}


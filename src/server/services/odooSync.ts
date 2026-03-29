/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/server/db/client";
import { createOdooClient, isOdooConfigured } from "@/server/utils/odooClient";
import { OrderStatus } from "@/types";
import {
  odooQueue,
  type OdooJobData,
  createOdooWorker,
} from "@/server/queue/odooQueue";

export type OrderSyncPayload = OdooJobData;

/**
 * Enqueue order sync to Odoo
 *
 * Strategy:
 * 1. In serverless (Vercel/Netlify): Run inline sync directly (no queue worker available)
 * 2. In non-serverless with Redis: Queue the job for async processing with retries
 * 3. In non-serverless without Redis: Run inline sync as fallback
 *
 * This ensures orders always sync, even in serverless where queue workers can't run.
 */
export async function enqueueOrderSync(
  payload: OrderSyncPayload,
): Promise<void> {
  const isServerlessEnv =
    process.env.VERCEL === "1" || process.env.NETLIFY === "true";

  // In serverless environments, skip the queue and run inline
  // Queue workers don't run in serverless, so jobs would never be processed
  if (isServerlessEnv) {
    console.log(
      `[odooSync] Serverless detected, running inline sync for order ${payload.orderId}`,
    );
    // Run synchronously (await) so sync completes before function terminates
    try {
      await processOrderSync(payload);
    } catch (err) {
      console.error(
        `[odooSync] Order sync failed for ${payload.orderId}:`,
        err,
      );
      // Update order status on error with retry tracking
      const errorMessage = err instanceof Error ? err.message : String(err);
      try {
        await prisma.order.update({
          where: { id: payload.orderId },
          data: {
            odooStatusSale: payload.enableSale ? "failed" : "skipped",
            odooStatusPos: payload.enablePos ? "failed" : "skipped",
            odooSyncAttempts: { increment: 1 },
            odooSyncLastError: errorMessage.substring(0, 500), // Limit error length
            odooSyncLastAttemptAt: new Date(),
          },
        });
      } catch (updateErr) {
        console.error(`[odooSync] Failed to update order status:`, updateErr);
      }
    }
    return;
  }

  // Non-serverless: Try to use queue if available
  if (odooQueue) {
    try {
      await odooQueue.add("sync-order", payload, {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: {
          age: 3600, // Keep completed jobs for 1 hour
          count: 1000, // Keep last 1000 completed jobs
        },
        removeOnFail: {
          age: 86400, // Keep failed jobs for 24 hours for debugging
        },
      });
      console.log(`[odooSync] Order ${payload.orderId} queued for sync`);
      return;
    } catch (error) {
      console.error(
        `[odooSync] Failed to queue order ${payload.orderId}, falling back to inline sync:`,
        error,
      );
      // Fall through to inline sync
    }
  }

  // Fallback: Run sync inline (fire-and-forget for non-serverless)
  console.warn(
    `[odooSync] Queue unavailable, running sync inline for order ${payload.orderId}`,
  );

  // Use setImmediate to avoid blocking the response in non-serverless
  setImmediate(async () => {
    try {
      await processOrderSync(payload);
    } catch (err) {
      console.error(
        `[odooSync] Order sync failed for ${payload.orderId}:`,
        err,
      );
      const errorMessage = err instanceof Error ? err.message : String(err);
      try {
        await prisma.order.update({
          where: { id: payload.orderId },
          data: {
            odooStatusSale: payload.enableSale ? "failed" : "skipped",
            odooStatusPos: payload.enablePos ? "failed" : "skipped",
            odooSyncAttempts: { increment: 1 },
            odooSyncLastError: errorMessage.substring(0, 500),
            odooSyncLastAttemptAt: new Date(),
          },
        });
      } catch (updateErr) {
        console.error(`[odooSync] Failed to update order status:`, updateErr);
      }
    }
  });
}

export function startOdooWorker() {
  return createOdooWorker(async (job) => {
    await processOrderSync(job.data);
  });
}

async function processOrderSync(payload: OrderSyncPayload): Promise<void> {
  console.log(`[odooSync] Processing sync for order ${payload.orderId}`);

  if (!isOdooConfigured()) {
    console.warn(
      `[odooSync] Odoo not configured, skipping sync for order ${payload.orderId}`,
    );
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

  // For online payments, only sync if payment is confirmed
  // Cash payments (COD) can sync immediately
  const isCashPayment = order.paymentMethod === "CASH";
  const isPaid = order.paymentStatus === "PAID";

  if (!isCashPayment && !isPaid) {
    console.log(
      `[odooSync] Order ${payload.orderId} payment not confirmed (${order.paymentStatus}), skipping sync`,
    );
    return;
  }

  const client = createOdooClient();
  if (!client) {
    console.error(
      `[odooSync] Failed to create Odoo client for order ${payload.orderId}`,
    );
    await prisma.order.update({
      where: { id: payload.orderId },
      data: {
        odooStatusSale: payload.enableSale ? "failed" : "skipped",
        odooStatusPos: payload.enablePos ? "failed" : "skipped",
      },
    });
    return;
  }

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
      attributes: it.attributes || undefined,
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
      console.log(`[odooSync] Creating sale order for ${payload.orderId}`);
      saleId = await client.createSaleOrderFromWebsiteOrder(
        orderForOdoo as any,
        payload.partner,
      );
      console.log(
        `[odooSync] Sale order created: ${saleId} for order ${payload.orderId}`,
      );
      if (payload.autoConfirm && saleId) {
        await client.confirmSaleOrder(saleId).catch(() => null);
        console.log(`[odooSync] Sale order ${saleId} confirmed`);
      }
    }
    if (payload.enablePos) {
      console.log(`[odooSync] Creating POS order for ${payload.orderId}`);
      posOrderId = await client.createPosOrderFromWebsiteOrder(
        orderForOdoo as any,
        payload.partner,
        {
          posConfigId: payload.posConfigId,
          posConfigName: payload.posConfigName,
          customerNotePerLine: payload.customerNotePerLine,
        },
      );
      console.log(
        `[odooSync] POS order created: ${posOrderId} for order ${payload.orderId}`,
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
        // Reset retry tracking on success
        odooSyncAttempts: { increment: 1 },
        odooSyncLastError: null,
        odooSyncLastAttemptAt: new Date(),
      },
    });

    if (order.userId) {
      try {
        const { awardOrderPoints } = await import("@/server/services/loyalty");
        await awardOrderPoints(order.id, order.userId);
      } catch (rewardErr) {
        // Non-blocking: order sync success should not fail because rewards failed.
        console.error(
          `[odooSync] Failed to award loyalty points for ${payload.orderId}:`,
          rewardErr,
        );
      }
    }

    console.log(
      `[odooSync] Order ${payload.orderId} sync completed successfully`,
    );
  } catch (err) {
    console.error(`[odooSync] Order ${payload.orderId} sync failed:`, err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    await prisma.order.update({
      where: { id: order.id },
      data: {
        odooStatusSale: payload.enableSale ? "failed" : "skipped",
        odooStatusPos: payload.enablePos ? "failed" : "skipped",
        odooSyncAttempts: { increment: 1 },
        odooSyncLastError: errorMessage.substring(0, 500),
        odooSyncLastAttemptAt: new Date(),
      },
    });
    throw err;
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/server/db/client";
import {
  createOdooClient,
  isOdooConfigured,
} from "@/server/utils/odooClient";
import { OrderStatus } from "@/types";
import { odooQueue, type OdooJobData, createOdooWorker } from "@/server/queue/odooQueue";

export type OrderSyncPayload = OdooJobData;

/**
 * Enqueue order sync to Odoo
 * 
 * Strategy:
 * 1. If Redis queue is available: Queue the job (preferred - async, retryable)
 * 2. If Redis queue unavailable: Run inline sync (fallback - synchronous)
 * 
 * In serverless environments, the fallback ensures orders still sync even if
 * the worker process isn't running.
 */
export async function enqueueOrderSync(payload: OrderSyncPayload): Promise<void> {
  const isServerlessEnv = process.env.VERCEL === "1" || process.env.NETLIFY === "true";
  
  // Try to use queue if available
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
      
      // In serverless, also run inline sync as backup
      // This ensures sync happens even if worker fails to process the queue
      // We check order status first to avoid unnecessary duplicate syncs
      if (isServerlessEnv) {
        console.log(`[odooSync] Setting up backup inline sync for order ${payload.orderId} (serverless safety net)`);
        // Run backup sync check immediately (non-blocking) - doesn't await, runs in background
        // This works in serverless because it starts executing before the function terminates
        // We check if order was already synced first to avoid unnecessary work
        (async () => {
          try {
            // Use process.nextTick to run in next event loop iteration (still within execution context)
            // This gives the queue a tiny chance to process first, but still runs before function terminates
            await new Promise<void>((resolve) => {
              if (typeof process !== "undefined" && process.nextTick) {
                process.nextTick(() => resolve());
              } else {
                // Fallback for environments without process.nextTick
                setImmediate(() => resolve());
              }
            });
            
            // Quick check: was order already synced by queue?
            const order = await prisma.order.findUnique({
              where: { id: payload.orderId },
              select: { odooStatusSale: true, saleOrderId: true },
            });
            
            // Only run backup if order is still pending and not synced
            // This prevents unnecessary duplicate syncs if queue processed it quickly
            if (order && (order.odooStatusSale === "pending" || order.odooStatusSale === null) && !order.saleOrderId) {
              console.log(`[odooSync] Running backup inline sync for order ${payload.orderId} (queue may not process in time)`);
              // Odoo sync is idempotent, so if queue processes it during this sync, it will just return existing order
              await processOrderSync(payload);
            } else if (order?.saleOrderId) {
              console.log(`[odooSync] Order ${payload.orderId} already synced by queue, skipping backup`);
            }
          } catch (err) {
            // Only log real errors, don't throw - queue sync may still succeed
            console.error(`[odooSync] Backup inline sync failed for ${payload.orderId}:`, err);
          }
        })(); // IIFE to run async function immediately
      }
      
      return;
    } catch (error) {
      console.error(`[odooSync] Failed to queue order ${payload.orderId}, falling back to inline sync:`, error);
      // Fall through to inline sync
    }
  }

  // Fallback: Run sync inline (fire-and-forget)
  // This ensures orders sync even if Redis/queue is unavailable
  // In serverless, this runs in the same function execution
  console.warn(`[odooSync] Queue unavailable, running sync inline for order ${payload.orderId}`);
  
  // Use setImmediate to avoid blocking the response
  // In serverless, this ensures the HTTP response is sent before sync starts
  setImmediate(async () => {
    try {
      await processOrderSync(payload);
    } catch (err) {
      console.error(`[odooSync] Order sync failed for ${payload.orderId}:`, err);
      // Ensure order status is updated even on error
      try {
        await prisma.order.update({
          where: { id: payload.orderId },
          data: {
            odooStatusSale: payload.enableSale ? "failed" : "skipped",
            odooStatusPos: payload.enablePos ? "failed" : "skipped",
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
    console.warn(`[odooSync] Odoo not configured, skipping sync for order ${payload.orderId}`);
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
  if (!client) {
    console.error(`[odooSync] Failed to create Odoo client for order ${payload.orderId}`);
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
      console.log(`[odooSync] Sale order created: ${saleId} for order ${payload.orderId}`);
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
      console.log(`[odooSync] POS order created: ${posOrderId} for order ${payload.orderId}`);
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
    console.log(`[odooSync] Order ${payload.orderId} sync completed successfully`);
  } catch (err) {
    console.error(`[odooSync] Order ${payload.orderId} sync failed:`, err);
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


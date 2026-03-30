/**
 * Cron endpoint to retry failed Odoo syncs
 *
 * Schedule: Every 5 minutes (Vercel Cron)
 *
 * Logic:
 * 1. Find orders with failed Odoo sync (odooStatusSale/Pos = "failed")
 * 2. Filter: created within last 30 minutes
 * 3. Filter: attempts < 5 (max retries)
 * 4. Retry sync for each order
 * 5. If still failing after 30 min: create a system notification note (once)
 */

import { NextRequest } from "next/server";
import { prisma } from "@/server/db/client";
import {
  jsonResponse,
  successResponse,
  errorResponse,
} from "@/server/utils/apiHelpers";
import { enqueueOrderSync } from "@/server/services/odooSync";

const MAX_RETRY_ATTEMPTS = 5;
const MAX_RETRY_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

function appendSystemNote(existing: string | null, line: string): string {
  const current = existing?.trim();
  return current ? `${current}\n${line}` : line;
}

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (Vercel Cron sends this header) or admin token (GitHub Actions)
    const authHeader = request.headers.get("authorization");
    const adminToken = request.headers.get("x-admin-token");
    const cronSecret = process.env.CRON_SECRET;
    const expectedAdminToken = process.env.ADMIN_TOKEN;

    // Allow either CRON_SECRET (Vercel) or ADMIN_TOKEN (GitHub Actions)
    const isAuthorized =
      (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
      (expectedAdminToken && adminToken === expectedAdminToken);

    if (!isAuthorized) {
      return jsonResponse(errorResponse("Unauthorized"), 401);
    }

    console.log("[cron:retry-odoo-sync] Starting Odoo sync retry job");

    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - MAX_RETRY_WINDOW_MS);

    // Find orders that need retry
    const ordersToRetry = await prisma.order.findMany({
      where: {
        OR: [{ odooStatusSale: "failed" }, { odooStatusPos: "failed" }],
        createdAt: {
          gte: thirtyMinutesAgo, // Only retry orders from last 30 min
        },
        odooSyncAttempts: {
          lt: MAX_RETRY_ATTEMPTS, // Haven't exceeded max attempts
        },
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
        address: true,
      },
      orderBy: {
        createdAt: "asc", // Oldest first
      },
      take: 20, // Process max 20 orders per cron run
    });

    console.log(
      `[cron:retry-odoo-sync] Found ${ordersToRetry.length} orders to retry`,
    );

    const results = {
      retried: 0,
      notified: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const order of ordersToRetry) {
      try {
        const orderAge = now.getTime() - order.createdAt.getTime();
        const isNearDeadline = orderAge >= MAX_RETRY_WINDOW_MS - 5 * 60 * 1000; // Within 5 min of 30-min deadline

        // If order is near deadline and not yet notified, create a system notification note.
        if (isNearDeadline && !order.odooSyncNotifiedAt) {
          const line = `[SYSTEM] Odoo sync is delayed for order ${order.clientOrderRef || order.id}. The order is saved and queued for retry. (${new Date().toISOString()})`;

          await prisma.order.update({
            where: { id: order.id },
            data: {
              odooSyncNotifiedAt: now,
              notes: appendSystemNote(order.notes, line),
            },
          });

          results.notified++;
          console.log(
            `[cron:retry-odoo-sync] Created system notification for order ${order.id}`,
          );
        }

        // Retry sync
        const enableSale = order.odooStatusSale === "failed";
        const enablePos = order.odooStatusPos === "failed";

        // Build address info if available
        let addressInfo: {
          street?: string;
          apartment?: string;
          city?: string;
          state?: string;
          zip?: string;
          phone?: string;
          notes?: string;
        } | null = null;
        if (order.address) {
          addressInfo = {
            street: order.address.street ?? undefined,
            apartment: order.address.apartment ?? undefined,
            city: order.address.city ?? undefined,
            state: order.address.state ?? undefined,
            zip: order.address.zipCode ?? undefined,
            phone: order.address.phone ?? undefined,
            notes: order.address.notes ?? undefined,
          };
        }

        await enqueueOrderSync({
          orderId: order.id,
          clientOrderRef: order.clientOrderRef,
          partner: {
            name: order.user?.name || "Website Customer",
            email: order.user?.email,
            phone: addressInfo?.phone,
            street: addressInfo?.street,
            city: addressInfo?.city,
            zip: addressInfo?.zip,
          },
          enableSale,
          autoConfirm: true,
          enablePos,
        });

        results.retried++;
        console.log(
          `[cron:retry-odoo-sync] Retried sync for order ${order.id} (attempt ${order.odooSyncAttempts + 1})`,
        );
      } catch (err) {
        const errorMsg = `Order ${order.id}: ${err instanceof Error ? err.message : String(err)}`;
        results.errors.push(errorMsg);
        console.error(
          `[cron:retry-odoo-sync] Error retrying order ${order.id}:`,
          err,
        );
      }
    }

    // Find orders that exceeded the 30-min window and mark them as permanently failed
    const expiredOrders = await prisma.order.findMany({
      where: {
        OR: [{ odooStatusSale: "failed" }, { odooStatusPos: "failed" }],
        createdAt: {
          lt: thirtyMinutesAgo, // Older than 30 minutes
        },
      },
      select: {
        id: true,
        clientOrderRef: true,
        notes: true,
        odooStatusSale: true,
        odooStatusPos: true,
        odooSyncNotifiedAt: true,
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
      take: 10,
    });

    // Create system notification for expired orders if not already notified
    for (const order of expiredOrders) {
      if (!order.odooSyncNotifiedAt) {
        try {
          const line = `[SYSTEM] Odoo sync permanently failed for order ${order.clientOrderRef || order.id}. Manual intervention is required. (${new Date().toISOString()})`;

          await prisma.order.update({
            where: { id: order.id },
            data: {
              notes: appendSystemNote(order.notes, line),
              odooSyncNotifiedAt: now,
              // Mark as permanently failed (manual intervention needed)
              odooStatusSale:
                order.odooStatusSale === "failed"
                  ? "failed_permanent"
                  : order.odooStatusSale,
              odooStatusPos:
                order.odooStatusPos === "failed"
                  ? "failed_permanent"
                  : order.odooStatusPos,
            },
          });

          results.notified++;
          console.log(
            `[cron:retry-odoo-sync] Created system notification for expired order ${order.id}`,
          );
        } catch (notifyErr) {
          console.error(
            `[cron:retry-odoo-sync] Failed to create system notification for expired order ${order.id}:`,
            notifyErr,
          );
        }
      }
    }

    console.log(
      `[cron:retry-odoo-sync] Completed: ${results.retried} retried, ${results.notified} notified, ${results.errors.length} errors`,
    );

    return jsonResponse(
      successResponse(results, "Odoo sync retry job completed"),
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to run retry job";
    console.error("[cron:retry-odoo-sync] Job failed:", err);
    return jsonResponse(errorResponse(msg), 500);
  }
}

import { NextRequest } from "next/server";
import { prisma } from "@/server/db/client";
import {
  jsonResponse,
  successResponse,
  errorResponse,
} from "@/server/utils/apiHelpers";
import { sendDailySummaryEmail } from "./email";
import {
  calculateStockLevel,
  type AuditWarning,
} from "@/lib/inventory/stockCalculations";

const ADMIN_EMAIL = "contact@jointhedragons.com";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return jsonResponse(errorResponse("Unauthorized"), 401);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [items, movements, todayCounts, todayTransfers, todayWaste, users] =
      await Promise.all([
        prisma.inventoryItem.findMany({
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            nameAr: true,
            section: true,
            unit: true,
            unitAr: true,
            minimumStock: true,
            alertLevel: true,
            maximumStock: true,
            backupThreshold: true,
            preferredSupplier: true,
            packSize: true,
          },
        }),
        prisma.stockMovement.groupBy({
          by: ["itemId", "location"],
          _sum: { quantity: true },
        }),
        prisma.inventoryCount.count({
          where: {
            date: { gte: today, lt: tomorrow },
            status: "submitted",
          },
        }),
        prisma.stockTransfer.count({
          where: { createdAt: { gte: today, lt: tomorrow } },
        }),
        prisma.wasteEntry.count({
          where: { date: { gte: today, lt: tomorrow } },
        }),
        prisma.user.findMany({
          where: {
            role: { in: ["admin", "manager", "barista", "head_barista"] },
            status: { not: "suspended" },
          },
          select: { email: true, name: true },
        }),
      ]);

    const stockMap = new Map<string, number>();
    for (const m of movements) {
      const qty = m._sum.quantity ? Number(m._sum.quantity) : 0;
      stockMap.set(m.itemId, (stockMap.get(m.itemId) || 0) + qty);
    }

    const orderNow: Array<{
      nameAr: string;
      name: string;
      totalQty: number;
      unitAr: string;
      unit: string;
      section: string;
      preferredSupplier: string | null;
      minimumStock: number;
      targetStock: number;
      suggestedOrderQty: number;
      backupThreshold: number;
      daysRemaining: number | null;
      auditWarnings: AuditWarning[];
      reason: "minimum_stock" | "backup_threshold" | "empty";
    }> = [];

    for (const item of items) {
      const total = stockMap.get(item.id) || 0;
      const calculation = calculateStockLevel({
        unit: item.unit,
        packSize: item.packSize,
        storageQty: total,
        barQty: 0,
        minimumStock: Number(item.minimumStock),
        alertLevel: Number(item.alertLevel),
        maximumStock: Number(item.maximumStock),
        backupThreshold: Number(item.backupThreshold),
        lastCountedAt: null,
      });
      if (
        calculation.totalStatus === "empty" ||
        calculation.totalStatus === "order_now" ||
        calculation.totalStatus === "backup_order"
      ) {
        orderNow.push({
          nameAr: item.nameAr,
          name: item.name,
          totalQty: calculation.totalQty,
          unitAr: item.unitAr,
          unit: item.unit,
          section: item.section,
          preferredSupplier: item.preferredSupplier,
          minimumStock: calculation.minimumStock,
          targetStock: calculation.targetStock,
          suggestedOrderQty: calculation.suggestedOrderQty,
          backupThreshold: calculation.backupThreshold,
          daysRemaining: calculation.daysRemaining,
          auditWarnings: calculation.auditWarnings,
          reason:
            calculation.totalStatus === "empty"
              ? "empty"
              : calculation.totalStatus === "order_now"
                ? "minimum_stock"
                : "backup_threshold",
        });
      }
    }

    orderNow.sort((a, b) => a.totalQty - b.totalQty);

    const recipients = new Set<string>();
    recipients.add(ADMIN_EMAIL);
    for (const u of users) {
      if (u.email) recipients.add(u.email);
    }

    const summary = {
      date: today.toISOString().split("T")[0],
      orderNow,
      todayCounts,
      todayTransfers,
      todayWaste,
    };

    let sent = 0;
    for (const email of recipients) {
      try {
        await sendDailySummaryEmail(email, summary);
        sent++;
      } catch (e) {
        console.error(`[daily-summary] Failed to send to ${email}:`, e);
      }
    }

    console.log(
      `[daily-summary] Sent to ${sent}/${recipients.size} recipients. ${orderNow.length} items to order.`,
    );

    return jsonResponse(
      successResponse({
        sent,
        total: recipients.size,
        orderNowCount: orderNow.length,
      }),
    );
  } catch (error) {
    console.error("[daily-summary] Error:", error);
    return jsonResponse(errorResponse("Internal server error"), 500);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";
import {
  calculateStockLevel,
  type AuditWarning,
  type BarStatus,
  type StatusReason,
  type TotalStatus,
} from "@/lib/inventory/stockCalculations";

interface StockLevel {
  itemId: string;
  name: string;
  nameAr: string;
  section: string;
  preferredSupplier: string | null;
  unit: string;
  unitAr: string;
  storageQty: number;
  barQty: number;
  totalQty: number;
  minimumStock: number;
  alertLevel: number;
  targetStock: number;
  backupThreshold: number;
  barStatus: BarStatus;
  totalStatus: TotalStatus;
  fallbackThreshold: number;
  statusReason: StatusReason;
  suggestedOrderQty: number;
  averageDailyUsage: number;
  daysRemaining: number | null;
  lastCountedAt: string | null;
  auditWarnings: AuditWarning[];
}

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ["admin", "manager", "head_barista"]);

    const sectionFilter = req.nextUrl.searchParams.get("section");
    const statusFilter = req.nextUrl.searchParams.get("status");
    const supplierFilter = req.nextUrl.searchParams.get("supplier");
    const missingMinimumOnly =
      req.nextUrl.searchParams.get("missingMinimum") === "true";
    const actionableOnly =
      req.nextUrl.searchParams.get("actionable") === "true";

    const itemWhere: Record<string, unknown> = { isActive: true };
    if (sectionFilter) itemWhere.section = sectionFilter;
    if (supplierFilter) itemWhere.preferredSupplier = supplierFilter;
    if (missingMinimumOnly) itemWhere.minimumStock = { lte: 0 };

    const items = await prisma.inventoryItem.findMany({
      where: itemWhere,
      select: {
        id: true,
        name: true,
        nameAr: true,
        section: true,
        unit: true,
        unitAr: true,
        packSize: true,
        minimumStock: true,
        alertLevel: true,
        maximumStock: true,
        backupThreshold: true,
        preferredSupplier: true,
        sortOrder: true,
      },
      orderBy: [{ section: "asc" }, { sortOrder: "asc" }],
    });

    const usageSince = new Date();
    usageSince.setDate(usageSince.getDate() - 14);

    const [movements, usageMovements, countEntries] = await Promise.all([
      prisma.stockMovement.groupBy({
        by: ["itemId", "location"],
        _sum: { quantity: true },
      }),
      prisma.stockMovement.groupBy({
        by: ["itemId"],
        where: {
          createdAt: { gte: usageSince },
          quantity: { lt: 0 },
          type: { notIn: ["transfer_out"] },
        },
        _sum: { quantity: true },
      }),
      prisma.inventoryCountEntry.findMany({
        where: { count: { status: "submitted" } },
        select: {
          itemId: true,
          count: { select: { submittedAt: true, date: true } },
        },
      }),
    ]);

    const stockMap = new Map<string, { storage: number; bar: number }>();
    for (const m of movements) {
      const key = m.itemId;
      if (!stockMap.has(key)) stockMap.set(key, { storage: 0, bar: 0 });
      const entry = stockMap.get(key)!;
      const qty = m._sum.quantity ? Number(m._sum.quantity) : 0;
      if (m.location === "storage") entry.storage += qty;
      if (m.location === "bar") entry.bar += qty;
    }

    const usageMap = new Map<string, number>();
    for (const m of usageMovements) {
      usageMap.set(m.itemId, Math.abs(Number(m._sum.quantity || 0)) / 14);
    }

    const lastCountedMap = new Map<string, Date>();
    for (const entry of countEntries) {
      const countedAt = entry.count.submittedAt ?? entry.count.date;
      const current = lastCountedMap.get(entry.itemId);
      if (!current || countedAt > current) {
        lastCountedMap.set(entry.itemId, countedAt);
      }
    }

    const levels: StockLevel[] = items.map((item) => {
      const stock = stockMap.get(item.id) || { storage: 0, bar: 0 };
      const lastCountedAt = lastCountedMap.get(item.id) ?? null;
      const calculation = calculateStockLevel({
        unit: item.unit,
        packSize: item.packSize,
        storageQty: stock.storage,
        barQty: stock.bar,
        minimumStock: Number(item.minimumStock),
        alertLevel: Number(item.alertLevel),
        maximumStock: Number(item.maximumStock),
        backupThreshold: Number(item.backupThreshold),
        averageDailyUsage: usageMap.get(item.id) || 0,
        lastCountedAt,
      });

      return {
        itemId: item.id,
        name: item.name,
        nameAr: item.nameAr,
        section: item.section,
        preferredSupplier: item.preferredSupplier,
        unit: item.unit,
        unitAr: item.unitAr,
        storageQty: calculation.storageQty,
        barQty: calculation.barQty,
        totalQty: calculation.totalQty,
        minimumStock: calculation.minimumStock,
        alertLevel: calculation.alertLevel,
        targetStock: calculation.targetStock,
        backupThreshold: calculation.backupThreshold,
        barStatus: calculation.barStatus,
        totalStatus: calculation.totalStatus,
        fallbackThreshold: calculation.fallbackThreshold,
        statusReason: calculation.statusReason,
        suggestedOrderQty: calculation.suggestedOrderQty,
        averageDailyUsage: calculation.averageDailyUsage,
        daysRemaining: calculation.daysRemaining,
        lastCountedAt: lastCountedAt ? lastCountedAt.toISOString() : null,
        auditWarnings: calculation.auditWarnings,
      };
    });

    let filteredLevels = levels;
    if (statusFilter) {
      filteredLevels = filteredLevels.filter(
        (l) =>
          l.totalStatus === statusFilter ||
          l.barStatus === statusFilter ||
          (statusFilter === "audit" && l.auditWarnings.length > 0),
      );
    }
    if (actionableOnly) {
      filteredLevels = filteredLevels.filter(
        (l) =>
          l.totalStatus === "empty" ||
          l.totalStatus === "order_now" ||
          l.totalStatus === "backup_order" ||
          l.auditWarnings.length > 0,
      );
    }

    const alerts = filteredLevels.filter(
      (l) => l.totalStatus !== "ok" || l.barStatus !== "ok",
    );
    const suppliers = Array.from(
      new Set(levels.map((l) => l.preferredSupplier).filter(Boolean)),
    ).sort();

    return NextResponse.json({
      success: true,
      data: {
        levels: filteredLevels,
        alerts,
        totalItems: levels.length,
        suppliers,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Authentication")) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED" },
        { status: 401 },
      );
    }
    if (error instanceof Error && error.message.includes("role")) {
      return NextResponse.json(
        { success: false, error: "FORBIDDEN" },
        { status: 403 },
      );
    }
    console.error("[stock] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

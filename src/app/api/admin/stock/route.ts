import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";
import { Decimal } from "@prisma/client/runtime/library";

interface StockLevel {
  itemId: string;
  name: string;
  nameAr: string;
  section: string;
  unit: string;
  unitAr: string;
  storageQty: number;
  barQty: number;
  totalQty: number;
  minimumStock: number;
  alertLevel: number;
  barStatus: "ok" | "bar_empty" | "empty";
  totalStatus: "ok" | "warning" | "order_now" | "empty";
}

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ["admin", "manager"]);

    const sectionFilter = req.nextUrl.searchParams.get("section");

    const itemWhere: Record<string, unknown> = { isActive: true };
    if (sectionFilter) itemWhere.section = sectionFilter;

    const items = await prisma.inventoryItem.findMany({
      where: itemWhere,
      select: {
        id: true,
        name: true,
        nameAr: true,
        section: true,
        unit: true,
        unitAr: true,
        minimumStock: true,
        alertLevel: true,
        sortOrder: true,
      },
      orderBy: [{ section: "asc" }, { sortOrder: "asc" }],
    });

    const movements = await prisma.stockMovement.groupBy({
      by: ["itemId", "location"],
      _sum: { quantity: true },
    });

    const stockMap = new Map<string, { storage: number; bar: number }>();
    for (const m of movements) {
      const key = m.itemId;
      if (!stockMap.has(key)) stockMap.set(key, { storage: 0, bar: 0 });
      const entry = stockMap.get(key)!;
      const qty = m._sum.quantity ? Number(m._sum.quantity) : 0;
      if (m.location === "storage") entry.storage += qty;
      if (m.location === "bar") entry.bar += qty;
    }

    const levels: StockLevel[] = items.map((item) => {
      const stock = stockMap.get(item.id) || { storage: 0, bar: 0 };
      const total = stock.storage + stock.bar;
      const minStock = Number(item.minimumStock);
      const alert = Number(item.alertLevel);

      let barStatus: StockLevel["barStatus"] = "ok";
      if (stock.bar <= 0 && total <= 0) barStatus = "empty";
      else if (stock.bar <= 0 && total > 0) barStatus = "bar_empty";

      let totalStatus: StockLevel["totalStatus"] = "ok";
      if (total <= 0) totalStatus = "empty";
      else if (total <= minStock) totalStatus = "order_now";
      else if (total <= alert) totalStatus = "warning";

      return {
        itemId: item.id,
        name: item.name,
        nameAr: item.nameAr,
        section: item.section,
        unit: item.unit,
        unitAr: item.unitAr,
        storageQty: Math.round(stock.storage * 100) / 100,
        barQty: Math.round(stock.bar * 100) / 100,
        totalQty: Math.round(total * 100) / 100,
        minimumStock: minStock,
        alertLevel: alert,
        barStatus,
        totalStatus,
      };
    });

    const alerts = levels.filter(
      (l) => l.totalStatus !== "ok" || l.barStatus !== "ok",
    );

    return NextResponse.json({
      success: true,
      data: { levels, alerts, totalItems: levels.length },
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

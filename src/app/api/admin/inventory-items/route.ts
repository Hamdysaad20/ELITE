import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, [
      "admin",
      "manager",
      "barista",
      "head_barista",
    ]);

    const location = req.nextUrl.searchParams.get("location");
    const activeOnly = req.nextUrl.searchParams.get("active") !== "false";

    const where: Record<string, unknown> = {};
    if (activeOnly) where.isActive = true;
    if (location === "bar") where.isDailyBarCounted = true;
    if (location === "storage") where.isStorageCounted = true;

    const items = await prisma.inventoryItem.findMany({
      where,
      select: {
        id: true,
        name: true,
        nameAr: true,
        section: true,
        subsection: true,
        unit: true,
        unitAr: true,
        countMethod: true,
        packSize: true,
        isDailyBarCounted: true,
        isStorageCounted: true,
        sortOrder: true,
        minimumStock: true,
        alertLevel: true,
        maximumStock: true,
      },
      orderBy: [{ section: "asc" }, { sortOrder: "asc" }],
    });

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    if (error instanceof Error && error.message.includes("role")) {
      return NextResponse.json(
        { success: false, error: "FORBIDDEN" },
        { status: 403 },
      );
    }
    if (error instanceof Error && error.message.includes("Authentication")) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED" },
        { status: 401 },
      );
    }
    console.error("[inventory-items] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

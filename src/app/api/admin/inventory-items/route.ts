import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";

const updateItemSchema = z.object({
  itemId: z.string().uuid(),
  minimumStock: z.number().min(0).optional(),
  alertLevel: z.number().min(0).optional(),
  maximumStock: z.number().min(0).optional(),
  backupThreshold: z.number().min(0).optional(),
  preferredSupplier: z.string().trim().nullable().optional(),
  reason: z.string().trim().optional(),
});

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
        backupThreshold: true,
        preferredSupplier: true,
        ruleChangeLogs: {
          take: 3,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            field: true,
            oldValue: true,
            newValue: true,
            reason: true,
            createdAt: true,
            changedBy: { select: { name: true, email: true } },
          },
        },
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

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireRole(req, ["admin", "manager"]);
    const body = await req.json();
    const parsed = updateItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const {
      itemId,
      minimumStock,
      alertLevel,
      maximumStock,
      backupThreshold,
      preferredSupplier,
      reason,
    } = parsed.data;

    const existing = await prisma.inventoryItem.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        minimumStock: true,
        alertLevel: true,
        maximumStock: true,
        backupThreshold: true,
        preferredSupplier: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 },
      );
    }

    const data = {
      ...(minimumStock !== undefined ? { minimumStock } : {}),
      ...(alertLevel !== undefined ? { alertLevel } : {}),
      ...(maximumStock !== undefined ? { maximumStock } : {}),
      ...(backupThreshold !== undefined ? { backupThreshold } : {}),
      ...(preferredSupplier !== undefined
        ? { preferredSupplier: preferredSupplier || null }
        : {}),
    };

    const item = await prisma.$transaction(async (tx) => {
      const updated = await tx.inventoryItem.update({
        where: { id: itemId },
        data,
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
          backupThreshold: true,
          preferredSupplier: true,
        },
      });

      const changes = (
        [
          ["minimumStock", minimumStock],
          ["alertLevel", alertLevel],
          ["maximumStock", maximumStock],
          ["backupThreshold", backupThreshold],
          [
            "preferredSupplier",
            preferredSupplier === undefined
              ? undefined
              : preferredSupplier || null,
          ],
        ] as const
      )
        .filter(([, value]) => value !== undefined)
        .filter(([field, value]) => {
          const oldValue = existing[field as keyof typeof existing];
          return String(oldValue ?? "") !== String(value ?? "");
        });

      if (changes.length > 0) {
        await tx.inventoryRuleChangeLog.createMany({
          data: changes.map(([field, value]) => ({
            itemId,
            changedById: user.id,
            field,
            oldValue: String(existing[field as keyof typeof existing] ?? ""),
            newValue: String(value ?? ""),
            reason: reason || null,
          })),
        });
      }

      return updated;
    });

    return NextResponse.json({ success: true, data: item });
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
    console.error("[inventory-items] PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

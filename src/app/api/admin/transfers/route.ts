import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";

const transferSchema = z.object({
  itemId: z.string().uuid(),
  packsCount: z.number().int().min(0).default(0),
  quantity: z.number().min(0).default(0),
  unitUsed: z.string().min(1),
  note: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ["admin", "manager", "barista"]);
    const dateParam = req.nextUrl.searchParams.get("date");
    const date = dateParam ? new Date(dateParam) : new Date();
    const dateOnly = new Date(date.toISOString().split("T")[0]);

    const transfers = await prisma.stockTransfer.findMany({
      where: { date: dateOnly },
      select: {
        id: true,
        date: true,
        item: {
          select: {
            name: true,
            nameAr: true,
            unit: true,
            unitAr: true,
            packSize: true,
          },
        },
        packsCount: true,
        quantity: true,
        totalUnits: true,
        unitUsed: true,
        note: true,
        transferredBy: { select: { name: true } },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: transfers });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Authentication")) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED" },
        { status: 401 },
      );
    }
    console.error("[transfers] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, ["admin", "manager", "barista"]);
    const body = await req.json();
    const parsed = transferSchema.safeParse(body);

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

    const { itemId, packsCount, quantity, unitUsed, note } = parsed.data;
    const today = new Date(new Date().toISOString().split("T")[0]);

    const item = await prisma.inventoryItem.findUnique({
      where: { id: itemId },
      select: { packSize: true },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 },
      );
    }

    const totalUnits = quantity || packsCount * item.packSize;

    if (totalUnits <= 0) {
      return NextResponse.json(
        { success: false, error: "Transfer quantity must be > 0" },
        { status: 400 },
      );
    }

    const currentShift = await prisma.shiftSession.findFirst({
      where: { date: today, status: "open" },
      select: { id: true },
      orderBy: { openedAt: "desc" },
    });

    const [transfer] = await prisma.$transaction([
      prisma.stockTransfer.create({
        data: {
          date: today,
          shiftSessionId: currentShift?.id,
          itemId,
          packsCount,
          quantity,
          totalUnits,
          unitUsed,
          note,
          transferredById: user.id,
        },
      }),
      prisma.stockMovement.create({
        data: {
          itemId,
          location: "storage",
          type: "transfer_out",
          quantity: -totalUnits,
          referenceType: "transfer",
          recordedById: user.id,
        },
      }),
      prisma.stockMovement.create({
        data: {
          itemId,
          location: "bar",
          type: "transfer_in",
          quantity: totalUnits,
          referenceType: "transfer",
          recordedById: user.id,
        },
      }),
    ]);

    return NextResponse.json(
      { success: true, data: transfer },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("Authentication")) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED" },
        { status: 401 },
      );
    }
    console.error("[transfers] POST error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";

const wasteSchema = z.object({
  itemId: z.string().uuid(),
  quantity: z.number().positive(),
  location: z.enum(["bar", "storage"]),
  category: z.enum([
    "spilled",
    "expired",
    "damaged",
    "quality",
    "staff_error",
    "overprep",
    "other",
  ]),
  reason: z.string().min(3),
});

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ["admin", "manager", "barista", "head_barista"]);
    const dateParam = req.nextUrl.searchParams.get("date");
    const date = dateParam ? new Date(dateParam) : new Date();
    const dateOnly = new Date(date.toISOString().split("T")[0]);

    const entries = await prisma.wasteEntry.findMany({
      where: { date: dateOnly },
      select: {
        id: true,
        date: true,
        location: true,
        item: {
          select: { name: true, nameAr: true, unit: true, unitAr: true },
        },
        quantity: true,
        category: true,
        reason: true,
        recordedBy: { select: { name: true } },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: entries });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Authentication")) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED" },
        { status: 401 },
      );
    }
    console.error("[waste] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, [
      "admin",
      "manager",
      "barista",
      "head_barista",
    ]);
    const body = await req.json();
    const parsed = wasteSchema.safeParse(body);

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

    const { itemId, quantity, location, category, reason } = parsed.data;
    const today = new Date(new Date().toISOString().split("T")[0]);

    const currentShift = await prisma.shiftSession.findFirst({
      where: { date: today, status: "open" },
      select: { id: true },
      orderBy: { openedAt: "desc" },
    });

    const [entry] = await prisma.$transaction([
      prisma.wasteEntry.create({
        data: {
          date: today,
          shiftSessionId: currentShift?.id,
          location,
          itemId,
          quantity,
          category,
          reason,
          recordedById: user.id,
        },
      }),
      prisma.stockMovement.create({
        data: {
          itemId,
          location,
          type: "waste",
          quantity: -quantity,
          referenceType: "waste",
          recordedById: user.id,
        },
      }),
    ]);

    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Authentication")) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED" },
        { status: 401 },
      );
    }
    console.error("[waste] POST error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

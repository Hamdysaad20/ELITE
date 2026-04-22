import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";
import { suggestShift } from "@/lib/inventory/constants";

const entrySchema = z.object({
  itemId: z.string().uuid(),
  packsCount: z.number().int().min(0).default(0),
  looseSingles: z.number().int().min(0).default(0),
  quantity: z.number().min(0).default(0),
});

const createCountSchema = z.object({
  location: z.enum(["bar", "storage"]),
  shiftConfirmed: z.enum(["morning", "evening"]),
  countType: z.enum(["regular", "audit", "correction"]).default("regular"),
  entries: z.array(entrySchema).min(1),
  notes: z.string().optional(),
  shortageNotes: z.string().optional(),
  wasteNotes: z.string().optional(),
  submit: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, [
      "admin",
      "manager",
      "barista",
      "head_barista",
    ]);
    const dateParam = req.nextUrl.searchParams.get("date");
    const location = req.nextUrl.searchParams.get("location") || "bar";
    const status = req.nextUrl.searchParams.get("status");
    const date = dateParam ? new Date(dateParam) : new Date();
    const dateOnly = new Date(date.toISOString().split("T")[0]);

    const where: Record<string, unknown> = { date: dateOnly, location };

    if (status === "draft") {
      where.status = "draft";
      where.countedById = user.id;
    }

    const counts = await prisma.inventoryCount.findMany({
      where,
      select: {
        id: true,
        date: true,
        shiftSuggested: true,
        shiftConfirmed: true,
        location: true,
        countType: true,
        status: true,
        notes: true,
        shortageNotes: true,
        wasteNotes: true,
        hasVarianceAlert: true,
        countedBy: { select: { name: true, email: true } },
        entries: {
          select: {
            id: true,
            itemId: true,
            packsCount: true,
            looseSingles: true,
            quantity: true,
            totalQuantity: true,
          },
        },
        submittedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: counts });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Authentication")) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED" },
        { status: 401 },
      );
    }
    console.error("[inventory] GET error:", error);
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
    const parsed = createCountSchema.safeParse(body);

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
      location,
      shiftConfirmed,
      countType,
      entries,
      notes,
      shortageNotes,
      wasteNotes,
      submit,
    } = parsed.data;
    const today = new Date(new Date().toISOString().split("T")[0]);

    const existingDraft = await prisma.inventoryCount.findFirst({
      where: {
        date: today,
        shiftConfirmed,
        location,
        countedById: user.id,
        countType,
        status: "draft",
      },
    });

    if (existingDraft) {
      await prisma.inventoryCountEntry.deleteMany({
        where: { countId: existingDraft.id },
      });

      const updated = await prisma.inventoryCount.update({
        where: { id: existingDraft.id },
        data: {
          notes,
          shortageNotes,
          wasteNotes,
          status: submit ? "submitted" : "draft",
          submittedAt: submit ? new Date() : null,
          entries: {
            create: entries.map((e) => {
              const item = {
                itemId: e.itemId,
                packsCount: e.packsCount,
                looseSingles: e.looseSingles,
                quantity: e.quantity,
                totalQuantity: 0,
              };
              item.totalQuantity =
                e.quantity || e.packsCount * 50 + e.looseSingles;
              return item;
            }),
          },
        },
        include: { entries: true },
      });

      return NextResponse.json({ success: true, data: updated, updated: true });
    }

    const existingSubmitted = await prisma.inventoryCount.findFirst({
      where: {
        date: today,
        shiftConfirmed,
        location,
        countedById: user.id,
        countType,
        status: { not: "draft" },
      },
    });

    if (existingSubmitted) {
      return NextResponse.json(
        { success: false, error: "Count already submitted for this shift" },
        { status: 409 },
      );
    }

    const count = await prisma.inventoryCount.create({
      data: {
        date: today,
        shiftSuggested: suggestShift(),
        shiftConfirmed,
        location,
        countType,
        countedById: user.id,
        status: submit ? "submitted" : "draft",
        submittedAt: submit ? new Date() : null,
        notes,
        shortageNotes,
        wasteNotes,
        entries: {
          create: entries.map((e) => ({
            itemId: e.itemId,
            packsCount: e.packsCount,
            looseSingles: e.looseSingles,
            quantity: e.quantity,
            totalQuantity: e.quantity || e.packsCount * 50 + e.looseSingles,
          })),
        },
      },
      include: { entries: true },
    });

    return NextResponse.json({ success: true, data: count }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Authentication")) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED" },
        { status: 401 },
      );
    }
    console.error("[inventory] POST error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

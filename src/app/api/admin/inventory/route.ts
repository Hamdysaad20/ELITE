import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";
import { suggestShift } from "@/lib/inventory/constants";
import { reconcileSubmittedInventoryCount } from "@/server/services/inventoryReconciliation";

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
        varianceNotes: true,
        correctionOfId: true,
        correctionOf: {
          select: {
            id: true,
            countedBy: { select: { name: true, email: true } },
            createdAt: true,
            submittedAt: true,
          },
        },
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
        overwriteLogs: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            reason: true,
            createdAt: true,
            overwrittenBy: { select: { name: true, email: true } },
          },
        },
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
    const canOverrideCounts = user.role === "head_barista";
    const today = new Date(new Date().toISOString().split("T")[0]);
    const itemPackSizes = new Map(
      (
        await prisma.inventoryItem.findMany({
          where: { id: { in: entries.map((entry) => entry.itemId) } },
          select: { id: true, packSize: true },
        })
      ).map((item) => [item.id, item.packSize]),
    );
    const entryCreates = entries.map((e) => {
      const packSize = itemPackSizes.get(e.itemId) || 1;
      return {
        itemId: e.itemId,
        packsCount: e.packsCount,
        looseSingles: e.looseSingles,
        quantity: e.quantity,
        totalQuantity: e.quantity || e.packsCount * packSize + e.looseSingles,
      };
    });

    const existingSubmitted = await prisma.inventoryCount.findFirst({
      where: {
        date: today,
        shiftConfirmed,
        location,
        status: { not: "draft" },
      },
      orderBy: { submittedAt: "desc" },
      select: { id: true, countedById: true },
    });

    const shouldOverride = submit && !!existingSubmitted && canOverrideCounts;

    if (existingSubmitted && !shouldOverride) {
      return NextResponse.json(
        { success: false, error: "Count already submitted for this shift" },
        { status: 409 },
      );
    }

    const effectiveCountType = shouldOverride ? "correction" : "regular";

    if (countType !== "regular" && !shouldOverride) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only regular counts are allowed. Head barista can submit an overwrite correction.",
        },
        { status: 400 },
      );
    }

    const existingDraft = await prisma.inventoryCount.findFirst({
      where: {
        date: today,
        shiftConfirmed,
        location,
        countedById: user.id,
        countType: "regular",
        status: "draft",
      },
    });

    if (existingDraft) {
      const previousEntries = await prisma.inventoryCountEntry.findMany({
        where: { countId: existingDraft.id },
        select: {
          itemId: true,
          packsCount: true,
          looseSingles: true,
          quantity: true,
          totalQuantity: true,
        },
      });

      await prisma.inventoryCountEntry.deleteMany({
        where: { countId: existingDraft.id },
      });

      const updated = await prisma.inventoryCount.update({
        where: { id: existingDraft.id },
        data: {
          notes,
          shortageNotes,
          wasteNotes,
          countType: shouldOverride ? "correction" : "regular",
          correctionOfId: shouldOverride ? existingSubmitted?.id : null,
          status: submit ? "submitted" : "draft",
          submittedAt: submit ? new Date() : null,
          entries: {
            create: entryCreates,
          },
        },
        include: { entries: true },
      });

      if (submit) {
        await reconcileSubmittedInventoryCount(updated.id, user.id);
      }

      await prisma.inventoryCountOverwriteLog.create({
        data: {
          countId: existingDraft.id,
          overwrittenById: user.id,
          reason:
            notes?.trim() ||
            shortageNotes?.trim() ||
            wasteNotes?.trim() ||
            null,
          previousSnapshot: {
            notes: existingDraft.notes,
            shortageNotes: existingDraft.shortageNotes,
            wasteNotes: existingDraft.wasteNotes,
            entries: previousEntries,
            status: existingDraft.status,
          },
          newSnapshot: {
            notes,
            shortageNotes,
            wasteNotes,
            entries: entryCreates,
            status: submit ? "submitted" : "draft",
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: updated,
        updated: true,
        overwrite: shouldOverride,
        overwrittenCountId: shouldOverride ? existingSubmitted?.id : null,
      });
    }

    const count = await prisma.inventoryCount.create({
      data: {
        date: today,
        shiftSuggested: suggestShift(),
        shiftConfirmed,
        location,
        countType: effectiveCountType,
        countedById: user.id,
        status: submit ? "submitted" : "draft",
        submittedAt: submit ? new Date() : null,
        correctionOfId: shouldOverride ? existingSubmitted?.id : null,
        notes,
        shortageNotes,
        wasteNotes,
        entries: {
          create: entryCreates,
        },
      },
      include: { entries: true },
    });

    if (submit) {
      await reconcileSubmittedInventoryCount(count.id, user.id);
    }

    return NextResponse.json(
      {
        success: true,
        data: count,
        overwrite: shouldOverride,
        overwrittenCountId: shouldOverride ? existingSubmitted?.id : null,
      },
      { status: 201 },
    );
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

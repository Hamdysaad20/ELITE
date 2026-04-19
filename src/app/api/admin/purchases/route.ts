import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";

const purchaseEntrySchema = z.object({
  itemId: z.string().uuid(),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
});

const purchaseSchema = z.object({
  supplierName: z.string().min(1),
  invoiceNumber: z.string().optional(),
  paymentMethod: z.enum(["cash", "transfer", "vodafone_cash", "deferred"]),
  notes: z.string().optional(),
  entries: z.array(purchaseEntrySchema).min(1),
});

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ["admin", "manager"]);

    const purchases = await prisma.purchase.findMany({
      select: {
        id: true,
        date: true,
        supplierName: true,
        invoiceNumber: true,
        paymentMethod: true,
        receiptStatus: true,
        totalAmount: true,
        notes: true,
        recordedBy: { select: { name: true } },
        entries: {
          select: {
            id: true,
            item: {
              select: { name: true, nameAr: true, unit: true, unitAr: true },
            },
            quantity: true,
            unitPrice: true,
            totalPrice: true,
            receivedQty: true,
          },
        },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ success: true, data: purchases });
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
    console.error("[purchases] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, ["admin", "manager"]);
    const body = await req.json();
    const parsed = purchaseSchema.safeParse(body);

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

    const { supplierName, invoiceNumber, paymentMethod, notes, entries } =
      parsed.data;
    const today = new Date(new Date().toISOString().split("T")[0]);

    const itemIds = entries.map((e) => e.itemId);
    const uniqueIds = new Set(itemIds);
    if (uniqueIds.size !== itemIds.length) {
      return NextResponse.json(
        { success: false, error: "Duplicate items not allowed" },
        { status: 400 },
      );
    }

    const totalAmount = entries.reduce(
      (sum, e) => sum + e.quantity * e.unitPrice,
      0,
    );

    const purchase = await prisma.purchase.create({
      data: {
        date: today,
        supplierName,
        invoiceNumber,
        paymentMethod,
        notes,
        totalAmount,
        recordedById: user.id,
        entries: {
          create: entries.map((e) => ({
            itemId: e.itemId,
            quantity: e.quantity,
            unitPrice: e.unitPrice,
            totalPrice: e.quantity * e.unitPrice,
          })),
        },
      },
      include: {
        entries: {
          include: { item: { select: { name: true, nameAr: true } } },
        },
      },
    });

    return NextResponse.json(
      { success: true, data: purchase },
      { status: 201 },
    );
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
    console.error("[purchases] POST error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

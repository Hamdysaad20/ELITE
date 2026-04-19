import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole(req, ["admin", "manager"]);
    const { id } = await params;

    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: { entries: true },
    });

    if (!purchase) {
      return NextResponse.json(
        { success: false, error: "Purchase not found" },
        { status: 404 },
      );
    }

    if (purchase.receiptStatus === "received") {
      return NextResponse.json(
        { success: false, error: "Already received" },
        { status: 409 },
      );
    }

    const movements = purchase.entries.map((entry) =>
      prisma.stockMovement.create({
        data: {
          itemId: entry.itemId,
          location: "storage",
          type: "receipt",
          quantity: entry.quantity,
          referenceType: "purchase",
          referenceId: purchase.id,
          recordedById: user.id,
        },
      }),
    );

    const priceUpdates = purchase.entries.map((entry) =>
      prisma.inventoryItem.update({
        where: { id: entry.itemId },
        data: { lastPurchasePrice: entry.unitPrice },
      }),
    );

    await prisma.$transaction([
      prisma.purchase.update({
        where: { id },
        data: {
          receiptStatus: "received",
          receivedAt: new Date(),
          receivedById: user.id,
        },
      }),
      ...movements,
      ...priceUpdates,
    ]);

    return NextResponse.json({
      success: true,
      data: { id, status: "received" },
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
    console.error("[purchases/receive] POST error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

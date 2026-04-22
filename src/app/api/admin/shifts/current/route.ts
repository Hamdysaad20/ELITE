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
    const today = new Date(new Date().toISOString().split("T")[0]);

    const session = await prisma.shiftSession.findFirst({
      where: {
        date: today,
        status: "open",
      },
      select: {
        id: true,
        date: true,
        shiftSuggested: true,
        shiftConfirmed: true,
        baristaId: true,
        barista: { select: { name: true, email: true } },
        status: true,
        openingCountId: true,
        closingCountId: true,
      },
      orderBy: { openedAt: "desc" },
    });

    return NextResponse.json({ success: true, data: session });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Authentication")) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED" },
        { status: 401 },
      );
    }
    console.error("[shifts/current] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

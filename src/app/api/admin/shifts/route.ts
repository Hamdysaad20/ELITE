import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";
import { suggestShift } from "@/lib/inventory/constants";

const openShiftSchema = z.object({
  shiftConfirmed: z.enum(["morning", "evening"]),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, ["admin", "manager", "barista"]);
    const dateParam = req.nextUrl.searchParams.get("date");
    const date = dateParam ? new Date(dateParam) : new Date();
    const dateOnly = new Date(date.toISOString().split("T")[0]);

    const sessions = await prisma.shiftSession.findMany({
      where: { date: dateOnly },
      select: {
        id: true,
        date: true,
        shiftSuggested: true,
        shiftConfirmed: true,
        baristaId: true,
        barista: { select: { name: true, email: true } },
        status: true,
        consumptionConfidence: true,
        openingCountId: true,
        closingCountId: true,
        handoverNotes: true,
        openedAt: true,
        closedAt: true,
      },
      orderBy: { openedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: sessions,
      suggested: suggestShift(),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Authentication")) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED" },
        { status: 401 },
      );
    }
    console.error("[shifts] GET error:", error);
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
    const parsed = openShiftSchema.safeParse(body);

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

    const today = new Date(new Date().toISOString().split("T")[0]);
    const { shiftConfirmed } = parsed.data;

    const existing = await prisma.shiftSession.findUnique({
      where: {
        date_shiftConfirmed: { date: today, shiftConfirmed },
      },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        data: existing,
        existed: true,
      });
    }

    const session = await prisma.shiftSession.create({
      data: {
        date: today,
        shiftSuggested: suggestShift(),
        shiftConfirmed,
        baristaId: user.id,
      },
    });

    return NextResponse.json({ success: true, data: session }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Authentication")) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED" },
        { status: 401 },
      );
    }
    console.error("[shifts] POST error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

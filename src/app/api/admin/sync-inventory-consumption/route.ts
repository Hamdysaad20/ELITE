import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/server/auth/session";
import {
  consumeInventoryForOdooPosOrders,
  consumeInventoryForPaidOnlineOrders,
} from "@/server/services/inventoryConsumption";

const syncSchema = z.object({
  source: z.enum(["online", "pos", "all"]).default("all"),
  since: z.string().datetime().optional(),
});

export async function POST(req: NextRequest) {
  try {
    await requireRole(req, ["admin", "manager", "head_barista"]);
    const body = await req.json().catch(() => ({}));
    const parsed = syncSchema.safeParse(body);

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

    const since = parsed.data.since
      ? new Date(parsed.data.since)
      : new Date(Date.now() - 1000 * 60 * 60 * 24);

    const result: Record<string, unknown> = {};

    if (parsed.data.source === "online" || parsed.data.source === "all") {
      result.online = await consumeInventoryForPaidOnlineOrders(since);
    }
    if (parsed.data.source === "pos" || parsed.data.source === "all") {
      result.pos = await consumeInventoryForOdooPosOrders(since);
    }

    return NextResponse.json({ success: true, data: result });
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
    console.error("[sync-inventory-consumption] error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

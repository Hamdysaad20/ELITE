import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { prisma } from "@/server/db/client";
import { markOrderingResumedInAppNotifications } from "@/server/services/orderingInAppNotifications";

/**
 * POST /api/admin/trigger-ordering-notifications
 * Admin endpoint to trigger ordering resumed in-app notifications
 * Requires admin role
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "admin") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    // Trigger in-app notifications for all pending subscriptions
    const result = await markOrderingResumedInAppNotifications();

    return NextResponse.json({
      success: true,
      updated: result.updated,
      message: "Ordering in-app notifications triggered",
    });
  } catch (error) {
    console.error("[admin/trigger-ordering-notifications] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

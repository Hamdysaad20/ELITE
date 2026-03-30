import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { prisma } from "@/server/db/client";

/**
 * GET /api/notify/in-app
 * Returns current user's in-app item availability notifications.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const notifications = await prisma.itemAvailabilityNotification.findMany({
      where: {
        userId: session.user.id,
        notified: true,
      },
      include: {
        user: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });

    const productIds = Array.from(
      new Set(notifications.map((n) => n.productId)),
    );

    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p.name]));

    const unread = notifications.map((notification) => ({
      id: notification.id,
      productId: notification.productId,
      productName: productMap.get(notification.productId) || "Item",
      createdAt: notification.createdAt,
      title: "Item back in stock",
      message: `${productMap.get(notification.productId) || "An item"} is available again.`,
    }));

    return NextResponse.json({
      success: true,
      unreadCount: unread.length,
      notifications: unread,
    });
  } catch (error) {
    console.error("[notify/in-app] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/notify/in-app
 * Marks one or all in-app notifications as read by removing them.
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    let body: { ids?: string[]; clearAll?: boolean } = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean) : [];

    if (!body.clearAll && ids.length === 0) {
      return NextResponse.json(
        { error: "Provide ids or clearAll=true" },
        { status: 400 },
      );
    }

    const result = await prisma.itemAvailabilityNotification.deleteMany({
      where: {
        userId: session.user.id,
        notified: true,
        ...(body.clearAll ? {} : { id: { in: ids } }),
      },
    });

    return NextResponse.json({ success: true, cleared: result.count });
  } catch (error) {
    console.error("[notify/in-app] PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

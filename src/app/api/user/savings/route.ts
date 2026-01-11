/**
 * User Savings API Endpoint
 * GET /api/user/savings
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/server/auth/options";
import { getUserSavings } from "@/lib/analytics/savings";
import { prisma } from "@/server/db/client";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(getAuthOptions());
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user savings data
    const savings = await getUserSavings(userId);

    // Get top saving orders
    const topSavingOrders = await prisma.orderSavings.findMany({
      where: {
        order: {
          userId,
        },
      },
      include: {
        order: {
          select: {
            id: true,
            createdAt: true,
            clientOrderRef: true,
          },
        },
      },
      orderBy: {
        totalSavings: "desc",
      },
      take: 5,
    });

    const formattedTopOrders = topSavingOrders.map((os) => ({
      orderId: os.orderId,
      orderNumber: os.order.clientOrderRef,
      date: os.order.createdAt,
      saved: Number(os.totalSavings),
    }));

    return NextResponse.json({
      totalSaved: savings.totalSaved,
      totalOrders: savings.totalOrders,
      averageSavingsPerOrder: savings.averageSavingsPerOrder,
      savingsByMonth: savings.savingsByMonth,
      topSavingOrders: formattedTopOrders,
    });
  } catch (error) {
    console.error("Error fetching user savings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

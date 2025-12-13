/**
 * User Analytics API Endpoint
 * GET /api/user/analytics
 * Comprehensive analytics including savings, points, and spending trends
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/server/auth/options";
import { getUserSavings } from "@/lib/analytics/savings";
import { getUserPoints } from "@/lib/analytics/points";
import { prisma } from "@/server/db/client";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(getAuthOptions());
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get savings data
    const savings = await getUserSavings(userId);

    // Get points data
    const points = await getUserPoints(userId);

    // Get spending data (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const orders = await prisma.order.findMany({
      where: {
        userId,
        createdAt: {
          gte: sixMonthsAgo,
        },
        status: {
          in: ["DELIVERED", "READY", "OUT_FOR_DELIVERY"],
        },
      },
      include: {
        items: true,
        savings: true,
        points: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Group by month for charts
    const monthlyData: { [key: string]: { spending: number; savings: number; points: number } } = {};
    const categoryData: { [key: string]: { spending: number; savings: number } } = {};

    orders.forEach((order) => {
      const month = order.createdAt.toISOString().slice(0, 7); // "YYYY-MM"
      
      if (!monthlyData[month]) {
        monthlyData[month] = { spending: 0, savings: 0, points: 0 };
      }

      monthlyData[month].spending += Number(order.total);
      monthlyData[month].savings += order.savings ? Number(order.savings.totalSavings) : 0;
      monthlyData[month].points += order.points ? order.points.totalPoints : 0;

      // Group by category
      order.items.forEach((item) => {
        const category = item.categoryId || "Other";
        if (!categoryData[category]) {
          categoryData[category] = { spending: 0, savings: 0 };
        }
        categoryData[category].spending += Number(item.totalPrice);
      });
    });

    // Format for charts
    const savingsData = {
      monthly: Object.entries(monthlyData).map(([month, data]) => ({
        month,
        savings: data.savings,
        spending: data.spending,
      })),
      byCategory: Object.entries(categoryData).map(([category, data]) => ({
        category,
        savings: data.savings,
      })),
      trend: calculateTrend(savings.savingsByMonth),
      percentageChange: calculatePercentageChange(savings.savingsByMonth),
    };

    const pointsData = {
      earned: Object.entries(monthlyData).map(([month, data]) => ({
        month,
        points: data.points,
      })),
      redeemed: [], // To be implemented when redemption feature is added
      projectedEarnings: calculateProjectedEarnings(monthlyData),
    };

    const spendingData = {
      monthly: Object.entries(monthlyData).map(([month, data]) => ({
        month,
        amount: data.spending,
      })),
      byCategory: Object.entries(categoryData).map(([category, data]) => ({
        category,
        amount: data.spending,
      })),
      averageOrderValue: orders.length > 0 
        ? orders.reduce((sum, order) => sum + Number(order.total), 0) / orders.length 
        : 0,
    };

    return NextResponse.json({
      savingsData,
      pointsData,
      spendingData,
      summary: {
        totalSaved: savings.totalSaved,
        currentPoints: points.totalPoints,
        tier: points.tier,
        totalOrders: orders.length,
      },
    });
  } catch (error) {
    console.error("Error fetching user analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper functions
function calculateTrend(savingsByMonth: any[]): "up" | "down" | "stable" {
  if (!savingsByMonth || savingsByMonth.length < 2) return "stable";

  const recent = savingsByMonth.slice(-2);
  if (recent[1].amount > recent[0].amount) return "up";
  if (recent[1].amount < recent[0].amount) return "down";
  return "stable";
}

function calculatePercentageChange(savingsByMonth: any[]): number {
  if (!savingsByMonth || savingsByMonth.length < 2) return 0;

  const recent = savingsByMonth.slice(-2);
  const previous = recent[0].amount || 1;
  const current = recent[1].amount || 0;

  return Math.round(((current - previous) / previous) * 100);
}

function calculateProjectedEarnings(monthlyData: { [key: string]: any }): number {
  const months = Object.values(monthlyData);
  if (months.length === 0) return 0;

  const avgPoints = months.reduce((sum: number, m: any) => sum + m.points, 0) / months.length;
  return Math.round(avgPoints);
}

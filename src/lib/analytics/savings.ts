/**
 * Savings Calculation Utilities
 * Handles calculation and tracking of user savings from discounts
 */

import { prisma } from "@/server/db/client";
import { Decimal } from "@prisma/client/runtime/library";

export interface DiscountDetail {
  type: "percentage" | "fixed" | "coupon" | "promo" | "bundle";
  code?: string;
  name: string;
  amount: number;
  percentage?: number;
}

export interface OrderSavingsData {
  orderId: string;
  originalPrice: number;
  finalPrice: number;
  totalSavings: number;
  discounts: DiscountDetail[];
}

/**
 * Calculate savings for an order
 * Called after order is placed
 */
export async function calculateOrderSavings(
  orderId: string,
): Promise<OrderSavingsData | null> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      console.error(`Order ${orderId} not found`);
      return null;
    }

    // Calculate original price (before discounts)
    const originalPrice = order.items.reduce((sum, item) => {
      // Use subtotal if originalPrice is not set
      return sum.plus(item.totalPrice);
    }, new Decimal(0));

    const finalPrice = new Decimal(order.total);
    const totalSavings = originalPrice.minus(finalPrice);

    // Build discount details
    const discounts: DiscountDetail[] = [];

    if (order.discount && Number(order.discount) > 0) {
      discounts.push({
        type: "fixed",
        name: "Discount Applied",
        amount: Number(order.discount),
      });
    }

    const savingsData: OrderSavingsData = {
      orderId,
      originalPrice: Number(originalPrice),
      finalPrice: Number(finalPrice),
      totalSavings: Number(totalSavings),
      discounts,
    };

    // Store savings data
    await prisma.orderSavings.create({
      data: {
        orderId,
        originalPrice,
        finalPrice,
        totalSavings,
        discounts: discounts as unknown as never,
      },
    });

    // Update order with savings info
    await prisma.order.update({
      where: { id: orderId },
      data: {
        originalPrice,
        discountApplied: Number(totalSavings) > 0,
      },
    });

    // Update user aggregate savings
    if (order.userId) {
      await updateUserSavings(order.userId, Number(totalSavings));
    }

    return savingsData;
  } catch (error) {
    console.error("Error calculating order savings:", error);
    return null;
  }
}

/**
 * Update user's aggregate savings data
 */
export async function updateUserSavings(
  userId: string,
  newSavings: number,
): Promise<void> {
  try {
    const existing = await prisma.userSavings.findUnique({
      where: { userId },
    });

    const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"

    if (existing) {
      // Update existing record
      const savingsByMonth =
        (existing.savingsByMonth as unknown as Array<{
          month: string;
          amount: number;
        }>) || [];
      const monthIndex = savingsByMonth.findIndex(
        (m: { month: string; amount: number }) => m.month === currentMonth,
      );

      if (monthIndex >= 0) {
        savingsByMonth[monthIndex].amount += newSavings;
      } else {
        savingsByMonth.push({ month: currentMonth, amount: newSavings });
      }

      const newTotalSaved = Number(existing.totalSaved) + newSavings;
      const newTotalOrders = existing.totalOrders + 1;

      await prisma.userSavings.update({
        where: { userId },
        data: {
          totalSaved: newTotalSaved,
          totalOrders: newTotalOrders,
          averageSavingsPerOrder: newTotalSaved / newTotalOrders,
          savingsByMonth: savingsByMonth as unknown as never,
        },
      });
    } else {
      // Create new record
      await prisma.userSavings.create({
        data: {
          userId,
          totalSaved: newSavings,
          totalOrders: 1,
          averageSavingsPerOrder: newSavings,
          savingsByMonth: [
            { month: currentMonth, amount: newSavings },
          ] as unknown as never,
        },
      });
    }
  } catch (error) {
    console.error("Error updating user savings:", error);
  }
}

/**
 * Get user's total savings and breakdown
 */
export async function getUserSavings(userId: string) {
  try {
    const savings = await prisma.userSavings.findUnique({
      where: { userId },
    });

    if (!savings) {
      return {
        totalSaved: 0,
        totalOrders: 0,
        averageSavingsPerOrder: 0,
        savingsByMonth: [],
      };
    }

    return {
      totalSaved: Number(savings.totalSaved),
      totalOrders: savings.totalOrders,
      averageSavingsPerOrder: Number(savings.averageSavingsPerOrder),
      savingsByMonth: savings.savingsByMonth as unknown as Array<{
        month: string;
        amount: number;
      }>,
    };
  } catch (error) {
    console.error("Error fetching user savings:", error);
    return {
      totalSaved: 0,
      totalOrders: 0,
      averageSavingsPerOrder: 0,
      savingsByMonth: [],
    };
  }
}

/**
 * Get savings for a specific order
 */
export async function getOrderSavings(orderId: string) {
  try {
    const savings = await prisma.orderSavings.findUnique({
      where: { orderId },
    });

    if (!savings) return null;

    return {
      orderId: savings.orderId,
      originalPrice: Number(savings.originalPrice),
      finalPrice: Number(savings.finalPrice),
      totalSavings: Number(savings.totalSavings),
      discounts: savings.discounts as unknown as DiscountDetail[],
    };
  } catch (error) {
    console.error("Error fetching order savings:", error);
    return null;
  }
}

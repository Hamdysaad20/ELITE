/**
 * Points Calculation Utilities
 * Handles calculation and tracking of loyalty points earned per order
 * Exchange Rate: 1 EGP = 100 points
 */

import { prisma } from "@/server/db/client";
import { Decimal } from "@prisma/client/runtime/library";
import {
  checkAndNotifyTierUpgrade,
  createPointsEarnedNotification,
} from "./notifications";

export interface PointsBreakdownItem {
  reason: string;
  amount: number;
}

export interface OrderPointsData {
  orderId: string;
  userId: string;
  basePoints: number;
  bonusPoints: number;
  multiplier: number;
  totalPoints: number;
  pointsBreakdown: PointsBreakdownItem[];
  expiresAt: Date | null;
}

// Tier thresholds (in points)
export const TIER_THRESHOLDS = {
  bronze: { min: 0, max: 99999, name: "Bronze" }, // 0-999 EGP
  silver: { min: 100000, max: 499999, name: "Silver" }, // 1,000-4,999 EGP
  gold: { min: 500000, max: 999999, name: "Gold" }, // 5,000-9,999 EGP
  platinum: { min: 1000000, max: Infinity, name: "Platinum" }, // 10,000+ EGP
} as const;

// Bonus point rewards
export const BONUS_REWARDS = {
  firstOrder: 1000, // 10 EGP worth
  review: 25, // 0.25 EGP worth
  referral: 5000, // 50 EGP worth (when referred user completes first purchase)
} as const;

/**
 * Calculate points for a delivered order
 * Triggered when order status changes to DELIVERED
 */
export async function calculateOrderPoints(
  orderId: string,
): Promise<OrderPointsData | null> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order || !order.userId) {
      console.error(`Order ${orderId} not found or has no user`);
      return null;
    }

    // Check if points already calculated
    const existing = await prisma.orderPoints.findUnique({
      where: { orderId },
    });

    if (existing) {
      console.log(`Points already calculated for order ${orderId}`);
      return null;
    }

    // Base points: 1 EGP = 100 points
    const basePoints = Math.floor(Number(order.total) * 100);

    // Check for bonuses
    let bonusPoints = 0;
    const pointsBreakdown: PointsBreakdownItem[] = [
      { reason: "Order value", amount: basePoints },
    ];

    // First order bonus
    const isFirstOrder = await isUserFirstOrder(order.userId);
    if (isFirstOrder) {
      bonusPoints += BONUS_REWARDS.firstOrder;
      pointsBreakdown.push({
        reason: "First order bonus",
        amount: BONUS_REWARDS.firstOrder,
      });
    }

    // Birthday multiplier
    let multiplier = 1;
    if (order.user?.createdAt) {
      const isBirthdayMonth = checkBirthdayMonth(order.user.createdAt);
      if (isBirthdayMonth) {
        multiplier = 2;
        pointsBreakdown.push({
          reason: "Birthday month 2x multiplier",
          amount: basePoints,
        });
      }
    }

    const totalPoints = basePoints * multiplier + bonusPoints;

    // Points expire in 1 year
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // Store points
    const orderPoints = await prisma.orderPoints.create({
      data: {
        orderId,
        userId: order.userId,
        basePoints,
        bonusPoints,
        multiplier,
        totalPoints,
        pointsBreakdown: pointsBreakdown as unknown as never,
        expiresAt,
      },
    });

    // Update order with points earned
    await prisma.order.update({
      where: { id: orderId },
      data: { pointsEarned: totalPoints },
    });

    // Update user points balance
    await updateUserPoints(order.userId, totalPoints, "earn", orderId);

    // Send points earned notification
    await createPointsEarnedNotification(
      order.userId,
      totalPoints,
      orderId,
      `from your order`,
    );

    return {
      orderId: orderPoints.orderId,
      userId: orderPoints.userId,
      basePoints: orderPoints.basePoints,
      bonusPoints: orderPoints.bonusPoints,
      multiplier: Number(orderPoints.multiplier),
      totalPoints: orderPoints.totalPoints,
      pointsBreakdown:
        orderPoints.pointsBreakdown as unknown as PointsBreakdownItem[],
      expiresAt: orderPoints.expiresAt,
    };
  } catch (error) {
    console.error("Error calculating order points:", error);
    return null;
  }
}

/**
 * Update user points balance and tier
 */
export async function updateUserPoints(
  userId: string,
  points: number,
  type: "earn" | "redeem" | "expire" | "adjust",
  orderId?: string,
  reason?: string,
): Promise<void> {
  try {
    const existing = await prisma.userPoints.findUnique({
      where: { userId },
    });

    let newBalance: number;
    let newTotalEarned: number;
    let newTotalRedeemed: number;

    if (existing) {
      newBalance =
        existing.totalPoints + (type === "redeem" ? -points : points);
      newTotalEarned = existing.totalEarned + (type === "earn" ? points : 0);
      newTotalRedeemed =
        existing.totalRedeemed + (type === "redeem" ? points : 0);
    } else {
      newBalance = points;
      newTotalEarned = type === "earn" ? points : 0;
      newTotalRedeemed = type === "redeem" ? points : 0;
    }

    // Determine tier based on total earned
    const { tier, nextTierAt } = calculateUserTier(newTotalEarned);

    // Check for tier upgrade and notify
    if (existing && type === "earn") {
      await checkAndNotifyTierUpgrade(
        userId,
        existing.totalEarned,
        newTotalEarned,
      );
    }

    // Upsert user points
    await prisma.userPoints.upsert({
      where: { userId },
      create: {
        userId,
        totalPoints: newBalance,
        totalEarned: newTotalEarned,
        totalRedeemed: newTotalRedeemed,
        tier,
        nextTierAt,
      },
      update: {
        totalPoints: newBalance,
        totalEarned: newTotalEarned,
        totalRedeemed: newTotalRedeemed,
        tier,
        nextTierAt,
      },
    });

    // Create transaction record
    await createPointsTransaction({
      userId,
      type,
      amount: type === "redeem" ? -points : points,
      balance: newBalance,
      reason: reason || (orderId ? `Order #${orderId}` : `${type} transaction`),
      orderId,
    });
  } catch (error) {
    console.error("Error updating user points:", error);
  }
}

/**
 * Calculate user tier based on total earned points
 */
export function calculateUserTier(totalEarned: number): {
  tier: string;
  nextTierAt: number;
} {
  for (const [tierName, threshold] of Object.entries(TIER_THRESHOLDS)) {
    if (totalEarned >= threshold.min && totalEarned <= threshold.max) {
      return {
        tier: tierName,
        nextTierAt:
          threshold.max === Infinity ? threshold.max : threshold.max + 1,
      };
    }
  }

  return { tier: "bronze", nextTierAt: TIER_THRESHOLDS.silver.min };
}

/**
 * Create a points transaction record
 */
export async function createPointsTransaction(data: {
  userId: string;
  type: string;
  amount: number;
  balance: number;
  reason: string;
  orderId?: string;
}): Promise<void> {
  try {
    await prisma.pointsTransaction.create({
      data: {
        userId: data.userId,
        type: data.type,
        amount: data.amount,
        balance: data.balance,
        reason: data.reason,
        orderId: data.orderId,
      },
    });
  } catch (error) {
    console.error("Error creating points transaction:", error);
  }
}

/**
 * Check if this is user's first order
 */
async function isUserFirstOrder(userId: string): Promise<boolean> {
  const orderCount = await prisma.order.count({
    where: {
      userId,
      status: "DELIVERED",
    },
  });

  return orderCount === 1; // This is the first delivered order
}

/**
 * Check if current month matches user's birthday month
 * For demo purposes, using account creation month as birthday
 */
function checkBirthdayMonth(createdAt: Date): boolean {
  const currentMonth = new Date().getMonth();
  const accountMonth = new Date(createdAt).getMonth();

  // For demo: Give birthday bonus if account was created in current month
  return currentMonth === accountMonth;
}

/**
 * Award referral bonus points
 */
export async function awardReferralPoints(
  referrerId: string,
  referredUserId: string,
): Promise<void> {
  try {
    // Check if referred user completed their first order
    const firstOrder = await prisma.order.findFirst({
      where: {
        userId: referredUserId,
        status: "DELIVERED",
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!firstOrder) {
      console.log("Referred user has not completed first order yet");
      return;
    }

    // Check if referral bonus already awarded
    const existingTransaction = await prisma.pointsTransaction.findFirst({
      where: {
        userId: referrerId,
        type: "earn",
        reason: {
          contains: `Referral bonus for ${referredUserId}`,
        },
      },
    });

    if (existingTransaction) {
      console.log("Referral bonus already awarded");
      return;
    }

    // Award referral points
    await updateUserPoints(
      referrerId,
      BONUS_REWARDS.referral,
      "earn",
      undefined,
      `Referral bonus for user ${referredUserId}`,
    );

    console.log(
      `Awarded ${BONUS_REWARDS.referral} referral points to ${referrerId}`,
    );
  } catch (error) {
    console.error("Error awarding referral points:", error);
  }
}

/**
 * Award review bonus points
 */
export async function awardReviewPoints(
  userId: string,
  reviewId: string,
): Promise<void> {
  try {
    await updateUserPoints(
      userId,
      BONUS_REWARDS.review,
      "earn",
      undefined,
      `Review bonus for review ${reviewId}`,
    );

    console.log(`Awarded ${BONUS_REWARDS.review} review points to ${userId}`);
  } catch (error) {
    console.error("Error awarding review points:", error);
  }
}

/**
 * Get user's points summary
 */
export async function getUserPoints(userId: string) {
  try {
    const userPoints = await prisma.userPoints.findUnique({
      where: { userId },
    });

    if (!userPoints) {
      return {
        totalPoints: 0,
        totalEarned: 0,
        totalRedeemed: 0,
        tier: "bronze",
        nextTierAt: TIER_THRESHOLDS.silver.min,
        pointsToNextTier: TIER_THRESHOLDS.silver.min,
      };
    }

    const pointsToNextTier = userPoints.nextTierAt - userPoints.totalEarned;

    return {
      totalPoints: userPoints.totalPoints,
      totalEarned: userPoints.totalEarned,
      totalRedeemed: userPoints.totalRedeemed,
      tier: userPoints.tier,
      nextTierAt: userPoints.nextTierAt,
      pointsToNextTier: Math.max(0, pointsToNextTier),
    };
  } catch (error) {
    console.error("Error fetching user points:", error);
    return {
      totalPoints: 0,
      totalEarned: 0,
      totalRedeemed: 0,
      tier: "bronze",
      nextTierAt: TIER_THRESHOLDS.silver.min,
      pointsToNextTier: TIER_THRESHOLDS.silver.min,
    };
  }
}

/**
 * Get points transaction history
 */
export async function getPointsTransactions(
  userId: string,
  limit: number = 50,
) {
  try {
    const transactions = await prisma.pointsTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return transactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      balance: t.balance,
      reason: t.reason,
      orderId: t.orderId,
      createdAt: t.createdAt,
    }));
  } catch (error) {
    console.error("Error fetching points transactions:", error);
    return [];
  }
}

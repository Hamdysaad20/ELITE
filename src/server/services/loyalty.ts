import { prisma } from "@/server/db/client";
import { Decimal } from "@prisma/client/runtime/library";

interface TierMultipliers {
  bronze: number;
  silver: number;
  gold: number;
  platinum: number;
}

const TIER_MULTIPLIERS: TierMultipliers = {
  bronze: 1,
  silver: 1.5,
  gold: 2,
  platinum: 3,
};

const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 100,
  gold: 500,
  platinum: 1000,
};

/**
 * Award loyalty points to a user for completing an order
 */
export async function awardOrderPoints(
  orderId: string,
  userId: string,
): Promise<{ pointsAwarded: number; newLevel: string } | null> {
  try {
    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { 
        total: true, 
        status: true,
        userId: true 
      },
    });

    if (!order) {
      console.warn(`⚠️ Order ${orderId} not found`);
      return null;
    }

    // Only award points for delivered/completed orders
    if (!["DELIVERED", "COMPLETED"].includes(order.status)) {
      console.log(`ℹ️ Order ${orderId} status is ${order.status}, not awarding points yet`);
      return null;
    }

    // Verify the order belongs to the user
    if (order.userId !== userId) {
      console.warn(`⚠️ Order ${orderId} does not belong to user ${userId}`);
      return null;
    }

    // Check if points already awarded
    const existingEntry = await prisma.loyaltyLedger.findFirst({
      where: {
        orderId,
        userId,
      },
    });

    if (existingEntry) {
      console.log(`ℹ️ Points already awarded for order ${orderId}`);
      return null;
    }

    // Get user's loyalty account
    let loyaltyAccount = await prisma.loyaltyAccount.findUnique({
      where: { userId },
    });

    // Create loyalty account if it doesn't exist
    if (!loyaltyAccount) {
      loyaltyAccount = await prisma.loyaltyAccount.create({
        data: {
          userId,
          points: 0,
          totalSpent: 0,
          level: "bronze",
        },
      });
    }

    // Calculate points: 1 point per 10 EGP (adjusted by tier multiplier)
    const multiplier =
      TIER_MULTIPLIERS[loyaltyAccount.level as keyof TierMultipliers] || 1;
    const basePoints = Math.floor(Number(order.total) / 10);
    const pointsAwarded = Math.floor(basePoints * multiplier);

    // Create ledger entry
    await prisma.loyaltyLedger.create({
      data: {
        userId,
        orderId,
        deltaPoints: pointsAwarded,
        reason: `Order completed - ${order.total} EGP`,
      },
    });

    // Update loyalty account
    const newTotalPoints = loyaltyAccount.points + pointsAwarded;
    const newTotalSpent = new Decimal(loyaltyAccount.totalSpent).add(
      new Decimal(order.total),
    );

    // Determine new tier based on total points
    let newLevel = loyaltyAccount.level;
    if (newTotalPoints >= TIER_THRESHOLDS.platinum) {
      newLevel = "platinum";
    } else if (newTotalPoints >= TIER_THRESHOLDS.gold) {
      newLevel = "gold";
    } else if (newTotalPoints >= TIER_THRESHOLDS.silver) {
      newLevel = "silver";
    } else {
      newLevel = "bronze";
    }

    const levelChanged = newLevel !== loyaltyAccount.level;

    // Update account
    await prisma.loyaltyAccount.update({
      where: { userId },
      data: {
        points: newTotalPoints,
        totalSpent: newTotalSpent,
        level: newLevel,
      },
    });

    console.log(
      `✅ Awarded ${pointsAwarded} points to user ${userId} for order ${orderId}`,
    );

    if (levelChanged) {
      console.log(`🎉 User ${userId} tier upgraded: ${loyaltyAccount.level} → ${newLevel}`);
      
      // Create tier upgrade ledger entry
      await prisma.loyaltyLedger.create({
        data: {
          userId,
          deltaPoints: 0,
          reason: `Tier upgraded to ${newLevel}`,
        },
      });
    }

    return { pointsAwarded, newLevel };
  } catch (error) {
    console.error(`❌ Failed to award points for order ${orderId}:`, error);
    return null;
  }
}

/**
 * Deduct loyalty points when redeeming rewards
 */
export async function deductPoints(
  userId: string,
  points: number,
  reason: string,
): Promise<boolean> {
  try {
    const loyaltyAccount = await prisma.loyaltyAccount.findUnique({
      where: { userId },
    });

    if (!loyaltyAccount) {
      console.warn(`⚠️ No loyalty account found for user ${userId}`);
      return false;
    }

    if (loyaltyAccount.points < points) {
      console.warn(
        `⚠️ User ${userId} has insufficient points: ${loyaltyAccount.points} < ${points}`,
      );
      return false;
    }

    // Create ledger entry
    await prisma.loyaltyLedger.create({
      data: {
        userId,
        deltaPoints: -points,
        reason,
      },
    });

    // Update account
    await prisma.loyaltyAccount.update({
      where: { userId },
      data: {
        points: { decrement: points },
      },
    });

    console.log(`✅ Deducted ${points} points from user ${userId}: ${reason}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to deduct points for user ${userId}:`, error);
    return false;
  }
}

/**
 * Add bonus points (promotions, referrals, etc.)
 */
export async function addBonusPoints(
  userId: string,
  points: number,
  reason: string,
): Promise<boolean> {
  try {
    let loyaltyAccount = await prisma.loyaltyAccount.findUnique({
      where: { userId },
    });

    // Create loyalty account if it doesn't exist
    if (!loyaltyAccount) {
      loyaltyAccount = await prisma.loyaltyAccount.create({
        data: {
          userId,
          points: 0,
          totalSpent: 0,
          level: "bronze",
        },
      });
    }

    // Create ledger entry
    await prisma.loyaltyLedger.create({
      data: {
        userId,
        deltaPoints: points,
        reason,
      },
    });

    // Update account
    const newTotalPoints = loyaltyAccount.points + points;

    // Check for tier upgrade
    let newLevel = loyaltyAccount.level;
    if (newTotalPoints >= TIER_THRESHOLDS.platinum) {
      newLevel = "platinum";
    } else if (newTotalPoints >= TIER_THRESHOLDS.gold) {
      newLevel = "gold";
    } else if (newTotalPoints >= TIER_THRESHOLDS.silver) {
      newLevel = "silver";
    }

    await prisma.loyaltyAccount.update({
      where: { userId },
      data: {
        points: newTotalPoints,
        level: newLevel,
      },
    });

    console.log(`✅ Added ${points} bonus points to user ${userId}: ${reason}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to add bonus points for user ${userId}:`, error);
    return false;
  }
}

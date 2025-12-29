/**
 * Deal Purchase Rewards Service
 * 
 * Processes rewards when a user purchases a deal
 */

import { rewardEngine, RewardTrigger } from "./rewardEngine";

export interface DealPurchaseData {
  userId: string;
  orderId: string;
  dealType: string; // "Monday Morning Deals", "Happy Hour Deals", etc.
  dealProducts: string[]; // Product IDs
  orderTotal?: number;
}

/**
 * Process rewards for a deal purchase
 * 
 * This function triggers multiple reward systems:
 * - Achievement progress (deal-specific and generic)
 * - Streak tracking
 * - Badge unlocks
 * - Points (if configured in achievement rewards)
 */
export interface Reward {
  type: string;
  value: unknown;
  name: string;
  awardedAt: Date;
}

export async function processDealPurchaseRewards(
  data: DealPurchaseData
): Promise<{ success: boolean; rewards: Reward[] }> {
  try {
    // Idempotency check: prevent duplicate processing
    const { prisma } = await import("@/server/db/client");
    const existingEvent = await prisma.rewardEvent.findFirst({
      where: {
        userId: data.userId,
        triggerType: "deal_purchased",
        triggerId: data.orderId,
        status: { in: ["awarded", "pending"] },
      },
    });

    if (existingEvent) {
      console.log(`Rewards already processed for order ${data.orderId}`);
      const existingRewards = existingEvent.rewards as Reward[] | null;
      return {
        success: true,
        rewards: existingRewards || [],
      };
    }

    // Trigger 1: Deal purchase achievement
    const result1 = await rewardEngine.processTrigger({
      type: "deal_purchased",
      userId: data.userId,
      triggerId: data.orderId,
      data: {
        dealType: data.dealType,
        products: data.dealProducts,
        orderTotal: data.orderTotal,
      },
    });

    // Trigger 2: Specific deal type achievement (e.g., "Monday Morning Legend")
    const dealTypeCode = data.dealType.toLowerCase().replace(/\s+/g, "_");
    const result2 = await rewardEngine.processTrigger({
      type: "deal_type_purchased",
      userId: data.userId,
      triggerId: data.dealType,
      data: {
        orderId: data.orderId,
        dealType: data.dealType,
      },
    });

    // Trigger 3: Combo purchase (if applicable)
    if (data.dealProducts.length > 1) {
      await rewardEngine.processTrigger({
        type: "combo_purchased",
        userId: data.userId,
        triggerId: data.orderId,
        data: {
          products: data.dealProducts,
          dealType: data.dealType,
        },
      });
    }

    // Combine all rewards
    const allRewards = [
      ...(result1.rewards || []),
      ...(result2.rewards || []),
    ];

    return {
      success: result1.success && result2.success,
      rewards: allRewards,
    };
  } catch (error) {
    console.error(`Error processing deal purchase rewards:`, error);
    return {
      success: false,
      rewards: [],
    };
  }
}


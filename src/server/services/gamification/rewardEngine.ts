/**
 * Reward Engine
 * 
 * Core service for processing multiple rewards from a single trigger
 */

import { prisma } from "@/server/db/client";
import { Prisma } from "@prisma/client";
import { awardPointsReward } from "./pointsIntegration";
import { updateAchievementProgress } from "./achievementService";
import { updateStreak } from "./streakService";
import { unlockBadge, checkBadgeUnlockFromAchievement } from "./badgeService";

export interface RewardTrigger {
  type: string; // "order_completed", "deal_purchased", "achievement_unlocked", etc.
  userId: string;
  triggerId?: string; // Order ID, Deal ID, Achievement ID, etc.
  data?: Record<string, unknown>; // Additional context
}

export interface Reward {
  type: "points" | "badge" | "streak" | "achievement" | "coupon" | "tier_upgrade" | "discount";
  value: Record<string, unknown> | number | string; // Flexible value based on type
  name: string;
  priority?: number;
  awardedAt: Date;
}

export interface RewardResult {
  success: boolean;
  rewards: Reward[];
  errors?: string[];
}

/**
 * Process a trigger and award all applicable rewards
 */
export class RewardEngine {
  /**
   * Process a trigger and award all applicable rewards
   */
  async processTrigger(trigger: RewardTrigger): Promise<RewardResult> {
    const rewards: Reward[] = [];
    const errors: string[] = [];

    let rewardEventId: string | null = null;

    try {
      // Create reward event record (with idempotency check for triggerId)
      let rewardEvent: { id: string } | null = null;
      if (trigger.triggerId) {
        // Check for existing event with same trigger
        const existing = await prisma.rewardEvent.findFirst({
          where: {
            userId: trigger.userId,
            triggerType: trigger.type,
            triggerId: trigger.triggerId,
            status: { in: ["awarded", "pending"] },
          },
        });

        if (existing) {
          console.log(`Reward event already exists for trigger ${trigger.type}:${trigger.triggerId}`);
          const existingRewards = existing.rewards as Reward[] | null;
          return {
            success: true,
            rewards: existingRewards || [],
            errors: existing.errorMessage ? [existing.errorMessage] : undefined,
          };
        }
      }

      rewardEvent = await prisma.rewardEvent.create({
        data: {
          userId: trigger.userId,
          triggerType: trigger.type,
          triggerId: trigger.triggerId,
          triggerData: (trigger.data || {}) as Prisma.InputJsonValue,
          rewards: [] as Prisma.InputJsonValue,
          status: "pending",
        },
      });

      rewardEventId = rewardEvent.id;

      // Process different trigger types
      switch (trigger.type) {
        case "deal_purchased":
          await this.processDealPurchase(trigger, rewards, errors);
          break;
        case "deal_type_purchased":
          // Handle specific deal type achievements (e.g., "Monday Morning Deals")
          await this.processDealPurchase(trigger, rewards, errors);
          break;
        case "combo_purchased":
          // Handle combo purchase achievements
          await this.processDealPurchase(trigger, rewards, errors);
          break;
        case "achievement_unlocked":
          await this.processAchievementUnlock(trigger, rewards, errors);
          break;
        case "streak_milestone":
          await this.processStreakMilestone(trigger, rewards, errors);
          break;
        default:
          errors.push(`Unknown trigger type: ${trigger.type}`);
      }

      // Update reward event with results
      if (rewardEventId) {
        await prisma.rewardEvent.update({
          where: { id: rewardEventId },
          data: {
            rewards: rewards as unknown as Prisma.InputJsonValue,
            status: errors.length > 0 ? "failed" : "awarded",
            errorMessage: errors.length > 0 ? errors.join("; ") : null,
            processedAt: new Date(),
          },
        });
      }

      return {
        success: errors.length === 0,
        rewards,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      console.error(`Error processing reward trigger:`, error);
      
      // Update reward event status to failed if it was created
      if (rewardEventId) {
        try {
          await prisma.rewardEvent.update({
            where: { id: rewardEventId },
            data: {
              status: "failed",
              errorMessage: error instanceof Error ? error.message : String(error),
              processedAt: new Date(),
            },
          });
        } catch (updateError) {
          console.error(`Failed to update reward event status:`, updateError);
        }
      }

      return {
        success: false,
        rewards: [],
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * Process deal purchase rewards
   */
  private async processDealPurchase(
    trigger: RewardTrigger,
    rewards: Reward[],
    errors: string[]
  ): Promise<void> {
    const { userId, data } = trigger;
    const dealType = data?.dealType as string;
    const products = (data?.products as string[]) || [];

    try {
      // 1. Update deal purchase achievement
      if (dealType) {
        const achievementCode = `deal_${dealType.toLowerCase().replace(/\s+/g, "_")}`;
        const result = await updateAchievementProgress(userId, achievementCode, 1);

        if (result.completed) {
          // Achievement completed - award all rewards
          await this.awardAchievementRewards(userId, achievementCode, rewards, errors);
        }
      }

      // 2. Update generic deal purchase achievement
      const genericResult = await updateAchievementProgress(userId, "deal_purchases", 1);
      if (genericResult.completed) {
        await this.awardAchievementRewards(userId, "deal_purchases", rewards, errors);
      }

      // 3. Update combo purchase achievement (if applicable)
      if (products.length > 1) {
        const comboResult = await updateAchievementProgress(userId, "combo_purchases", 1);
        if (comboResult.completed) {
          await this.awardAchievementRewards(userId, "combo_purchases", rewards, errors);
        }
      }

      // 4. Update streak
      const streakResult = await updateStreak(userId, "deal_purchase");
      if (streakResult.incremented && streakResult.streak) {
        const currentStreak = streakResult.streak.currentStreak;
        rewards.push({
          type: "streak",
          value: { currentStreak },
          name: `Deal Purchase Streak: ${currentStreak} days`,
          awardedAt: new Date(),
        });

        // Check for streak milestones
        if (currentStreak === 7 || currentStreak === 30) {
          await this.processStreakMilestone(
            {
              type: "streak_milestone",
              userId,
              triggerId: trigger.triggerId,
              data: {
                streakType: "deal_purchase",
                currentStreak,
              },
            },
            rewards,
            errors
          );
        }
      }
    } catch (error) {
      errors.push(`Error processing deal purchase rewards: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Process achievement unlock rewards
   */
  private async processAchievementUnlock(
    trigger: RewardTrigger,
    rewards: Reward[],
    errors: string[]
  ): Promise<void> {
    const { userId, data } = trigger;
    const achievementCode = data && typeof data === "object" && "achievementCode" in data
      ? String(data.achievementCode)
      : "";

    if (!achievementCode) {
      errors.push("Missing achievementCode in trigger data");
      return;
    }

    await this.awardAchievementRewards(userId, achievementCode, rewards, errors);
  }

  /**
   * Process streak milestone rewards
   */
  private async processStreakMilestone(
    trigger: RewardTrigger,
    rewards: Reward[],
    errors: string[]
  ): Promise<void> {
    const { userId, data } = trigger;
    const streakType = data && typeof data === "object" && "streakType" in data
      ? String(data.streakType)
      : "deal_purchase";
    const currentStreak = data && typeof data === "object" && "currentStreak" in data && typeof data.currentStreak === "number"
      ? data.currentStreak
      : 0;

    // Check for milestone achievements (e.g., 7-day streak, 30-day streak)
    if (currentStreak === 7) {
      const result = await updateAchievementProgress(userId, "streak_7_days", 1);
      if (result.completed) {
        await this.awardAchievementRewards(userId, "streak_7_days", rewards, errors);
      }
    }

    if (currentStreak === 30) {
      const result = await updateAchievementProgress(userId, "streak_30_days", 1);
      if (result.completed) {
        await this.awardAchievementRewards(userId, "streak_30_days", rewards, errors);
      }
    }
  }

  /**
   * Award all rewards from an achievement
   */
  private async awardAchievementRewards(
    userId: string,
    achievementCode: string,
    rewards: Reward[],
    errors: string[]
  ): Promise<void> {
    try {
      const achievement = await prisma.achievement.findUnique({
        where: { code: achievementCode },
        include: {
          rewards: {
            where: { isActive: true },
            orderBy: { priority: "asc" },
          },
        },
      });

      if (!achievement) {
        errors.push(`Achievement not found: ${achievementCode}`);
        return;
      }

      // Get user achievement to check if rewards already awarded
      const userAchievement = await prisma.userAchievement.findUnique({
        where: {
          userId_achievementId: {
            userId,
            achievementId: achievement.id,
          },
        },
      });

      if (!userAchievement || !userAchievement.isCompleted) {
        return; // Achievement not completed yet
      }

      const rewardsAwarded = (userAchievement.rewardsAwarded as string[]) || [];
      const updatedRewardsAwarded = [...rewardsAwarded];

      // Award each reward (use transaction for atomicity)
      await prisma.$transaction(async (tx) => {
        for (const rewardDef of achievement.rewards) {
          // Skip if already awarded
          if (updatedRewardsAwarded.includes(rewardDef.id)) {
            continue;
          }

          try {
            await this.awardReward(userId, rewardDef, rewards, errors);

            // Mark as awarded
            updatedRewardsAwarded.push(rewardDef.id);
          } catch (error) {
            errors.push(`Error awarding reward ${rewardDef.id}: ${error instanceof Error ? error.message : String(error)}`);
          }
        }

        // Update rewards awarded list atomically
        await tx.userAchievement.update({
          where: { id: userAchievement.id },
          data: { rewardsAwarded: updatedRewardsAwarded },
        });
      });

      // Check for badge unlocks
      const unlockedBadges = await checkBadgeUnlockFromAchievement(userId, achievementCode);
      for (const badge of unlockedBadges) {
        rewards.push({
          type: "badge",
          value: { badgeCode: badge.code },
          name: badge.name,
          awardedAt: new Date(),
        });
      }
    } catch (error) {
      errors.push(`Error awarding achievement rewards: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Award a single reward
   */
  private async awardReward(
    userId: string,
    rewardDef: { id: string; rewardType: string; rewardValue: Prisma.JsonValue; rewardName: string },
    rewards: Reward[],
    errors: string[]
  ): Promise<void> {
    const { rewardType, rewardValue, rewardName } = rewardDef;

    switch (rewardType) {
      case "points":
        // Handle both object format { points: number } and direct number
        const pointsValue = typeof rewardValue === "object" && rewardValue !== null && "points" in rewardValue
          ? (rewardValue as { points: number }).points
          : typeof rewardValue === "number"
          ? rewardValue
          : 0;
        const success = await awardPointsReward(userId, pointsValue, rewardName);
        if (success) {
          rewards.push({
            type: "points",
            value: { points: pointsValue },
            name: rewardName,
            awardedAt: new Date(),
          });
        } else {
          errors.push(`Failed to award points: ${pointsValue}`);
        }
        break;

      case "badge":
        // Handle both object format { badgeCode: string } and direct string
        const badgeCodeValue = typeof rewardValue === "object" && rewardValue !== null && "badgeCode" in rewardValue
          ? (rewardValue as { badgeCode: string }).badgeCode
          : typeof rewardValue === "string"
          ? rewardValue
          : "";
        const badgeResult = await unlockBadge(userId, badgeCodeValue);
        if (badgeResult.success && badgeResult.badge) {
          rewards.push({
            type: "badge",
            value: { badgeCode: badgeCodeValue },
            name: rewardName,
            awardedAt: new Date(),
          });
        } else {
          errors.push(`Failed to unlock badge: ${badgeCodeValue}`);
        }
        break;

      case "discount":
        // Discount rewards are handled at checkout/order level
        rewards.push({
          type: "discount",
          value: rewardValue as Reward["value"],
          name: rewardName,
          awardedAt: new Date(),
        });
        break;

      default:
        // Unknown reward type - log but don't fail
        rewards.push({
          type: rewardType as Reward["type"],
          value: (typeof rewardValue === "object" ? rewardValue : { value: rewardValue }) as Reward["value"],
          name: rewardName,
          awardedAt: new Date(),
        });
    }
  }
}

// Export singleton instance
export const rewardEngine = new RewardEngine();


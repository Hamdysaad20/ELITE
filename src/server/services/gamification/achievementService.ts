/**
 * Achievement Service
 * 
 * Handles achievement progress tracking and completion
 */

import { prisma } from "@/server/db/client";
import { isValidUserId, isValidAchievementCode, isValidIncrement } from "./validation";

export interface AchievementProgress {
  achievementId: string;
  progress: number;
  target: number;
  isCompleted: boolean;
  completedAt?: Date;
}

/**
 * Get or create user achievement progress
 */
export async function getUserAchievement(
  userId: string,
  achievementCode: string
): Promise<AchievementProgress | null> {
  try {
    const achievement = await prisma.achievement.findUnique({
      where: { code: achievementCode },
      include: { rewards: { where: { isActive: true }, orderBy: { priority: "asc" } } },
    });

    if (!achievement || !achievement.isActive) {
      return null;
    }

    let userAchievement = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId: achievement.id,
        },
      },
    });

    if (!userAchievement) {
      userAchievement = await prisma.userAchievement.create({
        data: {
          userId,
          achievementId: achievement.id,
          progress: 0,
          target: achievement.requirementValue,
          rewardsAwarded: [],
        },
      });
    }

    return {
      achievementId: achievement.id,
      progress: userAchievement.progress,
      target: userAchievement.target,
      isCompleted: userAchievement.isCompleted,
      completedAt: userAchievement.completedAt || undefined,
    };
  } catch (error) {
    console.error(`Error getting user achievement ${achievementCode}:`, error);
    return null;
  }
}

/**
 * Update achievement progress
 * 
 * @param userId User ID
 * @param achievementCode Achievement code
 * @param increment Progress increment (default: 1)
 * @returns Updated progress and whether achievement was completed
 */
export async function updateAchievementProgress(
  userId: string,
  achievementCode: string,
  increment: number = 1
): Promise<{ progress: AchievementProgress | null; completed: boolean }> {
  try {
    // Input validation
    if (!isValidUserId(userId)) {
      console.error(`Invalid userId format: ${userId}`);
      return { progress: null, completed: false };
    }

    if (!isValidAchievementCode(achievementCode)) {
      console.error(`Invalid achievement code format: ${achievementCode}`);
      return { progress: null, completed: false };
    }

    if (!isValidIncrement(increment)) {
      console.error(`Invalid increment: ${increment}`);
      return { progress: null, completed: false };
    }
    const achievement = await prisma.achievement.findUnique({
      where: { code: achievementCode },
      include: { rewards: { where: { isActive: true }, orderBy: { priority: "asc" } } },
    });

    if (!achievement || !achievement.isActive) {
      return { progress: null, completed: false };
    }

    // Get or create user achievement
    let userAchievement = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId: achievement.id,
        },
      },
    });

    if (!userAchievement) {
      userAchievement = await prisma.userAchievement.create({
        data: {
          userId,
          achievementId: achievement.id,
          progress: 0,
          target: achievement.requirementValue,
          rewardsAwarded: [],
        },
      });
    }

    // Don't update if already completed
    if (userAchievement.isCompleted) {
      return {
        progress: {
          achievementId: achievement.id,
          progress: userAchievement.progress,
          target: userAchievement.target,
          isCompleted: true,
          completedAt: userAchievement.completedAt || undefined,
        },
        completed: false,
      };
    }

    // Validate increment
    if (increment <= 0) {
      return {
        progress: {
          achievementId: achievement.id,
          progress: userAchievement.progress,
          target: userAchievement.target,
          isCompleted: userAchievement.isCompleted,
          completedAt: userAchievement.completedAt || undefined,
        },
        completed: false,
      };
    }

    // Update progress (cap at target to prevent overflow)
    const newProgress = Math.min(userAchievement.progress + increment, userAchievement.target);
    const isCompleted = newProgress >= userAchievement.target;

    const updated = await prisma.userAchievement.update({
      where: { id: userAchievement.id },
      data: {
        progress: newProgress,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
    });

    return {
      progress: {
        achievementId: achievement.id,
        progress: updated.progress,
        target: updated.target,
        isCompleted: updated.isCompleted,
        completedAt: updated.completedAt || undefined,
      },
      completed: isCompleted && !userAchievement.isCompleted,
    };
  } catch (error) {
    console.error(`Error updating achievement progress ${achievementCode}:`, error);
    return { progress: null, completed: false };
  }
}

/**
 * Get all user achievements with progress
 */
export async function getUserAchievements(userId: string) {
  try {
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: {
          include: {
            rewards: { where: { isActive: true }, orderBy: { priority: "asc" } },
          },
        },
      },
      orderBy: [
        { isCompleted: "desc" },
        { updatedAt: "desc" },
      ],
    });

    return userAchievements.map((ua: {
      id: string;
      achievement: {
        code: string;
        name: string;
        description: string;
        category: string;
        icon: string | null;
        tier: string;
        rewards: Array<{
          id: string;
          rewardType: string;
          rewardValue: unknown;
          rewardName: string;
          priority: number;
        }>;
      };
      progress: number;
      target: number;
      isCompleted: boolean;
      completedAt: Date | null;
    }) => ({
      id: ua.id,
      code: ua.achievement.code,
      name: ua.achievement.name,
      description: ua.achievement.description,
      category: ua.achievement.category,
      icon: ua.achievement.icon,
      tier: ua.achievement.tier,
      progress: ua.progress,
      target: ua.target,
      isCompleted: ua.isCompleted,
      completedAt: ua.completedAt,
      rewards: ua.achievement.rewards,
    }));
  } catch (error) {
    console.error(`Error getting user achievements:`, error);
    return [];
  }
}


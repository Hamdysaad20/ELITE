/**
 * Badge Service
 * 
 * Handles badge unlocking and display
 */

import { prisma } from "@/server/db/client";

export interface BadgeData {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: string;
  unlockedAt?: Date;
  isDisplayed: boolean;
}

/**
 * Check if user has badge
 */
export async function userHasBadge(
  userId: string,
  badgeCode: string
): Promise<boolean> {
  try {
    const badge = await prisma.badge.findUnique({
      where: { code: badgeCode },
    });

    if (!badge) return false;

    const userBadge = await prisma.userBadge.findUnique({
      where: {
        userId_badgeId: {
          userId,
          badgeId: badge.id,
        },
      },
    });

    return !!userBadge;
  } catch (error) {
    console.error(`Error checking badge ${badgeCode}:`, error);
    return false;
  }
}

/**
 * Unlock badge for user
 * 
 * @param userId User ID
 * @param badgeCode Badge code
 * @returns Success status and badge data
 */
export async function unlockBadge(
  userId: string,
  badgeCode: string
): Promise<{ success: boolean; badge: BadgeData | null }> {
  try {
    const badge = await prisma.badge.findUnique({
      where: { code: badgeCode },
    });

    if (!badge || !badge.isActive) {
      return { success: false, badge: null };
    }

    // Check if already unlocked
    const existing = await prisma.userBadge.findUnique({
      where: {
        userId_badgeId: {
          userId,
          badgeId: badge.id,
        },
      },
    });

    if (existing) {
      return {
        success: true,
        badge: {
          id: badge.id,
          code: badge.code,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          category: badge.category,
          rarity: badge.rarity,
          unlockedAt: existing.unlockedAt,
          isDisplayed: existing.isDisplayed,
        },
      };
    }

    // Unlock badge
    const userBadge = await prisma.userBadge.create({
      data: {
        userId,
        badgeId: badge.id,
        isDisplayed: true,
      },
    });

    return {
      success: true,
      badge: {
        id: badge.id,
        code: badge.code,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        category: badge.category,
        rarity: badge.rarity,
        unlockedAt: userBadge.unlockedAt,
        isDisplayed: userBadge.isDisplayed,
      },
    };
  } catch (error) {
    console.error(`Error unlocking badge ${badgeCode}:`, error);
    return { success: false, badge: null };
  }
}

/**
 * Get all user badges
 */
export async function getUserBadges(userId: string): Promise<BadgeData[]> {
  try {
    const userBadges = await prisma.userBadge.findMany({
      where: { userId, isDisplayed: true },
      include: { badge: true },
      orderBy: { unlockedAt: "desc" },
    });

    return userBadges.map((ub: {
      badge: {
        id: string;
        code: string;
        name: string;
        description: string;
        icon: string;
        category: string;
        rarity: string;
      };
      unlockedAt: Date;
      isDisplayed: boolean;
    }) => ({
      id: ub.badge.id,
      code: ub.badge.code,
      name: ub.badge.name,
      description: ub.badge.description,
      icon: ub.badge.icon,
      category: ub.badge.category,
      rarity: ub.badge.rarity,
      unlockedAt: ub.unlockedAt,
      isDisplayed: ub.isDisplayed,
    }));
  } catch (error) {
    console.error(`Error getting user badges:`, error);
    return [];
  }
}

/**
 * Check if badge should be unlocked based on achievement
 */
export async function checkBadgeUnlockFromAchievement(
  userId: string,
  achievementCode: string
): Promise<BadgeData[]> {
  try {
    // Find all badges that unlock from achievements
    // Note: Prisma doesn't support JSON path queries directly, so we fetch all and filter
    const badges = await prisma.badge.findMany({
      where: {
        isActive: true,
        unlockType: "achievement",
      },
    });

    const unlockedBadges: BadgeData[] = [];

    // Filter badges that match the achievement code
    for (const badge of badges) {
      const unlockData = badge.unlockData as { achievementCode?: string } | null;
      if (unlockData?.achievementCode === achievementCode) {
        const result = await unlockBadge(userId, badge.code);
        if (result.success && result.badge) {
          unlockedBadges.push(result.badge);
        }
      }
    }

    return unlockedBadges;
  } catch (error) {
    console.error(`Error checking badge unlock from achievement:`, error);
    return [];
  }
}


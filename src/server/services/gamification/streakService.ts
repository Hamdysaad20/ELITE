/**
 * Streak Service
 * 
 * Handles streak tracking with grace periods
 */

import { prisma } from "@/server/db/client";

export interface StreakData {
  streakType: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityAt?: Date;
  gracePeriodHours: number;
}

/**
 * Get or create user streak
 */
export async function getUserStreak(
  userId: string,
  streakType: string
): Promise<StreakData | null> {
  try {
    let streak = await prisma.userStreak.findUnique({
      where: {
        userId_streakType: {
          userId,
          streakType,
        },
      },
    });

    if (!streak) {
      streak = await prisma.userStreak.create({
        data: {
          userId,
          streakType,
          currentStreak: 0,
          longestStreak: 0,
          gracePeriodHours: 4,
        },
      });
    }

    return {
      streakType: streak.streakType,
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastActivityAt: streak.lastActivityAt || undefined,
      gracePeriodHours: streak.gracePeriodHours,
    };
  } catch (error) {
    console.error(`Error getting user streak ${streakType}:`, error);
    return null;
  }
}

/**
 * Increment or reset streak based on grace period
 * 
 * @param userId User ID
 * @param streakType Type of streak (e.g., "deal_purchase", "daily_checkin")
 * @returns Updated streak data and whether streak was incremented or reset
 */
export async function updateStreak(
  userId: string,
  streakType: string
): Promise<{ streak: StreakData | null; incremented: boolean; reset: boolean }> {
  try {
    let streak = await prisma.userStreak.findUnique({
      where: {
        userId_streakType: {
          userId,
          streakType,
        },
      },
    });

    const now = new Date();
    const gracePeriodHours = streak?.gracePeriodHours || 4;

    if (!streak) {
      // Create new streak
      streak = await prisma.userStreak.create({
        data: {
          userId,
          streakType,
          currentStreak: 1,
          longestStreak: 1,
          lastActivityAt: now,
          gracePeriodHours,
        },
      });

      return {
        streak: {
          streakType: streak.streakType,
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          lastActivityAt: streak.lastActivityAt || undefined,
          gracePeriodHours: streak.gracePeriodHours,
        },
        incremented: true,
        reset: false,
      };
    }

    // Check if within grace period
    const lastActivity = streak.lastActivityAt;
    if (!lastActivity) {
      // First activity
      const updated = await prisma.userStreak.update({
        where: { id: streak.id },
        data: {
          currentStreak: 1,
          longestStreak: Math.max(1, streak.longestStreak),
          lastActivityAt: now,
        },
      });

      return {
        streak: {
          streakType: updated.streakType,
          currentStreak: updated.currentStreak,
          longestStreak: updated.longestStreak,
          lastActivityAt: updated.lastActivityAt || undefined,
          gracePeriodHours: updated.gracePeriodHours,
        },
        incremented: true,
        reset: false,
      };
    }

    // Calculate hours since last activity
    const hoursSinceLastActivity =
      (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

    // Check if within grace period (e.g., 4 hours = can maintain streak if activity within 24-28 hours)
    const expectedInterval = 24; // Daily streak
    const maxInterval = expectedInterval + gracePeriodHours;

    if (hoursSinceLastActivity <= maxInterval) {
      // Within grace period - increment streak
      const newStreak = streak.currentStreak + 1;
      const updated = await prisma.userStreak.update({
        where: { id: streak.id },
        data: {
          currentStreak: newStreak,
          longestStreak: Math.max(newStreak, streak.longestStreak),
          lastActivityAt: now,
        },
      });

      return {
        streak: {
          streakType: updated.streakType,
          currentStreak: updated.currentStreak,
          longestStreak: updated.longestStreak,
          lastActivityAt: updated.lastActivityAt || undefined,
          gracePeriodHours: updated.gracePeriodHours,
        },
        incremented: true,
        reset: false,
      };
    } else {
      // Outside grace period - reset streak
      const updated = await prisma.userStreak.update({
        where: { id: streak.id },
        data: {
          currentStreak: 1,
          lastActivityAt: now,
        },
      });

      return {
        streak: {
          streakType: updated.streakType,
          currentStreak: updated.currentStreak,
          longestStreak: streak.longestStreak, // Keep longest streak
          lastActivityAt: updated.lastActivityAt || undefined,
          gracePeriodHours: updated.gracePeriodHours,
        },
        incremented: false,
        reset: true,
      };
    }
  } catch (error) {
    console.error(`Error updating streak ${streakType}:`, error);
    return { streak: null, incremented: false, reset: false };
  }
}

/**
 * Get all user streaks
 */
export async function getUserStreaks(userId: string): Promise<StreakData[]> {
  try {
    const streaks = await prisma.userStreak.findMany({
      where: { userId },
      orderBy: { currentStreak: "desc" },
    });

    return streaks.map((s: {
      streakType: string;
      currentStreak: number;
      longestStreak: number;
      lastActivityAt: Date | null;
      gracePeriodHours: number;
    }) => ({
      streakType: s.streakType,
      currentStreak: s.currentStreak,
      longestStreak: s.longestStreak,
      lastActivityAt: s.lastActivityAt || undefined,
      gracePeriodHours: s.gracePeriodHours,
    }));
  } catch (error) {
    console.error(`Error getting user streaks:`, error);
    return [];
  }
}


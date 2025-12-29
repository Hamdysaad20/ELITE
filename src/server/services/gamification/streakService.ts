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

    // For daily streaks, use calendar date comparison instead of hours
    // This ensures a purchase at 10 PM and 8 AM next day correctly increments the streak
    // Use specific streak types to avoid false positives (e.g., "weekly_daily_checkin")
    const isDailyStreak = streakType === "deal_purchase" || 
                          streakType === "daily_checkin" ||
                          streakType.startsWith("daily_");
    
    if (isDailyStreak) {
      // Validate timestamps (handle clock skew - future timestamps)
      if (now.getTime() < lastActivity.getTime()) {
        console.warn(
          `⚠️ Clock skew detected for streak ${streakType}: now (${now.toISOString()}) < lastActivity (${lastActivity.toISOString()})`
        );
        // Use lastActivity as "now" to prevent incorrect behavior
        const adjustedNow = new Date(lastActivity);
        adjustedNow.setTime(adjustedNow.getTime() + 1000); // Add 1 second to ensure it's after
        return {
          streak: {
            streakType: streak.streakType,
            currentStreak: streak.currentStreak,
            longestStreak: streak.longestStreak,
            lastActivityAt: streak.lastActivityAt || undefined,
            gracePeriodHours: streak.gracePeriodHours,
          },
          incremented: false,
          reset: false,
        };
      }

      // Compare calendar dates
      const lastDate = new Date(lastActivity);
      lastDate.setHours(0, 0, 0, 0);
      const currentDate = new Date(now);
      currentDate.setHours(0, 0, 0, 0);
      
      const daysDifference = Math.floor(
        (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Validate daysDifference (should be >= 0 after clock skew check)
      if (daysDifference < 0) {
        console.warn(
          `⚠️ Negative days difference for streak ${streakType}: ${daysDifference}. This should not happen after clock skew check.`
        );
        // Treat as same day to be safe
        const updated = await prisma.userStreak.update({
          where: { id: streak.id },
          data: {
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
          incremented: false,
          reset: false,
        };
      }
      
      if (daysDifference === 0) {
        // Same day - don't increment, just update timestamp
        const updated = await prisma.userStreak.update({
          where: { id: streak.id },
          data: {
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
          incremented: false,
          reset: false,
        };
      } else if (daysDifference === 1) {
        // Consecutive day - increment streak
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
        // More than 1 day gap - reset streak
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
    } else {
      // For non-daily streaks, use the original hour-based logic
      const hoursSinceLastActivity =
        (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

      // Check if within grace period (e.g., 4 hours = can maintain streak if activity within 24-28 hours)
      const expectedInterval = 24; // Default interval
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


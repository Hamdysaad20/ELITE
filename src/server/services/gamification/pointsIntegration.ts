/**
 * Points Integration Service
 * 
 * Integrates gamification rewards with existing points systems:
 * - LoyaltyAccount / LoyaltyLedger (1 point per 10 EGP)
 * - UserPoints / PointsTransaction (1 EGP = 100 points)
 */

import { addBonusPoints } from "@/server/services/loyalty";
import { updateUserPoints } from "@/lib/analytics/points";

export type PointsSystem = "loyalty" | "analytics" | "both";

/**
 * Award points across one or both points systems
 * 
 * @param userId User ID
 * @param points Points to award
 * @param reason Reason for awarding points
 * @param system Which system(s) to use
 * @returns Success status
 */
export async function awardPointsReward(
  userId: string,
  points: number,
  reason: string,
  system: PointsSystem = "both"
): Promise<boolean> {
  try {
    const results = await Promise.allSettled([
      system === "loyalty" || system === "both"
        ? addBonusPoints(userId, points, reason)
        : Promise.resolve(true),
      system === "analytics" || system === "both"
        ? updateUserPoints(userId, points, "earn", undefined, reason)
        : Promise.resolve(true),
    ]);

    const allSucceeded = results.every(
      (r) => r.status === "fulfilled" && r.value === true
    );

    if (!allSucceeded) {
      console.warn(
        `⚠️ Some points systems failed for user ${userId}:`,
        results.map((r, i) => ({
          system: i === 0 ? "loyalty" : "analytics",
          status: r.status,
          error: r.status === "rejected" ? r.reason : null,
        }))
      );
    }

    return allSucceeded;
  } catch (error) {
    console.error(`❌ Error awarding points to user ${userId}:`, error);
    return false;
  }
}

/**
 * Convert points between systems
 * 
 * Loyalty: 1 point per 10 EGP
 * Analytics: 100 points per 1 EGP
 * 
 * @param points Points in source system
 * @param from Source system
 * @param to Target system
 * @returns Converted points
 */
export function convertPoints(
  points: number,
  from: "loyalty" | "analytics",
  to: "loyalty" | "analytics"
): number {
  if (from === to) return points;

  // Loyalty to Analytics: 1 loyalty point = 0.1 EGP = 10 analytics points
  // (Loyalty: 1 point per 10 EGP, so 1 point = 0.1 EGP)
  // (Analytics: 100 points per 1 EGP, so 0.1 EGP = 10 analytics points)
  if (from === "loyalty" && to === "analytics") {
    return points * 10;
  }

  // Analytics to Loyalty: 10 analytics points = 0.1 EGP = 1 loyalty point
  // (Analytics: 100 points per 1 EGP, so 10 points = 0.1 EGP)
  // (Loyalty: 1 point per 10 EGP, so 0.1 EGP = 1 loyalty point)
  if (from === "analytics" && to === "loyalty") {
    return Math.floor(points / 10);
  }

  return points;
}


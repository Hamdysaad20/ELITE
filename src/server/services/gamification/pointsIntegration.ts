/**
 * Points Integration Service
 * 
 * Integrates gamification rewards with existing points systems:
 * - LoyaltyAccount / LoyaltyLedger (1 point per 10 EGP)
 * - UserPoints / PointsTransaction (1 EGP = 100 points)
 */

import { addBonusPoints } from "@/server/services/loyalty";
import { updateUserPoints } from "@/lib/analytics/points";
import { enqueuePointsRetry } from "./pointsRetry";

export type PointsSystem = "loyalty" | "analytics" | "both";

/**
 * Result of awarding points with detailed success information
 */
export interface PointsAwardResult {
  success: boolean; // True if all requested systems succeeded
  partialSuccess: boolean; // True if at least one system succeeded
  loyalty: {
    attempted: boolean;
    succeeded: boolean;
    error?: string;
  };
  analytics: {
    attempted: boolean;
    succeeded: boolean;
    error?: string;
    pointsAwarded?: number; // Actual points awarded (after conversion)
  };
  timestamp: string;
}

/**
 * Enhanced logging for points operations
 */
interface PointsLogContext {
  userId: string;
  points: number;
  reason: string;
  system: PointsSystem;
  result: PointsAwardResult;
  duration?: number; // Operation duration in ms
}

/**
 * Log points operation with structured data
 */
function logPointsOperation(
  context: PointsLogContext,
  severity: "info" | "warn" | "error" = "info"
): void {
  const log = {
    timestamp: new Date().toISOString(),
    event: "gamification.points.award",
    severity,
    context: {
      userId: context.userId,
      points: context.points,
      reason: context.reason,
      system: context.system,
      result: {
        success: context.result.success,
        partialSuccess: context.result.partialSuccess,
        loyalty: {
          attempted: context.result.loyalty.attempted,
          succeeded: context.result.loyalty.succeeded,
          error: context.result.loyalty.error,
        },
        analytics: {
          attempted: context.result.analytics.attempted,
          succeeded: context.result.analytics.succeeded,
          pointsAwarded: context.result.analytics.pointsAwarded,
          error: context.result.analytics.error,
        },
      },
      ...(context.duration && { durationMs: context.duration }),
    },
  };

  // Structured logging for monitoring
  const logMessage = JSON.stringify(log);
  
  switch (severity) {
    case "error":
      console.error(`[GAMIFICATION] ${logMessage}`);
      break;
    case "warn":
      console.warn(`[GAMIFICATION] ${logMessage}`);
      break;
    default:
      console.log(`[GAMIFICATION] ${logMessage}`);
  }

  // In production, send to monitoring service (Sentry, DataDog, etc.)
  if (process.env.NODE_ENV === "production" && severity === "error") {
    // Could integrate with Sentry here
    // Sentry.captureMessage("Points award failed", { extra: log.context });
  }
}

/**
 * Award points across one or both points systems
 * 
 * @param userId User ID
 * @param points Points to award
 * @param reason Reason for awarding points
 * @param system Which system(s) to use
 * @returns Detailed result with partial success information
 */
export async function awardPointsReward(
  userId: string,
  points: number, // Assuming these are loyalty points
  reason: string,
  system: PointsSystem = "both"
): Promise<PointsAwardResult> {
  const startTime = Date.now();
  
  try {
    // Validate input
    if (!Number.isFinite(points) || points < 0) {
      const result: PointsAwardResult = {
        success: false,
        partialSuccess: false,
        loyalty: { attempted: false, succeeded: false, error: "Invalid points value" },
        analytics: { attempted: false, succeeded: false, error: "Invalid points value" },
        timestamp: new Date().toISOString(),
      };
      
      logPointsOperation(
        {
          userId,
          points,
          reason,
          system,
          result,
          duration: Date.now() - startTime,
        },
        "error"
      );
      
      return result;
    }

    // Only convert if analytics system will be used
    const needsAnalytics = system === "analytics" || system === "both";
    const analyticsPoints = needsAnalytics 
      ? convertPoints(points, "loyalty", "analytics")
      : 0;

    const loyaltyAttempted = system === "loyalty" || system === "both";
    const analyticsAttempted = system === "analytics" || system === "both";

    const results = await Promise.allSettled([
      loyaltyAttempted
        ? addBonusPoints(userId, points, reason)
        : Promise.resolve(true),
      analyticsAttempted
        ? updateUserPoints(userId, analyticsPoints, "earn", undefined, reason)
        : Promise.resolve(true),
    ]);

    const loyaltyResult = results[0];
    const analyticsResult = results[1];

    const loyaltySucceeded = loyaltyResult.status === "fulfilled" && loyaltyResult.value === true;
    const analyticsSucceeded = analyticsResult.status === "fulfilled" && analyticsResult.value === true;

    const loyaltyError = loyaltyResult.status === "rejected" 
      ? loyaltyResult.reason instanceof Error 
        ? loyaltyResult.reason.message 
        : String(loyaltyResult.reason)
      : !loyaltySucceeded && loyaltyAttempted
      ? "Unknown error"
      : undefined;

    const analyticsError = analyticsResult.status === "rejected"
      ? analyticsResult.reason instanceof Error
        ? analyticsResult.reason.message
        : String(analyticsResult.reason)
      : !analyticsSucceeded && analyticsAttempted
      ? "Unknown error"
      : undefined;

    const allSucceeded = (!loyaltyAttempted || loyaltySucceeded) && 
                         (!analyticsAttempted || analyticsSucceeded);
    const partialSuccess = (loyaltyAttempted && loyaltySucceeded) || 
                          (analyticsAttempted && analyticsSucceeded);

    const result: PointsAwardResult = {
      success: allSucceeded,
      partialSuccess,
      loyalty: {
        attempted: loyaltyAttempted,
        succeeded: loyaltySucceeded,
        ...(loyaltyError && { error: loyaltyError }),
      },
      analytics: {
        attempted: analyticsAttempted,
        succeeded: analyticsSucceeded,
        ...(analyticsSucceeded && analyticsAttempted && { pointsAwarded: analyticsPoints }),
        ...(analyticsError && { error: analyticsError }),
      },
      timestamp: new Date().toISOString(),
    };

    // Enhanced logging
    const severity = allSucceeded ? "info" : partialSuccess ? "warn" : "error";
    logPointsOperation(
      {
        userId,
        points,
        reason,
        system,
        result,
        duration: Date.now() - startTime,
      },
      severity
    );

    // Queue failed operations for retry (only on partial success)
    if (!allSucceeded && partialSuccess) {
      try {
        if (loyaltyAttempted && !loyaltySucceeded) {
          await enqueuePointsRetry({
            userId,
            points, // Already in loyalty scale
            reason,
            system: "loyalty",
            originalTimestamp: result.timestamp,
            retryCount: 0,
            originalResult: result,
          });
        }

        if (analyticsAttempted && !analyticsSucceeded) {
          await enqueuePointsRetry({
            userId,
            points: analyticsPoints, // Already converted to analytics scale
            reason,
            system: "analytics",
            originalTimestamp: result.timestamp,
            retryCount: 0,
            originalResult: result,
          });
        }
      } catch (queueError) {
        // Log queue error but don't fail the main operation
        console.error(
          `[pointsIntegration] Failed to enqueue retry jobs for user ${userId}:`,
          queueError,
        );
      }
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const result: PointsAwardResult = {
      success: false,
      partialSuccess: false,
      loyalty: { attempted: system === "loyalty" || system === "both", succeeded: false, error: errorMessage },
      analytics: { attempted: system === "analytics" || system === "both", succeeded: false, error: errorMessage },
      timestamp: new Date().toISOString(),
    };

    logPointsOperation(
      {
        userId,
        points,
        reason,
        system,
        result,
        duration: Date.now() - startTime,
      },
      "error"
    );

    return result;
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
  // Validate input
  if (!Number.isFinite(points)) {
    console.warn(`⚠️ Invalid points value: ${points}, returning 0`);
    return 0;
  }

  if (from === to) return points;

  // Loyalty to Analytics: 1 loyalty point is earned from 10 EGP, which is 1000 analytics points.
  // (Loyalty: 1 point per 10 EGP, so 1 point = 10 EGP)
  // (Analytics: 100 points per 1 EGP, so 10 EGP = 1000 analytics points)
  if (from === "loyalty" && to === "analytics") {
    const result = points * 1000;
    // Check for overflow (JavaScript safe integer limit)
    if (!Number.isSafeInteger(result)) {
      console.warn(`⚠️ Points conversion overflow: ${points} * 1000 = ${result}`);
      return Number.MAX_SAFE_INTEGER;
    }
    return result;
  }

  // Analytics to Loyalty: 1000 analytics points (10 EGP) is 1 loyalty point.
  // (Analytics: 100 points per 1 EGP, so 1000 points = 10 EGP)
  // (Loyalty: 1 point per 10 EGP, so 10 EGP = 1 loyalty point)
  if (from === "analytics" && to === "loyalty") {
    return Math.floor(points / 1000);
  }

  return points;
}


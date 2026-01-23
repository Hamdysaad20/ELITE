/**
 * Points Retry Service
 *
 * Handles retrying failed points operations to ensure eventual consistency
 * between loyalty and analytics systems.
 */

import { prisma } from "@/server/db/client";
import { addBonusPoints } from "@/server/services/loyalty";
import { updateUserPoints } from "@/lib/analytics/points";
import {
  pointsRetryQueue,
  type PointsRetryJobData,
  createPointsRetryWorker,
  enqueuePointsRetry as enqueueToQueue,
} from "@/server/queue/pointsQueue";

/**
 * Check if points were already awarded (idempotency check)
 */
async function checkPointsAlreadyAwarded(
  userId: string,
  points: number,
  reason: string,
  system: "loyalty" | "analytics",
  originalTimestamp: string,
): Promise<boolean> {
  try {
    const originalDate = new Date(originalTimestamp);
    const timeWindowStart = new Date(originalDate.getTime() - 60000); // 1 minute before
    const timeWindowEnd = new Date(originalDate.getTime() + 300000); // 5 minutes after

    if (system === "loyalty") {
      // Check LoyaltyLedger for matching entry
      const existing = await prisma.loyaltyLedger.findFirst({
        where: {
          userId,
          reason,
          deltaPoints: points,
          createdAt: {
            gte: timeWindowStart,
            lte: timeWindowEnd,
          },
        },
      });
      return !!existing;
    } else {
      // Check PointsTransaction for matching entry
      const existing = await prisma.pointsTransaction.findFirst({
        where: {
          userId,
          reason,
          amount: points,
          type: "earn",
          createdAt: {
            gte: timeWindowStart,
            lte: timeWindowEnd,
          },
        },
      });
      return !!existing;
    }
  } catch (error) {
    console.error(
      `[pointsRetry] Error checking idempotency for ${system}:`,
      error,
    );
    // On error, assume not awarded (safer to retry than skip)
    return false;
  }
}

/**
 * Log retry operation with structured data
 */
function logRetryOperation(
  context: {
    userId: string;
    points: number;
    reason: string;
    system: "loyalty" | "analytics";
    retryCount: number;
    originalTimestamp: string;
    success: boolean;
    error?: string;
    duration?: number;
    alreadyAwarded?: boolean;
  },
  severity: "info" | "warn" | "error" = "info",
): void {
  const log = {
    timestamp: new Date().toISOString(),
    event: "gamification.points.retry",
    severity,
    context: {
      userId: context.userId,
      points: context.points,
      reason: context.reason,
      system: context.system,
      retryCount: context.retryCount,
      originalTimestamp: context.originalTimestamp,
      success: context.success,
      ...(context.error && { error: context.error }),
      ...(context.duration && { durationMs: context.duration }),
      ...(context.alreadyAwarded !== undefined && {
        alreadyAwarded: context.alreadyAwarded,
      }),
    },
  };

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

  // In production, send to monitoring service for errors
  if (process.env.NODE_ENV === "production" && severity === "error") {
    // Could integrate with Sentry here
    // Sentry.captureMessage("Points retry failed", { extra: log.context });
  }
}

/**
 * Process a points retry operation
 */
export async function processPointsRetry(
  jobData: PointsRetryJobData,
): Promise<void> {
  const startTime = Date.now();
  const { userId, points, reason, system, originalTimestamp, retryCount } =
    jobData;

  try {
    // Idempotency check: verify points weren't already awarded
    const alreadyAwarded = await checkPointsAlreadyAwarded(
      userId,
      points,
      reason,
      system,
      originalTimestamp,
    );

    if (alreadyAwarded) {
      logRetryOperation(
        {
          userId,
          points,
          reason,
          system,
          retryCount,
          originalTimestamp,
          success: true,
          duration: Date.now() - startTime,
          alreadyAwarded: true,
        },
        "info",
      );
      console.log(
        `[pointsRetry] Points already awarded for user ${userId}, system: ${system}, reason: ${reason}. Skipping retry.`,
      );
      return; // Success - points already awarded
    }

    // Attempt to award points
    let success = false;
    let error: string | undefined;

    if (system === "loyalty") {
      success = await addBonusPoints(userId, points, reason);
      if (!success) {
        error = "addBonusPoints returned false";
      }
    } else {
      try {
        await updateUserPoints(userId, points, "earn", undefined, reason);
        success = true;
      } catch (err) {
        error = err instanceof Error ? err.message : String(err);
        success = false;
      }
    }

    if (success) {
      logRetryOperation(
        {
          userId,
          points,
          reason,
          system,
          retryCount,
          originalTimestamp,
          success: true,
          duration: Date.now() - startTime,
        },
        "info",
      );
      console.log(
        `[pointsRetry] Successfully retried points award for user ${userId}, system: ${system}, points: ${points}`,
      );
    } else {
      // Determine if this is a permanent error (don't retry) or transient (retry)
      const isPermanentError =
        error?.includes("not found") ||
        error?.includes("invalid") ||
        error?.includes("Invalid");

      if (isPermanentError && retryCount === 0) {
        // Permanent error on first retry - don't continue retrying
        logRetryOperation(
          {
            userId,
            points,
            reason,
            system,
            retryCount,
            originalTimestamp,
            success: false,
            error: `Permanent error: ${error}`,
            duration: Date.now() - startTime,
          },
          "error",
        );
        console.error(
          `[pointsRetry] Permanent error detected, stopping retries: ${error}`,
        );
        return; // Don't throw - let BullMQ mark as failed
      }

      // Transient error - throw to trigger retry
      throw new Error(error || "Unknown error during points retry");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isMaxRetries = retryCount >= 4; // 0-indexed, so 4 means 5th attempt

    logRetryOperation(
      {
        userId,
        points,
        reason,
        system,
        retryCount,
        originalTimestamp,
        success: false,
        error: errorMessage,
        duration: Date.now() - startTime,
      },
      isMaxRetries ? "error" : "warn",
    );

    if (isMaxRetries) {
      console.error(
        `[pointsRetry] Max retries reached for user ${userId}, system: ${system}. Manual intervention required.`,
      );
      // Could send alert to monitoring service here
    } else {
      console.warn(
        `[pointsRetry] Retry ${retryCount + 1} failed for user ${userId}, system: ${system}: ${errorMessage}`,
      );
    }

    // Re-throw to trigger BullMQ retry mechanism
    throw error;
  }
}

/**
 * Start the points retry worker
 */
export function startPointsRetryWorker() {
  return createPointsRetryWorker(async (job) => {
    await processPointsRetry(job.data);
  });
}

/**
 * Enqueue a points retry operation
 *
 * Strategy:
 * 1. In serverless (Vercel/Netlify): Run inline retry directly (no queue worker available)
 * 2. In non-serverless with Redis: Queue the job for async processing with retries
 * 3. In non-serverless without Redis: Run inline retry as fallback
 */
export async function enqueuePointsRetry(
  data: PointsRetryJobData,
): Promise<void> {
  const isServerlessEnv =
    process.env.VERCEL === "1" || process.env.NETLIFY === "true";

  // In serverless environments, skip the queue and run inline
  // Queue workers don't run in serverless, so jobs would never be processed
  if (isServerlessEnv) {
    console.log(
      `[pointsRetry] Serverless detected, running inline retry for user ${data.userId}, system: ${data.system}`,
    );
    // Run synchronously (await) so retry completes before function terminates
    try {
      await processPointsRetry(data);
    } catch (err) {
      console.error(
        `[pointsRetry] Inline retry failed for user ${data.userId}:`,
        err,
      );
      // In serverless, we can't retry again, so log and continue
      // The partial success was already handled in the main flow
    }
    return;
  }

  // In non-serverless environments, use the queue
  if (!pointsRetryQueue) {
    console.warn(
      `[pointsRetry] Queue not available (REDIS_URL not set), running inline retry for user ${data.userId}`,
    );
    // Fallback to inline retry
    try {
      await processPointsRetry(data);
    } catch (err) {
      console.error(
        `[pointsRetry] Inline retry failed for user ${data.userId}:`,
        err,
      );
    }
    return;
  }

  // Queue the retry job
  const jobId = await enqueueToQueue(data);
  if (!jobId) {
    console.error(
      `[pointsRetry] Failed to enqueue retry job for user ${data.userId}`,
    );
    // Fallback to inline retry on queue failure
    try {
      await processPointsRetry(data);
    } catch (err) {
      console.error(
        `[pointsRetry] Fallback inline retry failed for user ${data.userId}:`,
        err,
      );
    }
  }
}

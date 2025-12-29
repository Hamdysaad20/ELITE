/**
 * Auto-start Points Retry worker when the application initializes
 * 
 * IMPORTANT: This implementation handles:
 * - Serverless environments (Vercel, Netlify, AWS Lambda)
 * - Multiple instances (horizontal scaling)
 * - Edge runtime compatibility
 * - Graceful degradation
 * - Resource cleanup
 * 
 * Strategy:
 * - Serverless: Use Redis-based distributed locking to ensure only ONE worker across all instances
 * - Traditional hosting: Start worker locally with proper lifecycle management
 * - Fallback: Inline retry if Redis/worker unavailable
 */

import { startPointsRetryWorker } from "./gamification/pointsRetry";
import { createPointsRetryQueueEvents } from "@/server/queue/pointsQueue";

let workerStarted = false;
let worker: ReturnType<typeof startPointsRetryWorker> | null = null;
let lockAcquired = false;
let lockCheckInterval: NodeJS.Timeout | null = null;
let shutdownHandlersAttached = false;

/**
 * Detect if we're in a serverless environment
 */
function isServerless(): boolean {
  return (
    process.env.VERCEL === "1" ||
    process.env.NETLIFY === "true" ||
    process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined ||
    process.env.FLY_APP_NAME !== undefined ||
    process.env.RAILWAY_ENVIRONMENT !== undefined
  );
}

/**
 * Detect if we're in a build environment (should not start worker)
 */
function isBuildTime(): boolean {
  return (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.NEXT_PHASE === "phase-development-build" ||
    (process.env.VERCEL_ENV === undefined &&
      process.env.NODE_ENV === "production" &&
      !process.env.VERCEL)
  );
}

/**
 * Detect if we're in Edge runtime (no Node.js APIs)
 */
function isEdgeRuntime(): boolean {
  // Edge runtime doesn't have process.env or Node.js APIs
  return (
    typeof process === "undefined" ||
    typeof process.env === "undefined" ||
    // Check for Edge runtime specific globals (if available)
    (typeof globalThis !== "undefined" && "EdgeRuntime" in globalThis)
  );
}

/**
 * Use Redis-based distributed locking to ensure only ONE worker runs across all instances
 * This is critical for serverless environments where multiple instances can spawn
 */
async function acquireDistributedLock(): Promise<boolean> {
  // Only use distributed locking in serverless environments
  if (!isServerless()) {
    return true; // In traditional hosting, each instance can have its own worker
  }

  // Don't try to acquire lock if Redis URL is not set
  if (!process.env.REDIS_URL) {
    return false;
  }

  try {
    const redis = await import("redis");
    const client = redis.createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: false, // Don't reconnect in serverless
      },
    });

    await client.connect();

    const lockKey = "points-retry:worker:lock";
    const instanceId = process.env.VERCEL_REGION
      ? `${process.env.VERCEL_REGION}-${process.env.VERCEL_INSTANCE_ID || Date.now()}`
      : `instance-${Date.now()}`;
    const lockValue = instanceId;
    const lockTTL = 60; // 60 seconds - worker must renew lock

    // Try to acquire lock (SET NX EX)
    const acquired = await client.setNX(lockKey, lockValue);
    if (acquired) {
      await client.expire(lockKey, lockTTL);
      lockAcquired = true;

      // Set up lock renewal interval
      lockCheckInterval = setInterval(async () => {
        try {
          const redis = await import("redis");
          const renewalClient = redis.createClient({
            url: process.env.REDIS_URL,
            socket: {
              reconnectStrategy: false,
            },
          });
          await renewalClient.connect();

          const currentValue = await renewalClient.get(lockKey);
          if (currentValue === lockValue) {
            await renewalClient.expire(lockKey, lockTTL);
          } else {
            // Lock was lost, shutdown worker
            console.warn(
              "[points-retry-worker] Lost distributed lock, shutting down worker",
            );
            await shutdownWorker();
          }
          await renewalClient.quit();
        } catch (err) {
          console.error("[points-retry-worker] Error renewing lock:", err);
        }
      }, 30000); // Renew every 30 seconds

      await client.quit();
      return true;
    }

    await client.quit();
    console.log(
      "[points-retry-worker] Another instance is running the worker (distributed lock held)",
    );
    return false;
  } catch (error) {
    console.error(
      "[points-retry-worker] Failed to acquire distributed lock:",
      error,
    );
    // Don't start worker if lock acquisition fails in serverless
    // This prevents duplicate workers
    return false;
  }
}

/**
 * Release distributed lock
 */
async function releaseDistributedLock(): Promise<void> {
  if (!lockAcquired || !isServerless()) {
    return;
  }

  try {
    if (lockCheckInterval) {
      clearInterval(lockCheckInterval);
      lockCheckInterval = null;
    }

    if (!process.env.REDIS_URL) {
      return;
    }

    const redis = await import("redis");
    const client = redis.createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: false,
      },
    });
    await client.connect();

    await client.del("points-retry:worker:lock");
    await client.quit();
    lockAcquired = false;
  } catch (error) {
    console.error("[points-retry-worker] Error releasing lock:", error);
  }
}

/**
 * Shutdown worker gracefully
 */
async function shutdownWorker(): Promise<void> {
  if (!worker) {
    return;
  }

  try {
    console.log("[points-retry-worker] Shutting down gracefully...");
    await worker.close();
    await releaseDistributedLock();
    worker = null;
    workerStarted = false;
  } catch (error) {
    console.error("[points-retry-worker] Error during shutdown:", error);
  }
}

/**
 * Attach shutdown handlers (only once)
 */
function attachShutdownHandlers(): void {
  if (shutdownHandlersAttached) {
    return;
  }

  // Only attach handlers in Node.js environment (not Edge runtime)
  if (isEdgeRuntime()) {
    return;
  }

  const shutdown = async (signal: string) => {
    console.log(`[points-retry-worker] Received ${signal}, shutting down...`);
    await shutdownWorker();
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  // Handle uncaught errors
  process.on("uncaughtException", async (error) => {
    console.error("[points-retry-worker] Uncaught exception:", error);
    await shutdownWorker();
    process.exit(1);
  });

  process.on("unhandledRejection", async (reason) => {
    console.error("[points-retry-worker] Unhandled rejection:", reason);
    // Don't exit on unhandled rejection, just log
  });

  shutdownHandlersAttached = true;
}

/**
 * Start the Points Retry worker if conditions are met
 */
export async function initializePointsRetryWorker(): Promise<
  ReturnType<typeof startPointsRetryWorker> | null
> {
  // Only start once per instance
  if (workerStarted) {
    return worker;
  }

  // Don't start during build time
  if (isBuildTime()) {
    console.log(
      "[points-retry-worker] Skipping worker start (build time detected)",
    );
    return null;
  }

  // Don't start in Edge runtime
  if (isEdgeRuntime()) {
    console.log(
      "[points-retry-worker] Skipping worker start (Edge runtime detected)",
    );
    return null;
  }

  // Don't start if Redis is not configured (fallback retry will handle it)
  if (!process.env.REDIS_URL) {
    console.log(
      "[points-retry-worker] Skipping worker start (REDIS_URL not configured, using fallback retry)",
    );
    return null;
  }

  try {
    // In serverless, use distributed locking to prevent duplicate workers
    if (isServerless()) {
      const lockAcquired = await acquireDistributedLock();
      if (!lockAcquired) {
        console.log(
          "[points-retry-worker] Worker already running on another instance",
        );
        return null;
      }
    }

    // Start the worker
    worker = startPointsRetryWorker();
    if (worker) {
      workerStarted = true;
      attachShutdownHandlers();

      // Set up worker event listeners for better observability
      worker.on("completed", (job) => {
        console.log(`[points-retry-worker] Job ${job.id} completed`);
      });

      worker.on("failed", (job, err) => {
        console.error(`[points-retry-worker] Job ${job?.id} failed:`, err);
      });

      worker.on("error", (err) => {
        console.error("[points-retry-worker] Worker error:", err);
      });

      console.log(
        "[points-retry-worker] Auto-started successfully" +
          (isServerless() ? " (with distributed lock)" : ""),
      );
    } else {
      console.log(
        "[points-retry-worker] Worker not started (Redis not configured)",
      );
      await releaseDistributedLock();
    }
  } catch (error) {
    console.error("[points-retry-worker] Failed to start:", error);
    await releaseDistributedLock();
    workerStarted = false;
  }

  return worker;
}

// Auto-initialize when module is loaded (only in Node.js environment)
// Skip during build time to avoid starting worker during Next.js build
if (
  !isBuildTime() &&
  !isEdgeRuntime() &&
  typeof process !== "undefined" &&
  process.env
) {
  // Use setImmediate to avoid blocking module loading
  // In serverless, this will run on first API call
  setImmediate(async () => {
    // Auto-start worker:
    // - In traditional hosting: Always start
    // - In serverless (Vercel): Start with distributed locking (only one instance runs worker)
    // - Can be disabled by setting ENABLE_POINTS_RETRY_WORKER=false
    const shouldStart = process.env.ENABLE_POINTS_RETRY_WORKER !== "false";

    if (shouldStart) {
      await initializePointsRetryWorker();
    } else {
      console.log(
        "[points-retry-worker] Auto-start disabled (ENABLE_POINTS_RETRY_WORKER=false)",
      );
    }
  });
}

// Export shutdown function for manual cleanup if needed
export { shutdownWorker };


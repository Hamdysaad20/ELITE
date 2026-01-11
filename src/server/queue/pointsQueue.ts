import { Queue, Worker, Job, QueueEvents } from "bullmq";
import type { PointsAwardResult } from "@/server/services/gamification/pointsIntegration";

const connection = {
  url: process.env.REDIS_URL,
};

if (!process.env.REDIS_URL) {
  console.warn("[pointsQueue] REDIS_URL not set; queue will not initialize.");
}

export type PointsRetryJobData = {
  userId: string;
  points: number; // Points in the target system's scale (loyalty or analytics)
  reason: string;
  system: "loyalty" | "analytics";
  originalTimestamp: string; // When original award was attempted
  retryCount: number;
  originalResult?: PointsAwardResult; // For context and debugging
};

export const pointsRetryQueue =
  process.env.REDIS_URL &&
  new Queue<PointsRetryJobData>("points-retry", {
    connection,
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        type: "exponential",
        delay: 2000, // Start with 2 seconds
      },
    },
  });

export function createPointsRetryWorker(
  handler: (job: Job<PointsRetryJobData>) => Promise<void>,
) {
  if (!process.env.REDIS_URL) {
    console.warn("[pointsQueue] REDIS_URL not set; worker not started.");
    return null;
  }
  const worker = new Worker<PointsRetryJobData>("points-retry", handler, {
    connection,
    concurrency: 3, // Lower than Odoo since points operations are faster
  });
  worker.on("failed", (job, err) => {
    console.error("[pointsQueue] job failed", job?.id, err);
  });
  worker.on("completed", (job) => {
    console.log(`[pointsQueue] job ${job.id} completed successfully`);
  });
  return worker;
}

export function createPointsRetryQueueEvents() {
  if (!process.env.REDIS_URL) return null;
  return new QueueEvents("points-retry", { connection });
}

/**
 * Enqueue a points retry job
 * @param data Points retry job data
 * @returns Job ID if queued successfully, null otherwise
 */
export async function enqueuePointsRetry(
  data: PointsRetryJobData,
): Promise<string | null> {
  if (!pointsRetryQueue) {
    console.warn("[pointsQueue] Queue not initialized (REDIS_URL not set)");
    return null;
  }

  try {
    // Calculate delay based on retry count (exponential backoff)
    const delay = Math.min(2000 * Math.pow(2, data.retryCount), 60000); // Max 60 seconds

    const job = await pointsRetryQueue.add("points-retry", data, {
      delay,
      attempts: 5,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
    });

    console.log(
      `[pointsQueue] Enqueued retry job ${job.id} for user ${data.userId}, system: ${data.system}, retry count: ${data.retryCount}`,
    );
    return job.id || null;
  } catch (error) {
    console.error("[pointsQueue] Failed to enqueue retry job:", error);
    return null;
  }
}

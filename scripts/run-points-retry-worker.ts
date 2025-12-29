// Simple worker entrypoint for points retry queue.
// Run: npm run worker:points-retry

import { startPointsRetryWorker } from "../src/server/services/gamification/pointsRetry";

async function main() {
  const worker = startPointsRetryWorker();
  if (!worker) {
    console.error("Worker not started (missing REDIS_URL).");
    process.exit(1);
  }
  console.log("[points-retry-worker] started");
  
  // Handle graceful shutdown
  process.on("SIGTERM", () => {
    console.log("[points-retry-worker] SIGTERM received, closing worker...");
    worker.close();
    process.exit(0);
  });

  process.on("SIGINT", () => {
    console.log("[points-retry-worker] SIGINT received, closing worker...");
    worker.close();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("[points-retry-worker] fatal", err);
  process.exit(1);
});


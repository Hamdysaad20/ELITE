// Simple worker entrypoint for Odoo sync queue.
// Run: npm run worker:odoo

import { startOdooWorker } from "../src/server/services/odooSync";

async function main() {
  const worker = startOdooWorker();
  if (!worker) {
    console.error("Worker not started (missing REDIS_URL).");
    process.exit(1);
  }
  console.log("[odoo-worker] started");
}

main().catch((err) => {
  console.error("[odoo-worker] fatal", err);
  process.exit(1);
});


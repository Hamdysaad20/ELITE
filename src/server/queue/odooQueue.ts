import { Queue, Worker, Job, QueueEvents } from "bullmq";

const connection = {
  url: process.env.REDIS_URL,
};

if (!process.env.REDIS_URL) {
  console.warn("[odooQueue] REDIS_URL not set; queue will not initialize.");
}

export type OdooJobData = {
  orderId: string;
  clientOrderRef: string;
  partner: {
    name?: string;
    email?: string;
    phone?: string;
    street?: string;
    city?: string;
    zip?: string;
  };
  enableSale: boolean;
  autoConfirm: boolean;
  enablePos: boolean;
  posConfigId?: number;
  posConfigName?: string;
  customerNotePerLine?: string;
};

export const odooQueue =
  process.env.REDIS_URL &&
  new Queue<OdooJobData>("odoo-sync", {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
    },
  });

export function createOdooWorker(
  handler: (job: Job<OdooJobData>) => Promise<void>,
) {
  if (!process.env.REDIS_URL) {
    console.warn("[odooQueue] REDIS_URL not set; worker not started.");
    return null;
  }
  const worker = new Worker<OdooJobData>("odoo-sync", handler, {
    connection,
    concurrency: 5,
  });
  worker.on("failed", (job, err) => {
    console.error("[odooQueue] job failed", job?.id, err);
  });
  return worker;
}

export function createOdooQueueEvents() {
  if (!process.env.REDIS_URL) return null;
  return new QueueEvents("odoo-sync", { connection });
}

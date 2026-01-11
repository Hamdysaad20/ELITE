import { NextRequest } from "next/server";
import { redisGet } from "@/server/cache/redis";
import {
  jsonResponse,
  successResponse,
  errorResponse,
} from "@/server/utils/apiHelpers";
import { odooQueue } from "@/server/queue/odooQueue";
import { getCircuitStatus } from "@/server/utils/circuitBreaker";

export async function GET(_req: NextRequest) {
  try {
    const [lastUpdate, circuitStatus] = await Promise.all([
      redisGet<string>("sync:last_update"),
      getCircuitStatus(),
    ]);

    let queueCounts: Record<string, number> | null = null;
    if (odooQueue) {
      const counts = await odooQueue.getJobCounts("wait", "active", "failed");
      queueCounts = {
        waiting: counts.wait ?? 0,
        active: counts.active ?? 0,
        failed: counts.failed ?? 0,
      };
    }

    return jsonResponse(
      successResponse({
        lastUpdate: lastUpdate || null,
        queue: queueCounts,
        circuitBreaker: {
          state: circuitStatus.state,
          failures: circuitStatus.failures,
          successes: circuitStatus.successes,
          openedAt: circuitStatus.openedAt
            ? new Date(circuitStatus.openedAt).toISOString()
            : null,
        },
      }),
    );
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Failed to fetch sync status";
    return jsonResponse(errorResponse(msg), 500);
  }
}

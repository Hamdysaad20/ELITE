import { NextRequest } from "next/server";
import {
  jsonResponse,
  successResponse,
  errorResponse,
} from "@/server/utils/apiHelpers";
import {
  resetCircuitBreaker,
  getCircuitStatus,
} from "@/server/utils/circuitBreaker";

// GET /api/sync/circuit-breaker - Get circuit breaker status
export async function GET(_req: NextRequest) {
  try {
    const status = await getCircuitStatus();
    return jsonResponse(
      successResponse({
        state: status.state,
        failures: status.failures,
        successes: status.successes,
        openedAt: status.openedAt
          ? new Date(status.openedAt).toISOString()
          : null,
      }),
    );
  } catch (err) {
    const msg =
      err instanceof Error
        ? err.message
        : "Failed to get circuit breaker status";
    return jsonResponse(errorResponse(msg), 500);
  }
}

// POST /api/sync/circuit-breaker/reset - Reset circuit breaker (admin only)
export async function POST(request: NextRequest) {
  try {
    if (request.headers.get("x-admin-token") !== process.env.ADMIN_TOKEN) {
      return jsonResponse(errorResponse("Forbidden"), 403);
    }

    console.log("[ADMIN] Circuit breaker reset requested");
    await resetCircuitBreaker();

    return jsonResponse(
      successResponse(null, "Circuit breaker reset to CLOSED state"),
    );
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Failed to reset circuit breaker";
    console.error("circuit-breaker reset error", err);
    return jsonResponse(errorResponse(msg), 500);
  }
}

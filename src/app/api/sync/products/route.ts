/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import {
  jsonResponse,
  successResponse,
  errorResponse,
} from "@/server/utils/apiHelpers";
import { syncProductsFromOdoo } from "@/server/utils/syncProducts";

export async function POST(request: NextRequest) {
  try {
    if (request.headers.get("x-admin-token") !== process.env.ADMIN_TOKEN) {
      return jsonResponse(errorResponse("Forbidden"), 403);
    }

    console.log('[MANUAL-SYNC] Admin triggered product sync');
    // Bypass circuit breaker for manual admin-triggered syncs
    // This allows recovery even if circuit breaker is open
    const result = await syncProductsFromOdoo({ bypassCircuitBreaker: true });
    
    if (!result.success) {
      return jsonResponse(errorResponse(result.error || "Sync failed"), 500);
    }

    return jsonResponse(
      successResponse(result.data, "Product sync completed"),
    );
  } catch (err: any) {
    const msg = err?.message || "Failed to sync products";
    console.error("sync/products error", err);
    return jsonResponse(errorResponse(msg), 500);
  }
}

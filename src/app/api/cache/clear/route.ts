/**
 * Cache clearing endpoint - triggers fresh sync from Odoo
 * Public endpoint (no auth required) - safe because sync has rate limiting
 */

import { NextRequest } from "next/server";
import {
  jsonResponse,
  successResponse,
  errorResponse,
} from "@/server/utils/apiHelpers";
import { syncProductsFromOdoo } from "@/server/utils/syncProducts";

export async function POST(_request: NextRequest) {
  try {
    console.log('[CACHE-CLEAR] Manual cache clear requested');
    
    // Trigger sync (has built-in rate limiting - max once per 30 seconds)
    const result = await syncProductsFromOdoo();
    
    if (!result.success) {
      return jsonResponse(
        errorResponse(result.error || "Failed to refresh cache"),
        500,
      );
    }

    return jsonResponse(
      successResponse(result.data, "Cache cleared and refreshed from Odoo"),
    );
  } catch (err: any) {
    const msg = err?.message || "Failed to clear cache";
    console.error("[CACHE-CLEAR] Error:", err);
    return jsonResponse(errorResponse(msg), 500);
  }
}

// Also support GET for easy browser testing
export async function GET(request: NextRequest) {
  return POST(request);
}


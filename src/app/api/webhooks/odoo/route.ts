import { NextRequest } from "next/server";
import {
  jsonResponse,
  successResponse,
  errorResponse,
} from "@/server/utils/apiHelpers";
import { invalidateCatalogCache } from "@/server/services/product.service";

export async function POST(request: NextRequest) {
  try {
    // Basic Security: Require the admin token in the headers OR URL params
    const token =
      request.headers.get("x-admin-token") ||
      request.nextUrl.searchParams.get("token");

    if (token !== process.env.ADMIN_TOKEN) {
      return jsonResponse(
        errorResponse("Forbidden: Invalid or missing token"),
        403,
      );
    }

    console.log("[WEBHOOK] Received product update from Odoo Automation Rule");

    // Instantly invalidate the Redis cache without heavy processing
    const result = await invalidateCatalogCache();

    if (!result.success) {
      return jsonResponse(
        errorResponse(result.message || "Cache invalidation failed"),
        500,
      );
    }

    // Return a very fast 200 response to Odoo so the Automation Rule doesn't timeout
    return jsonResponse(
      successResponse(null, "Webhook received and cache invalidated"),
    );
  } catch (err) {
    const errorMsg =
      err instanceof Error ? err.message : "Failed to process webhook";
    console.error("[WEBHOOK] Odoo webhook error:", errorMsg);
    return jsonResponse(errorResponse("Internal Server Error"), 500);
  }
}

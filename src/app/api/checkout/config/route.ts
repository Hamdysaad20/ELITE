import { NextRequest } from "next/server";
import { jsonResponse, successResponse, handleApiError } from "@/server/utils/apiHelpers";
import { getCheckoutConfig } from "@/server/services/checkoutConfig";

/**
 * GET /api/checkout/config
 * Public endpoint for frontend checkout configuration.
 */
export async function GET(_request: NextRequest) {
  try {
    const config = await getCheckoutConfig();
    const response = jsonResponse(successResponse(config));
    // Cache for 1 minute - settings can change, so we want reasonably fresh data
    // But not too aggressive to avoid hammering the database
    response.headers.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

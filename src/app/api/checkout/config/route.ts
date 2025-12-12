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
    return jsonResponse(successResponse(config));
  } catch (error) {
    return handleApiError(error);
  }
}

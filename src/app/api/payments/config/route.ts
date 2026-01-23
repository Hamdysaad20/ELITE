import { NextRequest } from "next/server";
import {
  jsonResponse,
  successResponse,
  errorResponse,
} from "@/server/utils/apiHelpers";
import {
  isPaymobConfigured,
  createPaymobClient,
} from "@/server/services/paymob/paymobClient";

/**
 * GET /api/payments/config
 * Get payment configuration for frontend (public key only)
 */
export async function GET() {
  try {
    if (!isPaymobConfigured()) {
      return jsonResponse(
        errorResponse("Payment gateway is not configured"),
        503,
      );
    }

    const client = createPaymobClient();
    if (!client) {
      return jsonResponse(
        errorResponse("Payment service is not available"),
        503,
      );
    }

    const iframeId = process.env.NEXT_PUBLIC_PAYMOB_IFRAME_ID || "983628";

    return jsonResponse(
      successResponse({
        publicKey: client.getPublicKey(),
        iframeId,
      }),
    );
  } catch (error: unknown) {
    console.error("[Payment Config] Error:", error);
    const message =
      (error as { message?: string })?.message ||
      "Failed to get payment configuration";
    return jsonResponse(errorResponse(message), 500);
  }
}

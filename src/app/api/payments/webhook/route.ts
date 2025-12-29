import { NextRequest } from "next/server";
import { jsonResponse, successResponse, errorResponse } from "@/server/utils/apiHelpers";
import { parseRequestBody } from "@/server/utils/apiHelpers";
import { processPaymobWebhook } from "@/server/services/paymob/webhookHandler";

/**
 * POST /api/payments/webhook
 * Webhook endpoint for Paymob payment callbacks
 * 
 * This endpoint receives webhook notifications from Paymob when:
 * - A payment is processed
 * - A payment status changes
 * - A refund is processed
 * 
 * Security: HMAC signature verification is handled in the webhook handler
 */
export async function POST(request: NextRequest) {
  try {
    // Parse webhook payload
    const payload = await parseRequestBody(request);

    // Process webhook
    const result = await processPaymobWebhook(payload);

    if (!result.success) {
      console.error("[Paymob Webhook] Processing failed:", result.error);
      // Return 200 to prevent Paymob from retrying invalid payloads
      // But log the error for monitoring
      return jsonResponse(
        successResponse({
          processed: false,
          error: result.error,
        }),
        200
      );
    }

    // Return success response
    return jsonResponse(
      successResponse({
        processed: true,
        orderId: result.orderId,
        paymentStatus: result.paymentStatus,
      }),
      200
    );
  } catch (error: unknown) {
    console.error("[Paymob Webhook] Error:", error);
    
    // Always return 200 to prevent Paymob retries
    // But log errors for monitoring
    return jsonResponse(
      successResponse({
        processed: false,
        error: (error as { message?: string })?.message || "Unknown error",
      }),
      200
    );
  }
}

/**
 * GET /api/payments/webhook
 * Health check endpoint for webhook URL verification
 */
export async function GET() {
  return jsonResponse(
    successResponse({
      message: "Paymob webhook endpoint is active",
      timestamp: new Date().toISOString(),
    }),
    200
  );
}


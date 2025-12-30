import { NextRequest } from "next/server";
import { jsonResponse, successResponse, errorResponse } from "@/server/utils/apiHelpers";
import { parseRequestBody } from "@/server/utils/apiHelpers";
import { processPaymobWebhook } from "@/server/services/paymob/webhookHandler";
import { checkPaymentRateLimit } from "@/server/utils/rateLimit";
import { withTimeout, REQUEST_TIMEOUTS } from "@/server/utils/timeouts";
import { trackPaymentEvent, trackApiPerformance } from "@/server/utils/analytics";

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
  const startTime = Date.now();
  try {
    // Rate limiting for webhooks (by IP to prevent abuse)
    const { getClientIp } = await import("@/server/auth/rateLimit");
    const clientIp = getClientIp(request);
    const rateLimitResult = await checkPaymentRateLimit(clientIp, "PAYMENT_WEBHOOK");
    if (!rateLimitResult.allowed) {
      // Still return 200 to prevent Paymob retries, but log the rate limit
      console.warn("[Paymob Webhook] Rate limited:", clientIp);
      return jsonResponse(successResponse({ processed: false, error: "Rate limited" }), 200);
    }

    // Parse webhook payload
    const payload = await parseRequestBody(request);

    // Process webhook with timeout
    const result = await withTimeout(
      processPaymobWebhook(payload),
      REQUEST_TIMEOUTS.PAYMENT_WEBHOOK,
      "Webhook processing timeout"
    );

    if (!result.success) {
      console.error("[Paymob Webhook] Processing failed:", result.error);
      
      // Track failed webhook
      await trackPaymentEvent("payment_failed", {
        error: result.error || "Webhook processing failed",
      });
      
      // Track API performance
      const duration = Date.now() - startTime;
      await trackApiPerformance("/api/payments/webhook", duration, 200);
      
      // Return 200 to prevent Paymob from retrying invalid payloads
      return jsonResponse(
        successResponse({
          processed: false,
          error: result.error,
        }),
        200
      );
    }

    // Track successful webhook
    if (result.paymentStatus === "PAID") {
      await trackPaymentEvent("payment_success", {
        orderId: result.orderId || undefined,
      });
    } else if (result.paymentStatus === "FAILED" || result.paymentStatus === "failed") {
      await trackPaymentEvent("payment_failed", {
        orderId: result.orderId || undefined,
      });
    } else if (result.paymentStatus === "cancelled") {
      await trackPaymentEvent("payment_cancelled", {
        orderId: result.orderId || undefined,
      });
    }

    // Track API performance
    const duration = Date.now() - startTime;
    await trackApiPerformance("/api/payments/webhook", duration, 200);

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
    const duration = Date.now() - startTime;
    await trackApiPerformance("/api/payments/webhook", duration, 200);
    
    console.error("[Paymob Webhook] Error:", error);
    
    // Track error
    await trackPaymentEvent("payment_failed", {
      error: (error as { message?: string })?.message || "Unknown webhook error",
    });
    
    // Always return 200 to prevent Paymob retries
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


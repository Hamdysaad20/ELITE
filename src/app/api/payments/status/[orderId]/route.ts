import { NextRequest } from "next/server";
import {
  jsonResponse,
  successResponse,
  errorResponse,
} from "@/server/utils/apiHelpers";
import { getAuthUser } from "@/server/auth/session";
import { getPaymentService } from "@/server/services/paymob/paymentService";
import { isPaymobConfigured } from "@/server/services/paymob/paymobClient";
import { checkPaymentRateLimit } from "@/server/utils/rateLimit";
import { withTimeout, REQUEST_TIMEOUTS } from "@/server/utils/timeouts";
import { trackApiPerformance } from "@/server/utils/analytics";

/**
 * GET /api/payments/status/[orderId]
 * Get payment status for an order
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const startTime = Date.now();
  try {
    const { orderId } = await params;

    // Check if Paymob is configured
    if (!isPaymobConfigured()) {
      return jsonResponse(
        errorResponse("Payment service is temporarily unavailable."),
        503
      );
    }

    // Authenticate user
    const authUser = await getAuthUser(request);
    if (!authUser?.id) {
      return jsonResponse(errorResponse("Please sign in to continue."), 401);
    }

    // Rate limiting
    const rateLimitResult = await checkPaymentRateLimit(authUser.id, "PAYMENT_STATUS");
    if (!rateLimitResult.allowed) {
      return jsonResponse(
        errorResponse("Too many requests. Please wait a moment."),
        429
      );
    }

    // Verify order belongs to user
    const { prisma } = await import("@/server/db/client");
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true },
    });

    if (!order) {
      return jsonResponse(errorResponse("Order not found."), 404);
    }

    if (order.userId !== authUser.id) {
      return jsonResponse(errorResponse("This order does not belong to you."), 403);
    }

    // Get payment status
    const paymentService = getPaymentService();
    if (!paymentService) {
      return jsonResponse(
        errorResponse("Payment service is temporarily unavailable."),
        503
      );
    }

    const status = await withTimeout(
      paymentService.getPaymentStatus(orderId),
      REQUEST_TIMEOUTS.PAYMENT_STATUS,
      "Status check took too long. Please try again."
    );

    // Track API performance
    const duration = Date.now() - startTime;
    await trackApiPerformance("/api/payments/status", duration, 200);

    return jsonResponse(successResponse(status));
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    await trackApiPerformance("/api/payments/status", duration, 500);
    
    console.error("[Payment Status] Error:", error);
    const message = (error as { message?: string })?.message || "Could not check payment status. Please try again.";
    return jsonResponse(errorResponse(message), 500);
  }
}


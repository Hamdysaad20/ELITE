import { NextRequest } from "next/server";
import {
  jsonResponse,
  successResponse,
  errorResponse,
} from "@/server/utils/apiHelpers";
import { getAuthUser } from "@/server/auth/session";
import { parseRequestBody } from "@/server/utils/apiHelpers";
import { createPaymentIntentSchema } from "@/server/validators/paymentSchemas";
import { getPaymentService } from "@/server/services/paymob/paymentService";
import { isPaymobConfigured } from "@/server/services/paymob/paymobClient";
import { BadRequestError, ServiceUnavailableError } from "@/server/utils/errors";
import { checkPaymentRateLimit } from "@/server/utils/rateLimit";
import { withTimeout, REQUEST_TIMEOUTS } from "@/server/utils/timeouts";
import { trackPaymentEvent, trackApiPerformance } from "@/server/utils/analytics";

/**
 * POST /api/payments/create
 * Create a payment intent for an order
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    // Check if Paymob is configured
    if (!isPaymobConfigured()) {
      return jsonResponse(
        errorResponse("Payment service is temporarily unavailable. Please try again later."),
        503
      );
    }

    // Authenticate user
    const authUser = await getAuthUser(request);
    if (!authUser?.id) {
      return jsonResponse(errorResponse("Please sign in to continue."), 401);
    }

    // Rate limiting
    const rateLimitResult = await checkPaymentRateLimit(authUser.id, "PAYMENT_CREATE");
    if (!rateLimitResult.allowed) {
      return jsonResponse(
        errorResponse("Too many payment attempts. Please wait a moment and try again."),
        429
      );
    }

    // Parse and validate request body
    const raw = await parseRequestBody(request);
    const body = createPaymentIntentSchema.parse(raw);

    // Get payment service
    const paymentService = getPaymentService();
    if (!paymentService) {
      return jsonResponse(
        errorResponse("Payment service is not available"),
        503
      );
    }

    // Verify order belongs to user
    const { prisma } = await import("@/server/db/client");
    const order = await prisma.order.findUnique({
      where: { id: body.orderId },
      select: { userId: true, paymentStatus: true, paymentMethod: true, total: true },
    });

    if (!order) {
      throw new BadRequestError("Order not found.");
    }

    if (order.userId !== authUser.id) {
      return jsonResponse(errorResponse("This order does not belong to you."), 403);
    }

    // Create payment intent with timeout
    const paymentIntent = await withTimeout(
      paymentService.createPaymentIntent({
        orderId: body.orderId,
        paymentMethod: body.paymentMethod,
        integrationId: body.integrationId,
      }),
      REQUEST_TIMEOUTS.PAYMENT_CREATE,
      "Payment setup took too long. Please try again."
    );

    // Track payment initiation
    await trackPaymentEvent("payment_initiated", {
      orderId: body.orderId,
      userId: authUser.id,
      amount: Number(order.total),
      paymentMethod: body.paymentMethod,
    });

    // Track API performance
    const duration = Date.now() - startTime;
    await trackApiPerformance("/api/payments/create", duration, 200);

    return jsonResponse(successResponse(paymentIntent));
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    await trackApiPerformance("/api/payments/create", duration, error instanceof BadRequestError ? 400 : 500);
    
    console.error("[Payment Create] Error:", error);
    
    if (error instanceof BadRequestError) {
      await trackPaymentEvent("payment_failed", {
        orderId: (error as any).orderId,
        userId: (await getAuthUser(request))?.id,
        error: error.message,
      });
      return jsonResponse(errorResponse(error.message), 400);
    }

    if (error instanceof Error && error.message.includes("timeout")) {
      await trackPaymentEvent("payment_failed", {
        userId: (await getAuthUser(request))?.id,
        error: "Timeout",
      });
      return jsonResponse(errorResponse("Payment setup took too long. Please try again."), 503);
    }

    const message = (error as { message?: string })?.message || "Payment could not be processed. Please try again.";
    await trackPaymentEvent("payment_failed", {
      userId: (await getAuthUser(request))?.id,
      error: message,
    });
    return jsonResponse(errorResponse(message), 500);
  }
}


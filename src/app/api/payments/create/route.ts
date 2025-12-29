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
import { BadRequestError } from "@/server/utils/errors";

/**
 * POST /api/payments/create
 * Create a payment intent for an order
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Paymob is configured
    if (!isPaymobConfigured()) {
      return jsonResponse(
        errorResponse("Payment gateway is not configured"),
        503
      );
    }

    // Authenticate user
    const authUser = await getAuthUser(request);
    if (!authUser?.id) {
      return jsonResponse(errorResponse("Unauthorized"), 401);
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
      select: { userId: true, paymentStatus: true, paymentMethod: true },
    });

    if (!order) {
      throw new BadRequestError("Order not found");
    }

    if (order.userId !== authUser.id) {
      return jsonResponse(errorResponse("Unauthorized"), 403);
    }

    // Create payment intent
    const paymentIntent = await paymentService.createPaymentIntent({
      orderId: body.orderId,
      paymentMethod: body.paymentMethod,
      integrationId: body.integrationId,
    });

    return jsonResponse(successResponse(paymentIntent));
  } catch (error: unknown) {
    console.error("[Payment Create] Error:", error);
    
    if (error instanceof BadRequestError) {
      return jsonResponse(errorResponse(error.message), 400);
    }

    const message = (error as { message?: string })?.message || "Failed to create payment intent";
    return jsonResponse(errorResponse(message), 500);
  }
}


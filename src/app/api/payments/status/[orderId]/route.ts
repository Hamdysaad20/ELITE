import { NextRequest } from "next/server";
import {
  jsonResponse,
  successResponse,
  errorResponse,
} from "@/server/utils/apiHelpers";
import { getAuthUser } from "@/server/auth/session";
import { getPaymentService } from "@/server/services/paymob/paymentService";
import { isPaymobConfigured } from "@/server/services/paymob/paymobClient";

/**
 * GET /api/payments/status/[orderId]
 * Get payment status for an order
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

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

    // Verify order belongs to user
    const { prisma } = await import("@/server/db/client");
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true },
    });

    if (!order) {
      return jsonResponse(errorResponse("Order not found"), 404);
    }

    if (order.userId !== authUser.id) {
      return jsonResponse(errorResponse("Unauthorized"), 403);
    }

    // Get payment status
    const paymentService = getPaymentService();
    if (!paymentService) {
      return jsonResponse(
        errorResponse("Payment service is not available"),
        503
      );
    }

    const status = await paymentService.getPaymentStatus(orderId);

    return jsonResponse(successResponse(status));
  } catch (error: unknown) {
    console.error("[Payment Status] Error:", error);
    const message = (error as { message?: string })?.message || "Failed to get payment status";
    return jsonResponse(errorResponse(message), 500);
  }
}


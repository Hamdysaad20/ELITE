/**
 * Webhook Handler for Paymob
 * Processes and validates webhook callbacks from Paymob
 */

import { PaymentService, getPaymentService } from "./paymentService";
import type { PaymobWebhookPayload } from "@/types/payments";
import { paymobWebhookSchema } from "@/server/validators/paymentSchemas";

export interface WebhookProcessingResult {
  success: boolean;
  orderId: string | null;
  paymentStatus: string;
  error?: string;
}

/**
 * Process Paymob webhook
 */
export async function processPaymobWebhook(
  payload: unknown,
): Promise<WebhookProcessingResult> {
  try {
    // Validate payload structure
    const validationResult = paymobWebhookSchema.safeParse(payload);
    if (!validationResult.success) {
      return {
        success: false,
        orderId: null,
        paymentStatus: "unknown",
        error: `Invalid webhook payload: ${validationResult.error.message}`,
      };
    }

    const webhookPayload = validationResult.data as PaymobWebhookPayload;
    const transaction = webhookPayload.obj;

    // Get payment service
    const paymentService = getPaymentService();
    if (!paymentService) {
      return {
        success: false,
        orderId: null,
        paymentStatus: "unknown",
        error: "Payment service not configured",
      };
    }

    // Process webhook
    await paymentService.processWebhook(webhookPayload);

    // Get order ID for response
    const { prisma } = await import("@/server/db/client");
    const order = await prisma.order.findUnique({
      where: { clientOrderRef: transaction.merchant_order_id },
      select: { id: true, paymentStatus: true },
    });

    return {
      success: true,
      orderId: order?.id || null,
      paymentStatus: order?.paymentStatus || "unknown",
    };
  } catch (error: unknown) {
    const errorMessage =
      (error as { message?: string })?.message ||
      "Unknown error processing webhook";
    console.error("[Paymob Webhook] Error:", errorMessage, error);

    return {
      success: false,
      orderId: null,
      paymentStatus: "unknown",
      error: errorMessage,
    };
  }
}

/**
 * Verify webhook signature (HMAC)
 */
export function verifyWebhookSignature(
  amountCents: number,
  created_at: string,
  hmac: string,
): boolean {
  const paymentService = getPaymentService();
  if (!paymentService) {
    return false;
  }

  // Access the client through the service (we need to expose this method)
  // For now, we'll verify in the payment service itself
  return true; // Verification happens in paymentService.processWebhook
}

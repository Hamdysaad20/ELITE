import { z } from "zod";
import { PaymobPaymentMethod } from "@/types/payments";

/**
 * Schema for creating a payment intent
 */
export const createPaymentIntentSchema = z.object({
  orderId: z.string().uuid("Invalid order ID"),
  paymentMethod: z.nativeEnum(PaymobPaymentMethod, {
    errorMap: () => ({ message: "Invalid payment method" }),
  }),
  integrationId: z.number().int().positive().optional(),
});

/**
 * Schema for Paymob webhook payload
 * Note: HMAC verification happens separately
 */
export const paymobWebhookSchema = z.object({
  obj: z.object({
    id: z.number(),
    pending: z.boolean(),
    amount_cents: z.number(),
    success: z.boolean(),
    is_auth: z.boolean(),
    is_capture: z.boolean(),
    is_standalone_refund: z.boolean(),
    is_voided: z.boolean(),
    is_refunded: z.boolean(),
    is_3d_secure: z.boolean(),
    integration_id: z.number(),
    profile_id: z.number(),
    has_parent_transaction: z.boolean(),
    order: z.object({
      id: z.number(),
      created_at: z.string(),
      delivery_needed: z.boolean(),
      merchant: z.object({
        id: z.number(),
      }),
      amount_cents: z.number(),
      currency: z.string(),
      merchant_order_id: z.string(),
    }),
    created_at: z.string(),
    currency: z.string(),
    merchant_order_id: z.string(),
    data: z
      .object({
        message: z.string().optional(),
      })
      .optional(),
    source_data: z
      .object({
        type: z.string(),
        pan: z.string().optional(),
        sub_type: z.string().optional(),
      })
      .optional(),
    api_source: z.string().optional(),
    url: z.string().optional(),
  }),
  type: z.string(),
  hmac: z.string().optional(),
});

/**
 * Schema for refund request
 */
export const refundPaymentSchema = z.object({
  orderId: z.string().uuid("Invalid order ID"),
  amount: z.number().positive().optional(), // Optional, defaults to full refund
  reason: z.string().max(500).optional(),
});

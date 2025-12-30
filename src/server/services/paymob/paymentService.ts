/**
 * Payment Service
 * High-level payment orchestration for Paymob integration
 */

import { prisma } from "@/server/db/client";
import { Prisma, type Order, type User, type Address } from "@prisma/client";
import { PaymobClient, createPaymobClient, isPaymobConfigured } from "./paymobClient";
import {
  PaymentTransactionStatus,
  type CreatePaymentIntentRequest,
  type CreatePaymentIntentResponse,
  type PaymobBillingData,
  type PaymobWebhookPayload,
} from "@/types/payments";
import { PaymentMethod } from "@/types";

// Type for payment transaction (using Prisma's generated type)
type PaymentTransaction = {
  id: string;
  orderId: string;
  paymobTransactionId: string | null;
  paymentKey: string | null;
  integrationId: number | null;
  status: string;
  amount: Prisma.Decimal;
  paymobResponse: Prisma.JsonValue | null;
  paymobError: string | null;
  webhookReceived: boolean;
  webhookProcessedAt: Date | null;
  webhookPayload: Prisma.JsonValue | null;
  retryCount: number;
  lastRetryAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

// Type for order with relations
type OrderWithRelations = Order & {
  paymentTransactions?: PaymentTransaction[];
  user?: User | null;
  address?: Address | null;
};

export class PaymentService {
  private client: PaymobClient;

  constructor(client: PaymobClient) {
    this.client = client;
  }

  /**
   * Create a payment intent for an order
   */
  async createPaymentIntent(
    request: CreatePaymentIntentRequest
  ): Promise<CreatePaymentIntentResponse> {
    // Fetch order
    const order = await prisma.order.findUnique({
      where: { id: request.orderId },
      include: {
        user: true,
        address: true,
        items: true,
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    // Validate order can be paid
    if (order.paymentStatus !== "PENDING") {
      throw new Error(`Order payment status is ${order.paymentStatus}, cannot create payment intent`);
    }

    // Check if payment method requires online payment
    const onlinePaymentMethods = [PaymentMethod.CARD, PaymentMethod.WALLET];
    if (!onlinePaymentMethods.includes(order.paymentMethod as PaymentMethod)) {
      throw new Error(`Payment method ${order.paymentMethod} does not require online payment`);
    }

    // Convert order items to Paymob format
    const paymobItems = order.items.map((item) => ({
      name: item.name,
      amount_cents: Math.round(Number(item.unitPrice) * 100), // Convert to cents
      description: `${item.quantity}x ${item.name}`,
      quantity: item.quantity,
    }));

    // Create order in Paymob
    const paymobOrder = await this.client.createOrder(
      Math.round(Number(order.total) * 100), // Convert to cents
      paymobItems,
      order.clientOrderRef,
      order.orderType === "DELIVERY"
    );

    // Prepare billing data
    const billingData = this.prepareBillingData(order);

    // Get integration ID based on payment method
    const integrationId = this.client.getIntegrationId(request.paymentMethod);

    // Get payment key
    const paymentKey = await this.client.getPaymentKey(
      paymobOrder.id,
      Math.round(Number(order.total) * 100),
      billingData,
      integrationId
    );

    // Create payment transaction record
    const paymentTransaction = await prisma.paymentTransaction.create({
      data: {
        orderId: order.id,
        paymobTransactionId: null, // Will be set when webhook arrives
        paymentKey,
        integrationId,
        status: PaymentTransactionStatus.PENDING,
        amount: order.total,
        paymobResponse: paymobOrder as unknown as Prisma.InputJsonValue,
      },
    });

    // Update order with payment key
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymobPaymentKey: paymentKey,
        paymentIntentId: paymentTransaction.id,
      },
    });

    return {
      paymentKey,
      transactionId: paymentTransaction.id,
      orderId: order.id,
      amount: Number(order.total),
      currency: "EGP",
    };
  }

  /**
   * Prepare billing data from order
   * 
   * Validates that required billing information is available.
   * For online payments, valid billing data is required by Paymob.
   */
  private prepareBillingData(order: {
    user: { name: string | null; email: string | null; phone: string | null } | null;
    address: {
      street: string;
      apartment: string | null;
      city: string;
      state: string | null;
      zipCode: string | null;
      country: string;
      phone: string | null;
    } | null;
  }): PaymobBillingData {
    const user = order.user;
    const address = order.address;

    // Validate required fields
    if (!user?.email) {
      throw new Error("User email is required for online payment");
    }

    if (!address) {
      throw new Error("Delivery address is required for online payment");
    }

    if (!address.street || !address.city) {
      throw new Error("Street and city are required in delivery address");
    }

    const phoneNumber = address.phone || user.phone;
    if (!phoneNumber) {
      throw new Error("Phone number is required for online payment");
    }

    // Validate phone number format (Egyptian format: starts with 0 or +20)
    const phoneRegex = /^(\+20|0)?1[0-9]{9}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ""))) {
      throw new Error("Invalid phone number format. Please use Egyptian format (e.g., 01000000000)");
    }

    // Extract first and last name
    const fullName = user.name || "Customer";
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || "Customer";
    const lastName = nameParts.slice(1).join(" ") || "Customer";

    return {
      apartment: address.apartment || "",
      email: user.email,
      floor: "",
      first_name: firstName,
      street: address.street,
      building: "",
      phone_number: phoneNumber.replace(/\s/g, ""),
      shipping_method: "PKG",
      postal_code: address.zipCode || "",
      city: address.city,
      country: address.country || "Egypt",
      last_name: lastName,
      state: address.state || address.city,
    };
  }

  /**
   * Process webhook and update order status
   */
  async processWebhook(payload: PaymobWebhookPayload): Promise<void> {
    const transaction = payload.obj;

    // Verify HMAC signature
    if (payload.hmac) {
      const isValid = this.client.verifyWebhookSignature(
        transaction,
        payload.hmac
      );

      if (!isValid) {
        throw new Error("Invalid HMAC signature");
      }
    }

    // Find order by merchant_order_id (clientOrderRef)
    const order = await prisma.order.findUnique({
      where: { clientOrderRef: transaction.merchant_order_id },
      include: { 
        paymentTransactions: true,
        user: true,
        address: true,
      },
    });

    if (!order) {
      throw new Error(`Order not found for merchant_order_id: ${transaction.merchant_order_id}`);
    }

    // Determine payment status
    let paymentStatus: PaymentTransactionStatus;
    let orderPaymentStatus: string;

    if (transaction.success && !transaction.pending) {
      paymentStatus = PaymentTransactionStatus.SUCCESS;
      orderPaymentStatus = "PAID";
    } else if (transaction.is_voided || transaction.is_refunded) {
      paymentStatus = transaction.is_refunded
        ? PaymentTransactionStatus.REFUNDED
        : PaymentTransactionStatus.CANCELLED;
      orderPaymentStatus = transaction.is_refunded ? "REFUNDED" : "CANCELLED";
    } else if (transaction.pending) {
      paymentStatus = PaymentTransactionStatus.PENDING;
      orderPaymentStatus = "PENDING";
    } else {
      paymentStatus = PaymentTransactionStatus.FAILED;
      orderPaymentStatus = "FAILED";
    }

    // Update or create payment transaction
    const orderWithRelations = order as OrderWithRelations;
    const existingTransaction = orderWithRelations.paymentTransactions?.find(
      (pt) => pt.paymobTransactionId === String(transaction.id)
    );

    if (existingTransaction) {
      // Update existing transaction
      await prisma.paymentTransaction.update({
        where: { id: existingTransaction.id },
        data: {
          status: paymentStatus,
          paymobResponse: transaction as unknown as Prisma.InputJsonValue,
          webhookReceived: true,
          webhookProcessedAt: new Date(),
          webhookPayload: payload as unknown as Prisma.InputJsonValue,
        },
      });
    } else {
      // Create new transaction record
      await prisma.paymentTransaction.create({
        data: {
          orderId: order.id,
          paymobTransactionId: String(transaction.id),
          integrationId: transaction.integration_id,
          status: paymentStatus,
          amount: transaction.amount_cents / 100, // Convert from cents
          paymobResponse: transaction as unknown as Prisma.InputJsonValue,
          webhookReceived: true,
          webhookProcessedAt: new Date(),
          webhookPayload: payload as unknown as Prisma.InputJsonValue,
        },
      });
    }

    // Update order
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: orderPaymentStatus,
        paymobTransactionId: String(transaction.id),
      },
    });

    // If payment successful, trigger order confirmation flow
    if (paymentStatus === PaymentTransactionStatus.SUCCESS) {
      // Update order status to CONFIRMED if still PENDING
      if (order.status === "PENDING") {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "CONFIRMED" },
        });
      }

      // Trigger Odoo sync for paid orders
      try {
        const { enqueueOrderSync } = await import("@/server/services/odooSync");
        await enqueueOrderSync({
          orderId: order.id,
          clientOrderRef: order.clientOrderRef,
          partner: {
            name: orderWithRelations.user?.name || "Customer",
            email: orderWithRelations.user?.email || undefined,
            phone: orderWithRelations.address?.phone || orderWithRelations.user?.phone || undefined,
            street: orderWithRelations.address?.street || undefined,
            city: orderWithRelations.address?.city || undefined,
            zip: orderWithRelations.address?.zipCode || undefined,
          },
          enableSale: true,
          autoConfirm: false,
          enablePos: false,
        });
      } catch (err) {
        console.error("[Payment] Failed to trigger Odoo sync:", err);
      }

      // Award loyalty points if order is already completed/delivered
      if (order.userId && (order.status === "DELIVERED" || order.status === "COMPLETED")) {
        try {
          const { awardOrderPoints } = await import("@/server/services/loyalty");
          await awardOrderPoints(order.id, order.userId);
        } catch (err) {
          console.error("[Payment] Failed to award loyalty points:", err);
        }
      }
    }
  }

  /**
   * Get payment status for an order
   */
  async getPaymentStatus(orderId: string): Promise<{
    status: PaymentTransactionStatus;
    paymobTransactionId: string | null;
    amount: number;
    paidAt: Date | null;
    error: string | null;
  }> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        paymentTransactions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    const orderWithRelations = order as OrderWithRelations;
    const latestTransaction = orderWithRelations.paymentTransactions?.[0];

    return {
      status: (latestTransaction?.status as PaymentTransactionStatus) || PaymentTransactionStatus.PENDING,
      paymobTransactionId: latestTransaction?.paymobTransactionId || null,
      amount: Number(order.total),
      paidAt:
        latestTransaction?.status === PaymentTransactionStatus.SUCCESS
          ? latestTransaction.webhookProcessedAt || latestTransaction.updatedAt
          : null,
      error: latestTransaction?.paymobError || null,
    };
  }
}

/**
 * Get payment service instance
 */
export function getPaymentService(): PaymentService | null {
  if (!isPaymobConfigured()) {
    return null;
  }

  const client = createPaymobClient();
  if (!client) {
    return null;
  }

  return new PaymentService(client);
}


import { NextRequest } from "next/server";
import { prisma } from "@/server/db/client";
import type {
  Order as PrismaOrder,
  OrderItem as PrismaOrderItem,
} from "@prisma/client";
import {
  successResponse,
  errorResponse,
  jsonResponse,
  handleApiError,
  parseRequestBody,
  getQueryParams,
  getUserId,
} from "@/server/utils/apiHelpers";
import {
  OrderStatus,
  PaymentStatus,
  OrderType,
  PaymentMethod,
  type Order,
} from "@/types";
import { createOrderSchema } from "@/server/validators/orderSchemas";
import {
  BadRequestError,
  ServiceUnavailableError,
} from "@/server/utils/errors";
import { enqueueOrderSync } from "@/server/services/odooSync";
import { consumeInventoryForOnlineOrder } from "@/server/services/inventoryConsumption";
import { getAuthUser } from "@/server/auth/session";
import { getCheckoutConfig } from "@/server/services/checkoutConfig";
import { isPaymobConfigured } from "@/server/services/paymob/paymobClient";
import { cartDB } from "@/server/utils/jsonDatabase";
import { checkOrderRateLimit } from "@/server/utils/rateLimit";
import { withTimeout, REQUEST_TIMEOUTS } from "@/server/utils/timeouts";
import { trackOrderEvent, trackApiPerformance } from "@/server/utils/analytics";
import { ORDERING_DISABLED_MESSAGE } from "@/lib/constants";
import { buildPricedOrderItems } from "@/server/utils/orderPricing";
import {
  calculateFirstOrderDiscount,
  canApplyFirstOrderDiscount,
  getEligiblePriorOrderFilter,
  roundCurrency,
} from "@/server/services/orderPromotions";
// Auto-start Odoo worker when orders API is first accessed
import "@/server/services/startOdooWorkerOnInit";
// Auto-start Points Retry worker when orders API is first accessed
import "@/server/services/startPointsRetryWorkerOnInit";

type DbOrderWithItems = PrismaOrder & { items: PrismaOrderItem[] };

function serializeOrder(dbOrder: DbOrderWithItems) {
  return {
    id: dbOrder.id,
    orderNumber: dbOrder.id,
    clientOrderRef: dbOrder.clientOrderRef,
    userId: dbOrder.userId || "demo-user",
    status: dbOrder.status as OrderStatus,
    paymentStatus: dbOrder.paymentStatus as PaymentStatus,
    paymentMethod: dbOrder.paymentMethod as PaymentMethod,
    orderType: dbOrder.orderType as OrderType,
    subtotal: Number(dbOrder.subtotal),
    deliveryFee: Number(dbOrder.deliveryFee),
    codFee: Number(dbOrder.codFee),
    discount: Number(dbOrder.discount),
    total: Number(dbOrder.total),
    notes: dbOrder.notes || undefined,
    integrations: {
      odoo: {
        saleOrderId: dbOrder.saleOrderId || undefined,
        posOrderId: dbOrder.posOrderId || undefined,
        url: dbOrder.odooWebUrl || undefined,
      },
    },
    items: (dbOrder.items || []).map((it) => ({
      id: it.id,
      menuItemId: it.productId,
      quantity: it.quantity,
      unitPrice: Number(it.unitPrice),
      totalPrice: Number(it.totalPrice),
      menuItem: it.name
        ? {
            id: it.productId,
            name: it.name,
            description: it.name,
            price: Number(it.unitPrice),
            category: it.categoryId || "unknown",
            subCategory: it.categoryId || "unknown",
            images: [],
            featured: false,
            available: true,
            allergens: [],
            sizes: [],
            flavors: [],
            toppings: [],
          }
        : undefined,
    })),
    createdAt: dbOrder.createdAt,
    updatedAt: dbOrder.updatedAt,
  } satisfies Partial<Order>;
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    const userId = authUser?.id || getUserId(request);
    const { limit = "20", offset = "0" } = getQueryParams(request);

    const take = Math.max(1, Math.min(100, Number(limit) || 20));
    const skip = Math.max(0, Number(offset) || 0);

    // Show PAID orders + CASH-method orders (COD are auto-marked PAID, this is a safety net)
    const visibilityFilter = {
      userId,
      OR: [
        { paymentStatus: PaymentStatus.PAID },
        { paymentMethod: PaymentMethod.CASH },
      ],
    };
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: visibilityFilter,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: {
          items: true,
          address: true,
          user: {
            select: { name: true, email: true },
          },
        },
      }),
      prisma.order.count({
        where: visibilityFilter,
      }),
    ]);

    return jsonResponse(
      successResponse({
        orders: orders.map(serializeOrder),
        total,
      }),
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const authUser = await getAuthUser(request);
    const userId = authUser?.id || getUserId(request);

    // Rate limiting
    const rateLimitResult = await checkOrderRateLimit(userId, "ORDER_CREATE");
    if (!rateLimitResult.allowed) {
      const resetTime = rateLimitResult.resetAt
        ? new Date(rateLimitResult.resetAt).toLocaleTimeString()
        : "in a moment";
      return jsonResponse(
        errorResponse("Too many orders. Please wait a moment and try again."),
        429,
      );
    }

    const raw = await parseRequestBody(request);
    const body = createOrderSchema.parse(raw);

    const checkoutConfig = await getCheckoutConfig();
    // orderingEnabled now only pertains to online payments, so we don't globally block here.

    // Online payments require an authenticated user (Paymob requires email and identity)
    const onlinePaymentMethods = [PaymentMethod.CARD, PaymentMethod.WALLET];
    const isOnlinePayment = onlinePaymentMethods.includes(body.paymentMethod);
    const isCashPayment = body.paymentMethod === PaymentMethod.CASH;

    // SECURITY ENFORCEMENT: The ORDERING_ENABLED flag exclusively controls online payments natively.
    // If a request bypasses frontend UI constraints, we decisively block it here.
    if (isOnlinePayment && !checkoutConfig.orderingEnabled) {
      throw new ServiceUnavailableError(
        checkoutConfig.orderingMessage ||
          "Online payments are currently disabled. Please select Cash on Delivery.",
      );
    }

    if (isOnlinePayment && !isPaymobConfigured()) {
      throw new ServiceUnavailableError(
        "Online ordering is temporarily unavailable. Please try again later.",
      );
    }
    if (isOnlinePayment && !authUser?.id) {
      throw new BadRequestError("Please sign in to pay online.");
    }

    // Use items from request body (LocalCartItem format from client)
    const cartItems = body.items;
    if (!cartItems || cartItems.length === 0) {
      throw new BadRequestError("Your cart is empty. Add items to continue.");
    }

    // Validate address for delivery orders
    if (body.orderType === "DELIVERY" && !body.addressId) {
      throw new BadRequestError("Please select a delivery address.");
    }

    // For online payment, we also require an address (used as billing/shipping data for Paymob)
    if (isOnlinePayment && !body.addressId) {
      throw new BadRequestError(
        "Please select an address (required for online payment billing details).",
      );
    }

    // If addressId provided, verify it exists and belongs to user
    let validatedAddress: {
      street: string;
      apartment: string | null;
      city: string;
      state: string | null;
      phone: string | null;
      notes: string | null;
    } | null = null;

    if (body.addressId) {
      const address = await prisma.address.findFirst({
        where: { id: body.addressId, userId },
        select: {
          street: true,
          apartment: true,
          city: true,
          state: true,
          phone: true,
          notes: true,
        },
      });
      if (!address) {
        throw new BadRequestError("Invalid delivery address");
      }
      validatedAddress = address;
    }

    const normalizedName =
      body.odoo?.partner?.name?.trim() ||
      authUser?.name?.trim() ||
      authUser?.email?.split("@")[0]?.trim() ||
      "Website Customer";

    const normalizedPhone =
      body.odoo?.partner?.phone?.trim() ||
      validatedAddress?.phone?.trim() ||
      "";

    // Delivery orders must always include a usable phone for downstream Odoo sync.
    if (body.orderType === "DELIVERY" && !normalizedPhone) {
      throw new BadRequestError(
        "Phone number is required for delivery orders.",
      );
    }

    // IMPORTANT: treat cart/order payload as untrusted; recompute pricing server-side.
    const { pricedItems, subtotal } = await buildPricedOrderItems(cartItems);
    const deliveryFee =
      body.orderType === "DELIVERY" ? checkoutConfig.deliveryFee : 0;
    const codFee =
      body.orderType === "DELIVERY" && body.paymentMethod === PaymentMethod.CASH
        ? checkoutConfig.codFee
        : 0;
    // Promo eligibility — only authenticated, online-paying first-time buyers.
    // Guests fall through `getUserId` to a shared default id, so we never run
    // the eligibility query for them; the promo simply doesn't apply.
    const isAuthenticated = Boolean(authUser?.id);
    const existingOrdersCount = isAuthenticated
      ? await prisma.order.count({
          where: getEligiblePriorOrderFilter(userId),
        })
      : 0;
    const shouldApplyFirstOrderDiscount = canApplyFirstOrderDiscount({
      paymentMethod: body.paymentMethod,
      now: new Date(),
      eligibleOrdersCount: existingOrdersCount,
      isAuthenticated,
    });
    const firstOrderDiscount = calculateFirstOrderDiscount(
      subtotal,
      shouldApplyFirstOrderDiscount,
    );
    const total = roundCurrency(
      Math.max(0, subtotal + deliveryFee + codFee - firstOrderDiscount),
    );
    const clientOrderRef = `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Create order with timeout
    const created = await withTimeout(
      prisma.order.create({
        data: {
          userId,
          addressId: body.addressId || null,
          status: OrderStatus.PENDING,
          paymentStatus: isCashPayment
            ? PaymentStatus.PAID
            : PaymentStatus.PENDING,
          paymentMethod: body.paymentMethod,
          orderType: body.orderType,
          subtotal,
          deliveryFee,
          codFee,
          discount: firstOrderDiscount,
          total,
          notes: body.notes?.trim() || null,
          clientOrderRef,
          items: {
            create: pricedItems.map((item) => ({
              productId: item.productId,
              sku: item.sku,
              name: item.name,
              categoryId: item.categoryId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              attributes: item.attributes,
            })),
          },
        },
        include: {
          items: true,
          address: true,
          user: true,
        },
      }),
      REQUEST_TIMEOUTS.ORDER_CREATE,
      "Order creation took too long. Please try again.",
    );

    // For online payment methods, create payment intent
    // Note: Payment intent creation is separate - frontend can also call /api/payments/create to retry
    let paymentIntent = null;
    let paymentIntentError: string | undefined;
    if (isOnlinePayment) {
      try {
        const { getPaymentService } = await import(
          "@/server/services/paymob/paymentService"
        );
        const { isPaymobConfigured } = await import(
          "@/server/services/paymob/paymobClient"
        );

        if (isPaymobConfigured()) {
          const paymentService = getPaymentService();
          if (paymentService) {
            // Determine payment method for Paymob
            const { PaymobPaymentMethod } = await import("@/types/payments");
            const paymobPaymentMethod =
              body.paymentMethod === PaymentMethod.CARD
                ? PaymobPaymentMethod.CARD
                : body.paymentMethod === PaymentMethod.WALLET
                  ? PaymobPaymentMethod.WALLET
                  : PaymobPaymentMethod.CARD; // Default to card

            try {
              paymentIntent = await withTimeout(
                paymentService.createPaymentIntent({
                  orderId: created.id,
                  paymentMethod: paymobPaymentMethod,
                }),
                REQUEST_TIMEOUTS.PAYMENT_CREATE,
                "Payment setup took too long. Please try again.",
              );
            } catch (paymentError: unknown) {
              // Log error but don't fail order creation
              // Frontend can retry payment intent creation
              const errorMessage =
                paymentError instanceof Error
                  ? paymentError.message
                  : "Payment setup failed";
              paymentIntentError = errorMessage;
              console.error(
                "[Order] Failed to create payment intent:",
                errorMessage,
              );
            }
          }
        }
      } catch (error) {
        // Payment service not available - log but continue
        paymentIntentError = "Payment service not available";
        console.warn(
          "[Order] Payment service not available, order created without payment intent",
        );
      }
    }

    // Get address details for Odoo sync if delivery order
    const addressInfo = validatedAddress
      ? {
          street: validatedAddress.street,
          apartment: validatedAddress.apartment,
          city: validatedAddress.city,
          state: validatedAddress.state,
          phone: validatedAddress.phone,
          notes: validatedAddress.notes,
        }
      : null;

    // Only sync to Odoo if payment is confirmed (PAID) or CASH (COD)
    // For online payments, wait for payment confirmation via webhook
    const isPaid = created.paymentStatus === PaymentStatus.PAID;

    if (isCashPayment || isPaid) {
      await consumeInventoryForOnlineOrder(created.id).catch((err) =>
        console.error("[Order] Failed to consume recipe inventory:", err),
      );

      // Enqueue Odoo sync (fire-and-forget stub). Defaults: sale enabled, pos disabled.
      const enableSale = body.odoo?.sale?.enable !== false;
      const enablePos = body.odoo?.pos?.enable === true;
      await enqueueOrderSync({
        orderId: created.id,
        clientOrderRef: clientOrderRef,
        partner: {
          name: normalizedName,
          email: body.odoo?.partner?.email || authUser?.email,
          phone: normalizedPhone || undefined,
          street: addressInfo?.street || body.odoo?.partner?.street,
          city: addressInfo?.city || body.odoo?.partner?.city,
        },
        enableSale,
        autoConfirm: body.odoo?.sale?.autoConfirm === true,
        enablePos,
        posConfigId: body.odoo?.pos?.posConfigId,
        posConfigName: body.odoo?.pos?.posConfigName,
        customerNotePerLine: body.odoo?.pos?.customerNotePerLine,
      });
    } else {
      // For online payments, Odoo sync will be triggered by webhook after payment confirmation
      console.log(
        `[Order] Online payment order ${created.id} - Odoo sync will be triggered after payment confirmation`,
      );
    }

    // Clear cart after order
    cartDB.clear(userId);

    // Track order creation
    await trackOrderEvent("order_created", {
      orderId: created.id,
      userId,
      amount: total,
      paymentMethod: body.paymentMethod,
    });

    // Track API performance
    const duration = Date.now() - startTime;
    await trackApiPerformance("/api/orders", duration, 201);

    // Prepare response
    const response: {
      order: ReturnType<typeof serializeOrder>;
      integrationStatus: string;
      paymentIntent?: {
        paymentKey: string;
        transactionId: string;
        amount: number;
        currency: string;
      };
      paymentIntentError?: string;
    } = {
      order: serializeOrder(created),
      integrationStatus:
        isCashPayment || isPaid ? "pending" : "waiting_payment",
    };

    // Include payment intent if created
    if (paymentIntent) {
      response.paymentIntent = {
        paymentKey: paymentIntent.paymentKey,
        transactionId: paymentIntent.transactionId,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      };
    } else if (isOnlinePayment && paymentIntentError) {
      response.paymentIntentError = paymentIntentError;
    }

    return jsonResponse(
      successResponse(response, "Order created successfully"),
      201,
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    await trackApiPerformance(
      "/api/orders",
      duration,
      error instanceof BadRequestError ? 400 : 500,
    );

    if (error instanceof Error && "issues" in error) {
      await trackOrderEvent("order_failed", {
        userId: getUserId(request),
        error: "Invalid request body",
      });
      return handleApiError(
        new BadRequestError("Please check your information and try again."),
      );
    }

    if (error instanceof Error && error.message.includes("timeout")) {
      await trackOrderEvent("order_failed", {
        userId: getUserId(request),
        error: "Timeout",
      });
      return handleApiError(
        new ServiceUnavailableError("Request took too long. Please try again."),
      );
    }

    await trackOrderEvent("order_failed", {
      userId: getUserId(request),
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return handleApiError(error);
  }
}

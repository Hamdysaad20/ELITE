import { NextRequest } from "next/server";
import { prisma } from "@/server/db/client";
import type { Order as PrismaOrder, OrderItem as PrismaOrderItem } from "@prisma/client";
import {
  successResponse,
  errorResponse,
  jsonResponse,
  handleApiError,
  parseRequestBody,
  getQueryParams,
  getUserId,
} from "@/server/utils/apiHelpers";
import { OrderStatus, PaymentStatus, OrderType, PaymentMethod, type Order } from "@/types";
import { createOrderSchema } from "@/server/validators/orderSchemas";
import { BadRequestError, ServiceUnavailableError } from "@/server/utils/errors";
import { enqueueOrderSync } from "@/server/services/odooSync";
import { getAuthUser } from "@/server/auth/session";
import { getCheckoutConfig } from "@/server/services/checkoutConfig";
import { cartDB } from "@/server/utils/jsonDatabase";
import { checkOrderRateLimit } from "@/server/utils/rateLimit";
import { withTimeout, REQUEST_TIMEOUTS } from "@/server/utils/timeouts";
import { trackOrderEvent, trackApiPerformance } from "@/server/utils/analytics";
// Auto-start Odoo worker when orders API is first accessed
import "@/server/services/startOdooWorkerOnInit";
// Auto-start Points Retry worker when orders API is first accessed
import "@/server/services/startPointsRetryWorkerOnInit";

type DbOrderWithItems = PrismaOrder & { items: PrismaOrderItem[] };

function serializeOrder(dbOrder: DbOrderWithItems) {
  return {
    id: dbOrder.id,
    orderNumber: dbOrder.id,
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

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: { items: true },
      }),
      prisma.order.count({ where: { userId } }),
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
        429
      );
    }
    
    const raw = await parseRequestBody(request);
    const body = createOrderSchema.parse(raw);

    const checkoutConfig = await getCheckoutConfig();

    // Use items from request body (LocalCartItem format from client)
    const cartItems = body.items;
    if (!cartItems || cartItems.length === 0) {
      throw new BadRequestError("Your cart is empty. Add items to continue.");
    }

    // Validate address for delivery orders
    if (body.orderType === "DELIVERY" && !body.addressId) {
      throw new BadRequestError("Please select a delivery address.");
    }

    // If addressId provided, verify it exists and belongs to user
    if (body.addressId) {
      const address = await prisma.address.findFirst({
        where: { id: body.addressId, userId },
      });
      if (!address) {
        throw new BadRequestError("Invalid delivery address");
      }
    }

    // Calculate totals from LocalCartItem format
    const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const deliveryFee =
      body.orderType === "DELIVERY" ? checkoutConfig.deliveryFee : 0;
    const codFee =
      body.orderType === "DELIVERY" && body.paymentMethod === PaymentMethod.CASH
        ? checkoutConfig.codFee
        : 0;
    const total = subtotal + deliveryFee + codFee;
    const clientOrderRef = `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Create order with timeout
    const created = await withTimeout(
      prisma.order.create({
        data: {
          userId,
          addressId: body.addressId || null,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          paymentMethod: body.paymentMethod,
          orderType: body.orderType,
          subtotal,
          deliveryFee,
          codFee,
          discount: 0,
          total,
          notes: body.notes || null,
          clientOrderRef,
          items: {
            create: cartItems.map((item) => {
              // Calculate unit price (base + extras)
              const unitPrice = item.totalPrice / item.quantity;
              // Format attributes for storage
              const attributesList = Object.entries(item.attributes).flatMap(
                ([attrName, values]) => values.map(v => `${attrName}: ${v.valueName}`)
              );
              return {
                productId: item.productId,
                sku: item.productId,
                name: item.name,
                categoryId: undefined,
                quantity: item.quantity,
                unitPrice,
                totalPrice: item.totalPrice,
                attributes: {
                  basePrice: item.basePrice,
                  selections: item.attributes,
                  formatted: attributesList,
                },
              };
            }),
          },
        },
        include: { 
          items: true,
          address: true,
          user: true,
        },
      }),
      REQUEST_TIMEOUTS.ORDER_CREATE,
      "Order creation took too long. Please try again."
    );

    // For online payment methods, create payment intent
    // Note: Payment intent creation is separate - frontend will call /api/payments/create
    // This allows user to review order before initiating payment
    let paymentIntent = null;
    const onlinePaymentMethods = [PaymentMethod.CARD, PaymentMethod.WALLET];
    if (onlinePaymentMethods.includes(body.paymentMethod)) {
      try {
        const { getPaymentService } = await import("@/server/services/paymob/paymentService");
        const { isPaymobConfigured } = await import("@/server/services/paymob/paymobClient");
        
        if (isPaymobConfigured()) {
          const paymentService = getPaymentService();
          if (paymentService) {
            // Determine payment method for Paymob
            const { PaymobPaymentMethod } = await import("@/types/payments");
            const paymobPaymentMethod = body.paymentMethod === PaymentMethod.CARD 
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
                "Payment setup took too long. Please try again."
              );
            } catch (paymentError: unknown) {
              // Log error but don't fail order creation
              // Frontend can retry payment intent creation
              const errorMessage = paymentError instanceof Error ? paymentError.message : "Payment setup failed";
              console.error("[Order] Failed to create payment intent:", errorMessage);
            }
          }
        }
      } catch (error) {
        // Payment service not available - log but continue
        console.warn("[Order] Payment service not available, order created without payment intent");
      }
    }

    // Get address details for Odoo sync if delivery order
    let addressInfo: {
      street?: string;
      apartment?: string | null;
      city?: string;
      state?: string | null;
      zip?: string | null;
      phone?: string | null;
      notes?: string | null;
    } | null = null;
    if (created.address) {
      addressInfo = {
        street: created.address.street,
        apartment: created.address.apartment,
        city: created.address.city,
        state: created.address.state,
        zip: created.address.zipCode,
        phone: created.address.phone,
        notes: created.address.notes,
      };
    }

    // Only sync to Odoo if payment is confirmed (PAID) or CASH (COD)
    // For online payments, wait for payment confirmation via webhook
    const isCashPayment = body.paymentMethod === PaymentMethod.CASH;
    const isPaid = created.paymentStatus === PaymentStatus.PAID;
    
    if (isCashPayment || isPaid) {
      // Enqueue Odoo sync (fire-and-forget stub). Defaults: sale enabled, pos disabled.
      const enableSale = body.odoo?.sale?.enable !== false;
      const enablePos = body.odoo?.pos?.enable === true;
      await enqueueOrderSync({
        orderId: created.id,
        clientOrderRef: clientOrderRef,
        partner: {
          name: body.odoo?.partner?.name || authUser?.name || "Website Customer",
          email: body.odoo?.partner?.email || authUser?.email,
          phone: addressInfo?.phone || body.odoo?.partner?.phone,
          street: addressInfo?.street || body.odoo?.partner?.street,
          city: addressInfo?.city || body.odoo?.partner?.city,
          zip: addressInfo?.zip || body.odoo?.partner?.zip,
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
      console.log(`[Order] Online payment order ${created.id} - Odoo sync will be triggered after payment confirmation`);
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
    } = {
      order: serializeOrder(created),
      integrationStatus: isCashPayment || isPaid ? "pending" : "waiting_payment",
    };

    // Include payment intent if created
    if (paymentIntent) {
      response.paymentIntent = {
        paymentKey: paymentIntent.paymentKey,
        transactionId: paymentIntent.transactionId,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      };
    }

    return jsonResponse(
      successResponse(response, "Order created successfully"),
      201,
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    await trackApiPerformance("/api/orders", duration, error instanceof BadRequestError ? 400 : 500);
    
    if (error instanceof Error && "issues" in error) {
      await trackOrderEvent("order_failed", {
        userId: getUserId(request),
        error: "Invalid request body",
      });
      return handleApiError(new BadRequestError("Please check your information and try again."));
    }
    
    if (error instanceof Error && error.message.includes("timeout")) {
      await trackOrderEvent("order_failed", {
        userId: getUserId(request),
        error: "Timeout",
      });
      return handleApiError(new ServiceUnavailableError("Request took too long. Please try again."));
    }
    
    await trackOrderEvent("order_failed", {
      userId: getUserId(request),
      error: error instanceof Error ? error.message : "Unknown error",
    });
    
    return handleApiError(error);
  }
}

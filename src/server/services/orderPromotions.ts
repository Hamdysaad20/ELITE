import { OrderStatus, PaymentMethod, PaymentStatus } from "@/types";

export const FIRST_ORDER_DISCOUNT_PERCENT = 20;

export function getCurrentMonthEnd(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999),
  );
}

export function canApplyFirstOrderDiscount(params: {
  paymentMethod: PaymentMethod;
  now: Date;
  eligibleOrdersCount: number;
}) {
  const isOnlinePayment =
    params.paymentMethod === PaymentMethod.CARD ||
    params.paymentMethod === PaymentMethod.WALLET;
  const isPromoActive = params.now <= getCurrentMonthEnd(params.now);
  return isOnlinePayment && isPromoActive && params.eligibleOrdersCount === 0;
}

export function getEligiblePriorOrderFilter(userId: string) {
  return {
    userId,
    status: {
      not: OrderStatus.CANCELLED,
    },
    paymentStatus: {
      notIn: [PaymentStatus.FAILED, PaymentStatus.REFUNDED],
    },
  } as const;
}

export function calculateFirstOrderDiscount(
  subtotal: number,
  shouldApply: boolean,
) {
  if (!shouldApply || subtotal <= 0) return 0;
  return Number(((subtotal * FIRST_ORDER_DISCOUNT_PERCENT) / 100).toFixed(2));
}

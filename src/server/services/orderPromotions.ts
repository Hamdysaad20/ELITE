import { OrderStatus, PaymentMethod, PaymentStatus } from "@/types";

export const FIRST_ORDER_DISCOUNT_PERCENT = 20;

/**
 * Promo end date is configured via FIRST_ORDER_PROMO_END_AT (ISO 8601).
 * If unset or invalid, the promo is inactive — fail closed, never run an
 * unbounded discount because of a missing config value.
 */
function getPromoEndAt(): Date | null {
  const raw = process.env.FIRST_ORDER_PROMO_END_AT?.trim();
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function isFirstOrderPromoActive(now: Date): boolean {
  const end = getPromoEndAt();
  if (!end) return false;
  return now <= end;
}

// Kept for backwards-compat with the original helper signature.
export function getCurrentMonthEnd(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999),
  );
}

export function canApplyFirstOrderDiscount(params: {
  paymentMethod: PaymentMethod;
  now: Date;
  eligibleOrdersCount: number;
  isAuthenticated: boolean;
}) {
  const isOnlinePayment =
    params.paymentMethod === PaymentMethod.CARD ||
    params.paymentMethod === PaymentMethod.WALLET;
  return (
    params.isAuthenticated &&
    isOnlinePayment &&
    isFirstOrderPromoActive(params.now) &&
    params.eligibleOrdersCount === 0
  );
}

/**
 * Eligible = customer has never reached PAID. Abandoned PENDING / FAILED
 * orders do NOT consume the discount, so a customer who bails out of the
 * Paymob page can come back and still qualify.
 */
export function getEligiblePriorOrderFilter(userId: string) {
  return {
    userId,
    status: { not: OrderStatus.CANCELLED },
    paymentStatus: PaymentStatus.PAID,
  } as const;
}

export function calculateFirstOrderDiscount(
  subtotal: number,
  shouldApply: boolean,
) {
  if (!shouldApply || subtotal <= 0) return 0;
  return Number(((subtotal * FIRST_ORDER_DISCOUNT_PERCENT) / 100).toFixed(2));
}

export function roundCurrency(value: number): number {
  return Number(value.toFixed(2));
}

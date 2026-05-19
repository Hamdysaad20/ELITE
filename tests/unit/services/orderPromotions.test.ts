import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  calculateFirstOrderDiscount,
  canApplyFirstOrderDiscount,
  getCurrentMonthEnd,
  getEligiblePriorOrderFilter,
  isFirstOrderPromoActive,
  roundCurrency,
} from "@/server/services/orderPromotions";
import { OrderStatus, PaymentMethod, PaymentStatus } from "@/types";

const ENV_KEY = "FIRST_ORDER_PROMO_END_AT";

describe("orderPromotions", () => {
  let originalEnd: string | undefined;

  beforeEach(() => {
    originalEnd = process.env[ENV_KEY];
  });

  afterEach(() => {
    if (originalEnd === undefined) delete process.env[ENV_KEY];
    else process.env[ENV_KEY] = originalEnd;
  });

  it("returns end of month in UTC", () => {
    const d = new Date("2026-05-18T10:00:00.000Z");
    expect(getCurrentMonthEnd(d).toISOString()).toBe(
      "2026-05-31T23:59:59.999Z",
    );
  });

  it("promo is inactive when env is unset (fail closed)", () => {
    delete process.env[ENV_KEY];
    expect(isFirstOrderPromoActive(new Date())).toBe(false);
  });

  it("promo is inactive when env is invalid", () => {
    process.env[ENV_KEY] = "not-a-date";
    expect(isFirstOrderPromoActive(new Date())).toBe(false);
  });

  it("promo is active before the configured end date and inactive after", () => {
    process.env[ENV_KEY] = "2026-12-31T23:59:59.999Z";
    expect(isFirstOrderPromoActive(new Date("2026-06-01T00:00:00.000Z"))).toBe(
      true,
    );
    expect(isFirstOrderPromoActive(new Date("2027-01-01T00:00:00.000Z"))).toBe(
      false,
    );
  });

  it("requires authenticated, online-paying, first-time buyer during active promo", () => {
    process.env[ENV_KEY] = "2026-12-31T23:59:59.999Z";
    const now = new Date("2026-05-18T10:00:00.000Z");

    expect(
      canApplyFirstOrderDiscount({
        paymentMethod: PaymentMethod.CARD,
        now,
        eligibleOrdersCount: 0,
        isAuthenticated: true,
      }),
    ).toBe(true);

    // Guest — must never get the discount even if "first" order.
    expect(
      canApplyFirstOrderDiscount({
        paymentMethod: PaymentMethod.CARD,
        now,
        eligibleOrdersCount: 0,
        isAuthenticated: false,
      }),
    ).toBe(false);

    // Returning customer.
    expect(
      canApplyFirstOrderDiscount({
        paymentMethod: PaymentMethod.WALLET,
        now,
        eligibleOrdersCount: 1,
        isAuthenticated: true,
      }),
    ).toBe(false);

    // Cash-on-delivery — promo is online-only.
    expect(
      canApplyFirstOrderDiscount({
        paymentMethod: PaymentMethod.CASH,
        now,
        eligibleOrdersCount: 0,
        isAuthenticated: true,
      }),
    ).toBe(false);
  });

  it("does not apply when promo is inactive even for eligible users", () => {
    delete process.env[ENV_KEY];
    expect(
      canApplyFirstOrderDiscount({
        paymentMethod: PaymentMethod.CARD,
        now: new Date(),
        eligibleOrdersCount: 0,
        isAuthenticated: true,
      }),
    ).toBe(false);
  });

  it("calculates discount with rounding and guards", () => {
    expect(calculateFirstOrderDiscount(100, true)).toBe(20);
    expect(calculateFirstOrderDiscount(199.99, true)).toBe(40);
    expect(calculateFirstOrderDiscount(100, false)).toBe(0);
    expect(calculateFirstOrderDiscount(0, true)).toBe(0);
    expect(calculateFirstOrderDiscount(-50, true)).toBe(0);
  });

  it("builds prior-order eligibility filter that ignores abandoned PENDING orders", () => {
    const filter = getEligiblePriorOrderFilter("u1");
    expect(filter.userId).toBe("u1");
    expect(filter.status.not).toBe(OrderStatus.CANCELLED);
    // Only PAID orders consume eligibility — abandoned PENDING orders don't.
    expect(filter.paymentStatus).toBe(PaymentStatus.PAID);
  });

  it("rounds currency to 2 decimals", () => {
    expect(roundCurrency(10.005)).toBe(10.01);
    expect(roundCurrency(10.004)).toBe(10);
    expect(roundCurrency(10)).toBe(10);
  });
});

import {
  calculateFirstOrderDiscount,
  canApplyFirstOrderDiscount,
  getCurrentMonthEnd,
  getEligiblePriorOrderFilter,
} from "@/server/services/orderPromotions";
import { OrderStatus, PaymentMethod, PaymentStatus } from "@/types";

describe("orderPromotions", () => {
  it("returns end of month in UTC", () => {
    const d = new Date("2026-05-18T10:00:00.000Z");
    expect(getCurrentMonthEnd(d).toISOString()).toBe("2026-05-31T23:59:59.999Z");
  });

  it("allows first-order discount only for online payment with zero eligible prior orders", () => {
    const now = new Date("2026-05-18T10:00:00.000Z");
    expect(
      canApplyFirstOrderDiscount({
        paymentMethod: PaymentMethod.CARD,
        now,
        eligibleOrdersCount: 0,
      }),
    ).toBe(true);
    expect(
      canApplyFirstOrderDiscount({
        paymentMethod: PaymentMethod.WALLET,
        now,
        eligibleOrdersCount: 1,
      }),
    ).toBe(false);
    expect(
      canApplyFirstOrderDiscount({
        paymentMethod: PaymentMethod.CASH,
        now,
        eligibleOrdersCount: 0,
      }),
    ).toBe(false);
  });

  it("calculates discount with rounding and guards", () => {
    expect(calculateFirstOrderDiscount(100, true)).toBe(20);
    expect(calculateFirstOrderDiscount(199.99, true)).toBe(40);
    expect(calculateFirstOrderDiscount(100, false)).toBe(0);
    expect(calculateFirstOrderDiscount(0, true)).toBe(0);
  });

  it("builds expected prior-order eligibility filter", () => {
    const filter = getEligiblePriorOrderFilter("u1");
    expect(filter.userId).toBe("u1");
    expect(filter.status.not).toBe(OrderStatus.CANCELLED);
    expect(filter.paymentStatus.notIn).toEqual([
      PaymentStatus.FAILED,
      PaymentStatus.REFUNDED,
    ]);
  });
});

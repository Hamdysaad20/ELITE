import { describe, it, expect } from "vitest";
import { calculateTotals } from "@/app/api/cart/route";
import type { CartItem } from "@/types";
import { CART_CONFIG } from "@/lib/constants";

describe("Cart Operations: calculateTotals", () => {
  it("should calculate zero totals for an empty cart", () => {
    const items: CartItem[] = [];
    const totals = calculateTotals(items);

    expect(totals.subtotal).toBe(0);
    expect(totals.tax).toBe(0);
    expect(totals.total).toBe(0);
    expect(totals.itemCount).toBe(0);
  });

  it("should calculate exact mathematical totals against CART_CONFIG precision", () => {
    // NOTE: calculateTotals sums item.price directly (the line-total field),
    // NOT basePrice * quantity. So subtotal = 50 + 75 = 125.
    const items: CartItem[] = [
      {
        id: "cart-item-1",
        productId: "p1",
        name: "Espresso",
        basePrice: 50,
        totalPrice: 50,
        price: 50,
        quantity: 2,
        attributes: {},
      },
      {
        id: "cart-item-2",
        productId: "p2",
        name: "Latte",
        basePrice: 75,
        totalPrice: 75,
        price: 75,
        quantity: 1,
        attributes: {},
      },
    ];

    const totals = calculateTotals(items);

    // subtotal = sum of item.price = 50 + 75 = 125
    const expectedSubtotal = 125;
    const expectedTax = Math.round((expectedSubtotal * CART_CONFIG.TAX_RATE) * 100) / 100;

    expect(totals.subtotal).toBe(expectedSubtotal);
    expect(totals.itemCount).toBe(3); // sum of quantities: 2 + 1

    // Assert 2-decimal precision on tax and total
    expect(totals.tax).toBeCloseTo(expectedTax, 2);
    expect(totals.total).toBeCloseTo(expectedSubtotal + expectedTax, 2);
  });

  it("should handle single-item cart correctly", () => {
    const items: CartItem[] = [
      {
        id: "cart-item-single",
        productId: "p3",
        name: "Mocha",
        basePrice: 90,
        totalPrice: 90,
        price: 90,
        quantity: 1,
        attributes: {},
      },
    ];

    const totals = calculateTotals(items);

    expect(totals.subtotal).toBe(90);
    expect(totals.itemCount).toBe(1);
    expect(totals.deliveryFee).toBe(0);
    expect(totals.total).toBeGreaterThanOrEqual(totals.subtotal);
  });
});

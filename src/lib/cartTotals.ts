import { CART_CONFIG } from "@/lib/constants";
import type { CartItem } from "@/types";

export function calculateTotals(items: CartItem[]) {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const tax = subtotal * CART_CONFIG.TAX_RATE;
  const deliveryFee = 0; // Delivery fee determined at checkout based on address
  const total = subtotal + tax + deliveryFee;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    deliveryFee,
    total: Number(total.toFixed(2)),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

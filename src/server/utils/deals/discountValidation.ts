/**
 * Discount validation utilities
 *
 * Rules:
 * 1. No deal can exceed 40% discount
 * 2. Discounts above 30% are only allowed for "large items"
 *    - Large items are defined as products with price >= 100 EGP
 *    - OR products that have a "Large" size option
 */

export interface ProductInfo {
  price: number;
  sizes?: Array<{ name: string }>;
  name?: string;
}

/**
 * Check if a product is considered a "large item"
 * Large items are:
 * - Products with price >= 100 EGP, OR
 * - Products that have a "Large" size option
 */
export function isLargeItem(product: ProductInfo): boolean {
  // Check price threshold (100 EGP or more)
  if (product.price >= 100) {
    return true;
  }

  // Check if product has a "Large" size option
  if (product.sizes && product.sizes.length > 0) {
    const hasLargeSize = product.sizes.some((size) =>
      size.name.toLowerCase().includes("large"),
    );
    if (hasLargeSize) {
      return true;
    }
  }

  return false;
}

/**
 * Validate discount percentage according to business rules
 *
 * @param discountPercent - The discount percentage to validate
 * @param product - Product information
 * @returns Object with isValid flag and error message if invalid
 */
export function validateDiscount(
  discountPercent: number,
  product: ProductInfo,
): { isValid: boolean; error?: string } {
  // Rule 1: No discount can exceed 40%
  if (discountPercent > 40) {
    return {
      isValid: false,
      error: `Discount cannot exceed 40%. Requested: ${discountPercent}%`,
    };
  }

  // Rule 2: Discounts above 30% are only for large items
  if (discountPercent > 30) {
    if (!isLargeItem(product)) {
      return {
        isValid: false,
        error: `Discounts above 30% are only allowed for large items (price >= 100 EGP or has Large size). Product: ${product.name || "Unknown"} (${product.price} EGP)`,
      };
    }
  }

  return { isValid: true };
}

/**
 * Clamp discount to valid range based on product
 *
 * @param discountPercent - The discount percentage to clamp
 * @param product - Product information
 * @returns Clamped discount percentage
 */
export function clampDiscount(
  discountPercent: number,
  product: ProductInfo,
): number {
  // First, ensure it doesn't exceed 40%
  let clamped = Math.min(discountPercent, 40);

  // If discount > 30% and product is not large, clamp to 30%
  if (clamped > 30 && !isLargeItem(product)) {
    clamped = 30;
  }

  return Math.max(0, Math.min(40, clamped));
}

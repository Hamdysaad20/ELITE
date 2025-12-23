/**
 * Security and business validation for deals
 * 
 * Prevents abuse and ensures deals serve business targets:
 * - Price manipulation prevention
 * - Discount validation
 * - Quantity limits
 * - Business rule enforcement
 */

import type { DealProduct } from "@/types/deals";
import { validateDiscount, clampDiscount } from "./discountValidation";

/**
 * Maximum allowed discount percentage (business rule)
 */
export const MAX_DISCOUNT_PERCENT = 40;

/**
 * Maximum discount for combo deals (business rule)
 */
export const MAX_COMBO_DISCOUNT_PERCENT = 30;

/**
 * Minimum price threshold (prevents negative or zero prices)
 */
export const MIN_PRICE = 0.01;

/**
 * Maximum price threshold (prevents unrealistic prices)
 */
export const MAX_PRICE = 10000;

/**
 * Validate deal product for security and business rules
 */
export function validateDealProduct(product: DealProduct): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Price validation
  if (product.originalPrice < MIN_PRICE) {
    errors.push(`Original price too low: ${product.originalPrice}`);
  }
  if (product.originalPrice > MAX_PRICE) {
    warnings.push(`Original price very high: ${product.originalPrice} EGP`);
  }
  if (product.dealPrice < MIN_PRICE) {
    errors.push(`Deal price too low: ${product.dealPrice}`);
  }
  if (product.dealPrice > product.originalPrice) {
    errors.push(`Deal price (${product.dealPrice}) cannot exceed original price (${product.originalPrice})`);
  }

  // 2. Discount validation
  if (product.savingsPercent > MAX_DISCOUNT_PERCENT) {
    errors.push(`Discount exceeds maximum: ${product.savingsPercent}% (max: ${MAX_DISCOUNT_PERCENT}%)`);
  }
  if (product.savings < 0) {
    errors.push(`Negative savings detected: ${product.savings}`);
  }

  // 3. Price calculation validation
  const expectedSavings = product.originalPrice - product.dealPrice;
  const expectedSavingsPercent = product.originalPrice > 0
    ? ((product.originalPrice - product.dealPrice) / product.originalPrice) * 100
    : 0;

  // Allow small rounding differences (0.01 EGP or 0.1%)
  if (Math.abs(product.savings - expectedSavings) > 0.01) {
    warnings.push(`Savings calculation mismatch: expected ${expectedSavings.toFixed(2)}, got ${product.savings.toFixed(2)}`);
  }
  if (Math.abs(product.savingsPercent - expectedSavingsPercent) > 0.1) {
    warnings.push(`Savings percentage mismatch: expected ${expectedSavingsPercent.toFixed(1)}%, got ${product.savingsPercent.toFixed(1)}%`);
  }

  // 4. Business rule: Large item discount validation
  if (product.savingsPercent > 30) {
    const isLargeItem = product.originalPrice >= 100;
    if (!isLargeItem) {
      errors.push(`Discount > 30% only allowed for large items (price >= 100 EGP). Product: ${product.name} (${product.originalPrice} EGP)`);
    }
  }

  // 5. Product availability validation
  if (product.dealActive && product.available === false) {
    warnings.push(`Deal is active but product is unavailable: ${product.name}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Sanitize and clamp deal product prices
 */
export function sanitizeDealProduct(product: DealProduct): DealProduct {
  const sanitized = { ...product };

  // Clamp prices to valid ranges
  sanitized.originalPrice = Math.max(MIN_PRICE, Math.min(MAX_PRICE, sanitized.originalPrice));
  sanitized.dealPrice = Math.max(MIN_PRICE, Math.min(MAX_PRICE, sanitized.dealPrice));

  // Ensure deal price doesn't exceed original
  if (sanitized.dealPrice > sanitized.originalPrice) {
    sanitized.dealPrice = sanitized.originalPrice;
  }

  // Recalculate savings
  sanitized.savings = sanitized.originalPrice - sanitized.dealPrice;
  sanitized.savingsPercent = sanitized.originalPrice > 0
    ? Math.round(((sanitized.originalPrice - sanitized.dealPrice) / sanitized.originalPrice) * 100)
    : 0;

  // Validate and clamp discount
  const validation = validateDiscount(sanitized.savingsPercent, {
    price: sanitized.originalPrice,
    name: sanitized.name,
  });

  if (!validation.isValid) {
    const clampedPercent = clampDiscount(sanitized.savingsPercent, {
      price: sanitized.originalPrice,
      name: sanitized.name,
    });
    sanitized.dealPrice = sanitized.originalPrice * (1 - clampedPercent / 100);
    sanitized.savings = sanitized.originalPrice - sanitized.dealPrice;
    sanitized.savingsPercent = clampedPercent;
  }

  // Round to 2 decimal places
  sanitized.dealPrice = Math.round(sanitized.dealPrice * 100) / 100;
  sanitized.savings = Math.round(sanitized.savings * 100) / 100;

  return sanitized;
}

/**
 * Validate combo deal
 */
export function validateComboDeal(combo: {
  items: Array<{ price: number }>;
  originalTotal: number;
  dealPrice: number;
  savingsPercent: number;
}): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Calculate expected original total
  const expectedTotal = combo.items.reduce((sum, item) => sum + item.price, 0);
  if (Math.abs(combo.originalTotal - expectedTotal) > 0.01) {
    warnings.push(`Original total mismatch: expected ${expectedTotal.toFixed(2)}, got ${combo.originalTotal.toFixed(2)}`);
  }

  // 2. Combo discount limit (30%)
  if (combo.savingsPercent > MAX_COMBO_DISCOUNT_PERCENT) {
    errors.push(`Combo discount exceeds maximum: ${combo.savingsPercent}% (max: ${MAX_COMBO_DISCOUNT_PERCENT}%)`);
  }

  // 3. Price validation
  if (combo.dealPrice < MIN_PRICE) {
    errors.push(`Combo deal price too low: ${combo.dealPrice}`);
  }
  if (combo.dealPrice > combo.originalTotal) {
    errors.push(`Combo deal price (${combo.dealPrice}) cannot exceed original total (${combo.originalTotal})`);
  }

  // 4. Minimum items check
  if (combo.items.length < 2) {
    errors.push(`Combo must have at least 2 items, got ${combo.items.length}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check for potential price manipulation
 */
export function detectPriceManipulation(
  originalPrice: number,
  dealPrice: number,
  expectedDiscount: number
): boolean {
  // Calculate actual discount
  const actualDiscount = originalPrice > 0
    ? ((originalPrice - dealPrice) / originalPrice) * 100
    : 0;

  // Check if discount is significantly different from expected
  const difference = Math.abs(actualDiscount - expectedDiscount);
  
  // Allow 1% tolerance for rounding
  if (difference > 1) {
    return true;
  }

  // Check if deal price is suspiciously low
  if (dealPrice < originalPrice * 0.5) {
    return true; // More than 50% discount is suspicious
  }

  return false;
}


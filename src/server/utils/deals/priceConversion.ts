/**
 * Price conversion utilities for deals
 * 
 * Converts fixed prices to percentage discounts to ensure:
 * - Discounts remain correct when base prices change
 * - Easier maintenance in Odoo
 * - Consistent pricing between POS and website
 */

/**
 * Calculate percentage discount from original and deal prices
 * @param originalPrice Original product price
 * @param dealPrice Deal price (discounted)
 * @returns Percentage discount (0-100)
 * 
 * @example
 * calculateDiscountPercentage(50, 40) // Returns 20 (20% discount)
 */
export function calculateDiscountPercentage(
  originalPrice: number,
  dealPrice: number
): number {
  if (originalPrice <= 0) return 0;
  if (dealPrice >= originalPrice) return 0;
  if (dealPrice < 0) return 0;
  
  const discount = ((originalPrice - dealPrice) / originalPrice) * 100;
  return Math.round(discount * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate deal price from original price and percentage discount
 * @param originalPrice Original product price
 * @param discountPercentage Percentage discount (0-100)
 * @returns Deal price after discount
 * 
 * @example
 * calculateDealPrice(50, 20) // Returns 40 (20% off 50)
 */
export function calculateDealPrice(
  originalPrice: number,
  discountPercentage: number
): number {
  if (originalPrice <= 0) return 0;
  if (discountPercentage <= 0) return originalPrice;
  if (discountPercentage >= 100) return 0;
  
  const dealPrice = originalPrice * (1 - discountPercentage / 100);
  return Math.round(dealPrice * 100) / 100; // Round to 2 decimal places
}

/**
 * Convert fixed price deal to percentage discount
 * This is useful when migrating from fixed prices to percentage-based discounts
 * 
 * @param originalPrice Original product price
 * @param fixedDealPrice Fixed deal price
 * @returns Object with percentage discount and calculated deal price
 * 
 * @example
 * convertFixedToPercentage(50, 40)
 * // Returns { percentage: 20, dealPrice: 40 }
 * 
 * // If original price changes to 60:
 * calculateDealPrice(60, 20) // Returns 48 (still 20% off)
 */
export function convertFixedToPercentage(
  originalPrice: number,
  fixedDealPrice: number
): { percentage: number; dealPrice: number } {
  const percentage = calculateDiscountPercentage(originalPrice, fixedDealPrice);
  const dealPrice = calculateDealPrice(originalPrice, percentage);
  
  return {
    percentage,
    dealPrice,
  };
}

/**
 * Validate that a percentage discount is reasonable
 * @param percentage Percentage discount (0-100)
 * @param maxPercentage Maximum allowed percentage (default: 90)
 * @returns true if percentage is valid
 */
export function isValidDiscountPercentage(
  percentage: number,
  maxPercentage: number = 90
): boolean {
  return percentage > 0 && percentage <= maxPercentage;
}

/**
 * Premium Rounding: Round prices to the nearest 5 EGP for brand aesthetics
 * This maintains a premium "Elite" feel by avoiding odd prices like 113 EGP
 * 
 * @param price Original price to round
 * @returns Price rounded to nearest 5 EGP
 * 
 * @example
 * premiumRound(113) // Returns 115
 * premiumRound(127) // Returns 125
 * premiumRound(98)  // Returns 100
 * premiumRound(87.3) // Returns 85
 * 
 * Formula: 5 × round(price / 5)
 */
export function premiumRound(price: number): number {
  if (price <= 0) return 0;
  return Math.round(price / 5) * 5;
}


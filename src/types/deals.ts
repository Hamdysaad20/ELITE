/**
 * Type definitions for deals system
 *
 * Centralized types to avoid circular dependencies
 */

export interface DealProduct {
  id: string;
  name: string;
  description?: string | null;
  price: number; // Original price
  originalPrice: number;
  dealPrice: number;
  dealActive: boolean;
  savings: number;
  savingsPercent: number;
  categoryId?: string;
  images?: string[];
  available?: boolean;
  sku?: string;
  comboItems?: Array<{
    productId: string;
    name: string;
    quantity: number;
    image?: string;
    price: number;
    originalPrice: number;
  }>;
}

export interface ComboDeal {
  id: string;
  name: string;
  description?: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    image?: string;
    categoryId?: string;
  }>;
  originalTotal: number;
  dealPrice: number;
  dealActive: boolean;
  savings: number;
  savingsPercent: number;
}

export interface Deal {
  id: string;
  name: string;
  description?: string;
  pricelistId: number;
  products: DealProduct[];
  active: boolean;
  combos?: ComboDeal[];
}

/**
 * Enhanced Deal Discovery API types
 * Used for /api/v1/deals/discovery endpoint
 */
export interface DealDiscoveryChoiceSet {
  name: string;
  required: boolean;
  options: Array<{
    id: string;
    name: string;
    extra: number;
    available: boolean;
  }>;
}

export interface DealDiscoveryGamification {
  badge_id?: string;
  streak_eligible: boolean;
}

export interface DealDiscoveryPricing {
  deal_price: number; // Rounded
  original_value: number;
  savings_percentage: number;
  savings_amount: number;
}

export interface DealDiscovery {
  deal_id: string;
  slug: string;
  display_name: string;
  pricing: DealDiscoveryPricing;
  selection_logic?: {
    choice_sets: DealDiscoveryChoiceSet[];
  };
  gamification?: DealDiscoveryGamification;
  is_available: boolean;
  ends_in_seconds?: number; // Countdown timer for time-sensitive deals
}

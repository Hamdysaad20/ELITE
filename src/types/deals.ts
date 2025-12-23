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


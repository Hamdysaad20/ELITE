import { NextRequest } from "next/server";
import {
  jsonResponse,
  successResponse,
  errorResponse,
} from "@/server/utils/apiHelpers";
import { createOdooClient, isOdooConfigured } from "@/server/utils/odooClient";
import { getProductsSafe } from "@/server/services/product.service";
import { isDealActive, getDealTimeWindowDescription, DEAL_TIME_WINDOWS } from "@/server/utils/deals/timeValidation";
import { calculateDealPrice, premiumRound } from "@/server/utils/deals/priceConversion";
import { validateDiscount, clampDiscount } from "@/server/utils/deals/discountValidation";
import { validateDealProduct, sanitizeDealProduct } from "@/server/utils/deals/securityValidation";
import type { DealDiscovery, DealDiscoveryPricing, DealDiscoveryGamification } from "@/types/deals";
import { formatInTimeZone } from 'date-fns-tz';

const TIMEZONE = 'Africa/Cairo';

/**
 * Calculate countdown timer in seconds for time-sensitive deals
 * Returns seconds until deal ends, or undefined if not time-sensitive
 */
function calculateCountdown(pricelistName: string): number | undefined {
  const window = DEAL_TIME_WINDOWS[pricelistName];
  
  if (!window || window.endHour === undefined) {
    return undefined; // Not time-sensitive
  }
  
  try {
    const now = new Date();
    const egyptTime = formatInTimeZone(now, TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
    const [dateStr, timeStr] = egyptTime.split(' ');
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hour, minute] = timeStr.split(':').map(Number);
    
    const currentMinutes = hour * 60 + minute;
    const endMinutes = (window.endHour || 0) * 60 + (window.endMinute || 0);
    
    // Handle midnight wrap-around
    let endMinutesAdjusted = endMinutes;
    if (endMinutes < (window.startHour || 0) * 60 + (window.startMinute || 0)) {
      endMinutesAdjusted += 24 * 60;
    }
    
    const currentMinutesAdjusted = currentMinutes < (window.startHour || 0) * 60 + (window.startMinute || 0)
      ? currentMinutes + 24 * 60
      : currentMinutes;
    
    if (currentMinutesAdjusted >= endMinutesAdjusted) {
      return undefined; // Deal has ended today
    }
    
    const secondsRemaining = (endMinutesAdjusted - currentMinutesAdjusted) * 60;
    return Math.max(0, secondsRemaining);
  } catch (error) {
    console.error('[Discovery API] Error calculating countdown:', error);
    return undefined;
  }
}

/**
 * Get gamification info for a deal
 */
function getGamificationInfo(pricelistName: string): DealDiscoveryGamification {
  // Map deal types to gamification eligibility
  const streakEligible = [
    'Monday Morning Deals',
    'Happy Hour Deals',
    'Weekend Specials',
    'Late Night Deals',
  ].includes(pricelistName);
  
  // Map deal types to badge IDs
  const badgeMap: Record<string, string> = {
    'Monday Morning Deals': 'morning-legend',
    'Weekend Specials': 'combo-master',
    'Happy Hour Deals': 'happy-hour-hero',
  };
  
  return {
    badge_id: badgeMap[pricelistName],
    streak_eligible: streakEligible,
  };
}

/**
 * Generate slug from deal name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * GET /api/v1/deals/discovery
 * 
 * Enhanced deal discovery API with:
 * - Rounded prices (premium rounding)
 * - Gamification fields
 * - Countdown timers
 * - Enhanced schema for mobile apps
 * 
 * Query params:
 * - includeInactive: boolean - include products even if deal is not active
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `discovery-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  
  console.log(`[DISCOVERY API ${requestId}] Request started`);
  
  try {
    const url = new URL(request.url);
    const includeInactive = url.searchParams.get("includeInactive") === "true";
    
    // Get all products from cache
    let allProducts: Awaited<ReturnType<typeof getProductsSafe>>["products"];
    try {
      const productsResult = await getProductsSafe();
      allProducts = productsResult.products;
      console.log(`[DISCOVERY API ${requestId}] ✅ Loaded ${allProducts.length} products from cache`);
    } catch (productsError) {
      console.error(`[DISCOVERY API ${requestId}] ❌ Error loading products:`, productsError);
      return jsonResponse(
        errorResponse(`Failed to load products: ${productsError instanceof Error ? productsError.message : String(productsError)}`),
        500,
      );
    }
    
    // If Odoo is not configured, return empty deals
    if (!isOdooConfigured()) {
      return jsonResponse(
        successResponse({
          metadata: {
            total: 0,
            server_time: new Date().toISOString(),
          },
          results: [],
        }),
      );
    }
    
    const client = createOdooClient();
    if (!client) {
      return jsonResponse(
        errorResponse("Failed to initialize Odoo client"),
        500,
      );
    }
    
    // Get all active pricelists
    let pricelists;
    try {
      pricelists = await client.getAllActivePricelists();
      pricelists.sort((a, b) => {
        if (a.name === "General Deals") return 1;
        if (b.name === "General Deals") return -1;
        return 0;
      });
    } catch (pricelistError) {
      return jsonResponse(
        errorResponse(`Failed to fetch pricelists: ${pricelistError instanceof Error ? pricelistError.message : String(pricelistError)}`),
        500,
      );
    }
    
    if (!pricelists || pricelists.length === 0) {
      return jsonResponse(
        successResponse({
          metadata: {
            total: 0,
            server_time: new Date().toISOString(),
          },
          results: [],
        }),
      );
    }
    
    // Allowed categories
    const ALLOWED_CATEGORIES = ['Coffee', 'Food', 'Frappe', 'Iced', 'Milkshake', 'Smoothie', 'Soda', 'Tea'];
    const EXCLUDED_CATEGORIES = ['Extras', 'EXTRA', 'Services', 'Offers', 'Expenses', 'Toppings', 'Sauces', 'Elite Essentials'];
    const EXCLUDED_PRODUCT_NAMES = ['deposit', 'water', 'morning bird', 'chai latte'];
    
    function shouldExcludeProduct(product: typeof allProducts[0]): boolean {
      if (product.category?.name) {
        const categoryName = product.category.name;
        if (EXCLUDED_CATEGORIES.some(excluded => 
          categoryName.toLowerCase() === excluded.toLowerCase()
        )) {
          return true;
        }
      }
      if (product.name) {
        const productNameLower = product.name.toLowerCase();
        if (EXCLUDED_PRODUCT_NAMES.some(excluded => 
          productNameLower.includes(excluded.toLowerCase())
        )) {
          return true;
        }
      }
      return false;
    }
    
    // Filter products
    const eligibleProducts = allProducts.filter(product => {
      if (shouldExcludeProduct(product)) return false;
      if (product.category?.name && !ALLOWED_CATEGORIES.includes(product.category.name)) return false;
      return true;
    });
    
    const discoveryDeals: DealDiscovery[] = [];
    
    for (const pricelist of pricelists) {
      try {
        if (pricelist.name.toLowerCase() === "default" || pricelist.name.toLowerCase().includes("base")) {
          continue;
        }
        
        // Server-side time validation
        const dealIsActive = isDealActive(pricelist.name);
        
        if (!dealIsActive && !includeInactive) {
          continue;
        }
        
        // Get pricelist items
        let pricelistItems: Array<{
          product_id?: number | [number, string] | false;
          categ_id?: number | [number, string] | false;
          fixed_price?: number;
          compute_price?: string;
          percent_price?: number;
          date_start?: string;
          date_end?: string;
        }>;
        
        try {
          pricelistItems = await client.searchRead<{
            product_id?: number | [number, string] | false;
            categ_id?: number | [number, string] | false;
            fixed_price?: number;
            compute_price?: string;
            percent_price?: number;
            date_start?: string;
            date_end?: string;
          }>(
            "product.pricelist.item",
            [["pricelist_id", "=", pricelist.id]],
            ["product_id", "categ_id", "fixed_price", "compute_price", "percent_price", "date_start", "date_end"],
          );
        } catch (itemsError) {
          continue;
        }
        
        if (!pricelistItems || pricelistItems.length === 0) {
          continue;
        }
        
        // Filter by date
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const validItems = pricelistItems.filter((item) => {
          if (item.date_start) {
            const startDate = new Date(item.date_start);
            startDate.setHours(0, 0, 0, 0);
            if (today < startDate) return false;
          }
          if (item.date_end) {
            const endDate = new Date(item.date_end);
            endDate.setHours(23, 59, 59, 999);
            if (today > endDate) return false;
          }
          return true;
        });
        
        if (validItems.length === 0) {
          continue;
        }
        
        // Process items to get deal pricing
        const productDealPrices = new Map<number, number>();
        const categoryDealPrices = new Map<number, number>();
        const categoryDealPercentages = new Map<number, number>();
        const productDealPercentages = new Map<number, number>();
        let globalPercentage: number | null = null;
        
        for (const item of validItems) {
          const computePrice = item.compute_price || "fixed";
          
          if (item.product_id && (typeof item.product_id === 'number' || Array.isArray(item.product_id))) {
            const productId = Array.isArray(item.product_id) ? item.product_id[0] : item.product_id;
            if (productId && productId > 0) {
              if (computePrice === "fixed" && item.fixed_price) {
                productDealPrices.set(productId, item.fixed_price);
              } else if (computePrice === "percentage" && item.percent_price) {
                productDealPercentages.set(productId, Math.abs(item.percent_price));
              }
            }
          } else if (item.categ_id && (typeof item.categ_id === 'number' || Array.isArray(item.categ_id))) {
            const categoryId = Array.isArray(item.categ_id) ? item.categ_id[0] : item.categ_id;
            if (categoryId && categoryId > 0) {
              if (computePrice === "fixed" && item.fixed_price) {
                categoryDealPrices.set(categoryId, item.fixed_price);
              } else if (computePrice === "percentage" && item.percent_price) {
                categoryDealPercentages.set(categoryId, Math.abs(item.percent_price));
              }
            }
          } else if (computePrice === "percentage" && item.percent_price) {
            globalPercentage = Math.abs(item.percent_price);
          }
        }
        
        // Find products matching this deal
        const dealProducts = eligibleProducts.filter((product) => {
          const productId = parseInt(product.id, 10);
          const categoryId = product.categoryId ? parseInt(product.categoryId, 10) : null;
          
          return (
            productDealPrices.has(productId) ||
            productDealPercentages.has(productId) ||
            (categoryId && categoryDealPrices.has(categoryId)) ||
            (categoryId && categoryDealPercentages.has(categoryId)) ||
            globalPercentage !== null
          );
        });
        
        if (dealProducts.length === 0) {
          continue;
        }
        
        // Calculate pricing for first product (representative)
        const representativeProduct = dealProducts[0];
        const productId = parseInt(representativeProduct.id, 10);
        const categoryId = representativeProduct.categoryId ? parseInt(representativeProduct.categoryId, 10) : null;
        const originalPrice = representativeProduct.price;
        
        let dealPrice = originalPrice;
        
        if (productDealPrices.has(productId)) {
          dealPrice = productDealPrices.get(productId)!;
        } else if (productDealPercentages.has(productId)) {
          let percentage = productDealPercentages.get(productId)!;
          const validation = validateDiscount(percentage, { price: originalPrice, name: representativeProduct.name || '' });
          if (!validation.isValid) {
            percentage = clampDiscount(percentage, { price: originalPrice, name: representativeProduct.name || '' });
          }
          dealPrice = calculateDealPrice(originalPrice, percentage);
        } else if (categoryId && categoryDealPrices.has(categoryId)) {
          dealPrice = categoryDealPrices.get(categoryId)!;
        } else if (categoryId && categoryDealPercentages.has(categoryId)) {
          let percentage = categoryDealPercentages.get(categoryId)!;
          const validation = validateDiscount(percentage, { price: originalPrice, name: representativeProduct.name || '' });
          if (!validation.isValid) {
            percentage = clampDiscount(percentage, { price: originalPrice, name: representativeProduct.name || '' });
          }
          dealPrice = calculateDealPrice(originalPrice, percentage);
        } else if (globalPercentage !== null) {
          let percentage = globalPercentage;
          const validation = validateDiscount(percentage, { price: originalPrice, name: representativeProduct.name || '' });
          if (!validation.isValid) {
            percentage = clampDiscount(percentage, { price: originalPrice, name: representativeProduct.name || '' });
          }
          dealPrice = calculateDealPrice(originalPrice, percentage);
        }
        
        // Apply premium rounding
        dealPrice = premiumRound(dealPrice);
        
        const savings = originalPrice - dealPrice;
        const savingsPercent = originalPrice > 0
          ? Math.round(((originalPrice - dealPrice) / originalPrice) * 100)
          : 0;
        
        const pricing: DealDiscoveryPricing = {
          deal_price: dealPrice,
          original_value: originalPrice,
          savings_percentage: savingsPercent,
          savings_amount: savings,
        };
        
        // Calculate countdown
        const endsInSeconds = calculateCountdown(pricelist.name);
        
        // Get gamification info
        const gamification = getGamificationInfo(pricelist.name);
        
        const discoveryDeal: DealDiscovery = {
          deal_id: `deal-${pricelist.id}`,
          slug: generateSlug(pricelist.name),
          display_name: pricelist.name,
          pricing,
          gamification,
          is_available: dealIsActive,
          ends_in_seconds: endsInSeconds,
        };
        
        discoveryDeals.push(discoveryDeal);
      } catch (err) {
        console.error(`[DISCOVERY API] Error processing pricelist ${pricelist.id}:`, err);
        continue;
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`[DISCOVERY API ${requestId}] ✅ Completed in ${duration}ms, returning ${discoveryDeals.length} deal(s)`);
    
    return jsonResponse(
      successResponse({
        metadata: {
          total: discoveryDeals.length,
          server_time: new Date().toISOString(),
        },
        results: discoveryDeals,
      }),
    );
  } catch (error) {
    console.error(`[DISCOVERY API ${requestId}] ❌ Error:`, error);
    return jsonResponse(
      errorResponse(`Failed to fetch deals: ${error instanceof Error ? error.message : String(error)}`),
      500,
    );
  }
}


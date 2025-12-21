import { NextRequest } from "next/server";
import {
  jsonResponse,
  successResponse,
  errorResponse,
} from "@/server/utils/apiHelpers";
import { createOdooClient, isOdooConfigured } from "@/server/utils/odooClient";
import { getProductsSafe } from "@/server/services/product.service";
import { isDealActive, getDealTimeWindowDescription } from "@/server/utils/deals/timeValidation";
import { calculateDealPrice } from "@/server/utils/deals/priceConversion";
import { validateDiscount, clampDiscount, isLargeItem } from "@/server/utils/deals/discountValidation";
// Temporarily disabled for debugging
// import { validateDealProduct, sanitizeDealProduct } from "@/server/utils/deals/securityValidation";

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
  combos?: ComboDeal[]; // Combo deals for this pricelist
}

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
}

/**
 * GET /api/deals
 * 
 * Fetches all active deals from Odoo pricelists.
 * 
 * Returns deals grouped by pricelist with:
 * - Original price (list_price)
 * - Deal price (from pricelist)
 * - Deal validity status
 * 
 * Query params:
 * - includeInactive: boolean - include products even if deal is not active
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  
  console.log(`[DEALS API ${requestId}] Request started`);
  
  try {
    const url = new URL(request.url);
    const includeInactive = url.searchParams.get("includeInactive") === "true";
    console.log(`[DEALS API ${requestId}] Params: includeInactive=${includeInactive}`);
    
    // Get all products from cache
    console.log(`[DEALS API ${requestId}] Fetching products from cache...`);
    let allProducts: Awaited<ReturnType<typeof getProductsSafe>>["products"];
    try {
      const productsResult = await getProductsSafe();
      allProducts = productsResult.products;
      console.log(`[DEALS API ${requestId}] ✅ Loaded ${allProducts.length} products from cache`);
    } catch (productsError) {
      console.error(`[DEALS API ${requestId}] ❌ Error loading products:`, productsError);
      return jsonResponse(
        errorResponse(`Failed to load products: ${productsError instanceof Error ? productsError.message : String(productsError)}`),
        500,
      );
    }
    
    // If Odoo is not configured, return empty deals
    if (!isOdooConfigured()) {
      console.log(`[DEALS API ${requestId}] ⚠️  Odoo not configured, returning empty deals`);
      return jsonResponse(
        successResponse({
          deals: [],
          message: "Odoo not configured",
        }),
      );
    }
    
    console.log(`[DEALS API ${requestId}] Creating Odoo client...`);
    const client = createOdooClient();
    if (!client) {
      console.error(`[DEALS API ${requestId}] ❌ Failed to create Odoo client`);
      return jsonResponse(
        errorResponse("Failed to initialize Odoo client"),
        500,
      );
    }
    console.log(`[DEALS API ${requestId}] ✅ Odoo client created`);
    
    // Get all active pricelists
    console.log(`[DEALS API ${requestId}] Fetching active pricelists...`);
    let pricelists;
    try {
      pricelists = await client.getAllActivePricelists();
      console.log(`[DEALS API ${requestId}] ✅ Found ${pricelists?.length || 0} active pricelist(s)`);
    } catch (pricelistError) {
      console.error(`[DEALS API ${requestId}] ❌ Error fetching pricelists:`, pricelistError);
      return jsonResponse(
        errorResponse(`Failed to fetch pricelists: ${pricelistError instanceof Error ? pricelistError.message : String(pricelistError)}`),
        500,
      );
    }
    
    if (!pricelists || pricelists.length === 0) {
      return jsonResponse(
        successResponse({
          deals: [],
          message: "No active pricelists found. Create pricelists in Odoo to enable deals.",
        }),
      );
    }
    
    // Allowed categories for deals (from requirements)
    const ALLOWED_CATEGORIES = ['Coffee', 'Food', 'Frappe', 'Iced', 'Milkshake', 'Smoothie', 'Soda', 'Tea'];
    
    // Categories that should NEVER appear in deals
    const EXCLUDED_CATEGORIES = [
      'Extras',           // Add-ons and extras (these are attributes)
      'EXTRA',            // Case variation
      'Services',         // Administrative items like "OPEN REGISTER"
      'Offers',           // Discounts and promotions (not browsable menu items)
      'Expenses',         // Internal expense tracking
      'Toppings',         // Add-ons (handled as product attributes)
      'Sauces',           // Add-ons (handled as product attributes)
      'Elite Essentials', // Internal supplies
    ];
    
    // Product names that should NEVER appear in deals (case-insensitive partial match)
    const EXCLUDED_PRODUCT_NAMES = [
      'deposit',
      'water',
      'morning bird',
      'chai latte', // If this is an offer/promotion, exclude it
    ];
    
    /**
     * Check if a product should be excluded from deals
     */
    function shouldExcludeProduct(product: typeof allProducts[0]): boolean {
      // Check category exclusion
      if (product.category?.name) {
        const categoryName = product.category.name;
        if (EXCLUDED_CATEGORIES.some(excluded => 
          categoryName.toLowerCase() === excluded.toLowerCase()
        )) {
          return true;
        }
      }
      
      // Check if category ID matches excluded categories (by name lookup)
      // This handles cases where we only have categoryId
      if (product.categoryId) {
        // We'll check this after we have category info
      }
      
      // Check product name exclusion
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
    
    // Fetch pricelist items for all pricelists
    const deals: Deal[] = [];
    
    console.log(`[DEALS API ${requestId}] Processing ${pricelists.length} pricelist(s)...`);
    
    for (const pricelist of pricelists) {
      try {
        console.log(`[DEALS API ${requestId}] Processing pricelist: ${pricelist.name} (ID: ${pricelist.id})`);
        
        // Skip "Default" pricelist - it's usually base pricing, not a deal
        if (pricelist.name.toLowerCase() === "default" || pricelist.name.toLowerCase().includes("base")) {
          console.log(`[DEALS API ${requestId}] ⏭️  Skipping base/default pricelist: ${pricelist.name}`);
          continue;
        }
        
        // Server-side time validation
        let dealIsActive: boolean;
        try {
          dealIsActive = isDealActive(pricelist.name);
          console.log(`[DEALS API ${requestId}] Time validation for "${pricelist.name}": ${dealIsActive ? "ACTIVE" : "INACTIVE"}`);
        } catch (timeValidationError) {
          console.error(`[DEALS API ${requestId}] ❌ Time validation error for "${pricelist.name}":`, timeValidationError);
          dealIsActive = false; // Default to inactive on error
        }
        
        // If deal is not active and we're not including inactive, skip it
        if (!dealIsActive && !includeInactive) {
          console.log(`[DEALS API ${requestId}] ⏭️  Skipping inactive deal (includeInactive=false)`);
          continue;
        }
        
        // Get pricelist items (include category-based rules)
        console.log(`[DEALS API ${requestId}] Fetching pricelist items for "${pricelist.name}"...`);
        let pricelistItems;
        try {
          pricelistItems = await client.searchRead<any>(
            "product.pricelist.item",
            [["pricelist_id", "=", pricelist.id]],
            ["product_id", "categ_id", "fixed_price", "compute_price", "percent_price", "date_start", "date_end"],
          );
          console.log(`[DEALS API ${requestId}] ✅ Found ${pricelistItems?.length || 0} pricelist item(s)`);
        } catch (itemsError) {
          console.error(`[DEALS API ${requestId}] ❌ Error fetching pricelist items:`, itemsError);
          continue; // Skip this pricelist and continue with others
        }
        
        if (!pricelistItems || pricelistItems.length === 0) {
          console.log(`[DEALS API ${requestId}] ⏭️  Skipping pricelist with no items`);
          continue;
        }
        
        // Filter items by date if date_start/date_end are set (Odoo native validation)
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const validItems = pricelistItems.filter((item: any) => {
          // If date_start is set, check if today is after start date
          if (item.date_start) {
            const startDate = new Date(item.date_start);
            startDate.setHours(0, 0, 0, 0);
            if (today < startDate) {
              return false; // Deal hasn't started yet
            }
          }
          
          // If date_end is set, check if today is before end date
          if (item.date_end) {
            const endDate = new Date(item.date_end);
            endDate.setHours(23, 59, 59, 999); // End of day
            if (today > endDate) {
              return false; // Deal has expired
            }
          }
          
          return true; // Item is within date range
        });
        
        if (validItems.length === 0) {
          console.log(`[DEALS API ${requestId}] ⏭️  All pricelist items are outside date range, skipping`);
          continue;
        }
        
        // Use filtered items
        pricelistItems = validItems;
        
        // Create maps for product-specific, category-based, and global rules
        const productDealPrices = new Map<number, number>();
        const categoryDealPrices = new Map<number, number>();
        const categoryDealPercentages = new Map<number, number>();
        const productDealPercentages = new Map<number, number>();
        
        // Global rules (apply to all products)
        let globalFixedPrice: number | null = null;
        let globalPercentage: number | null = null;
        
        for (const item of pricelistItems) {
          const computePrice = item.compute_price || "fixed";
          
          // Handle product-specific rules
          if (item.product_id && item.product_id !== false) {
            let productId: number | null = null;
            if (Array.isArray(item.product_id)) {
              productId = item.product_id[0];
            } else if (typeof item.product_id === 'number') {
              productId = item.product_id;
            }
            
            if (productId && productId > 0) {
              if (computePrice === "fixed" && item.fixed_price) {
                productDealPrices.set(productId, item.fixed_price);
              } else if (computePrice === "percentage" && item.percent_price) {
                productDealPercentages.set(productId, item.percent_price);
              }
            }
          }
          // Handle category-based rules
          else if (item.categ_id && item.categ_id !== false) {
            let categoryId: number | null = null;
            if (Array.isArray(item.categ_id)) {
              categoryId = item.categ_id[0];
            } else if (typeof item.categ_id === 'number') {
              categoryId = item.categ_id;
            }
            
            if (categoryId && categoryId > 0) {
              if (computePrice === "fixed" && item.fixed_price) {
                categoryDealPrices.set(categoryId, item.fixed_price);
              } else if (computePrice === "percentage" && item.percent_price) {
                categoryDealPercentages.set(categoryId, item.percent_price);
              }
            }
          }
          // Handle global rules (no product_id or categ_id)
          else {
            if (computePrice === "fixed" && item.fixed_price) {
              // For global fixed prices, we'll only apply if there are no other rules
              // This is typically a base price, not a deal
              // Skip global fixed prices for now (they're usually base prices)
            } else if (computePrice === "percentage" && item.percent_price) {
              // Global percentage applies to all products
              globalPercentage = item.percent_price;
            }
          }
        }
        
        // Determine which products to include
        // If we have specific rules (product/category), only include those
        // If we only have global rules, include all products
        const hasSpecificRules = 
          productDealPrices.size > 0 ||
          productDealPercentages.size > 0 ||
          categoryDealPrices.size > 0 ||
          categoryDealPercentages.size > 0;
        
        let dealProducts: typeof allProducts;
        
        if (hasSpecificRules) {
          // Filter products that match specific rules
          console.log(`[DEALS API ${requestId}] Matching products to specific rules (product: ${productDealPrices.size} fixed, ${productDealPercentages.size} %, category: ${categoryDealPrices.size} fixed, ${categoryDealPercentages.size} %)...`);
          dealProducts = allProducts.filter((product) => {
            const productId = parseInt(product.id, 10);
            const categoryId = product.categoryId ? parseInt(product.categoryId, 10) : null;
            
            return (
              productDealPrices.has(productId) ||
              productDealPercentages.has(productId) ||
              (categoryId && categoryDealPrices.has(categoryId)) ||
              (categoryId && categoryDealPercentages.has(categoryId))
            );
          });
          console.log(`[DEALS API ${requestId}] ✅ Matched ${dealProducts.length} product(s) to specific rules`);
        } else if (globalPercentage !== null) {
          // Global percentage applies to all products
          console.log(`[DEALS API ${requestId}] Applying global percentage (${globalPercentage}%) to all products`);
          dealProducts = allProducts;
        } else {
          // No applicable rules, skip this pricelist
          console.log(`[DEALS API ${requestId}] ⏭️  No applicable rules found, skipping pricelist`);
          continue;
        }
        
        if (dealProducts.length === 0) {
          // Skip deals with no matching products
          console.log(`[DEALS API ${requestId}] ⏭️  No products matched to pricelist rules, skipping`);
          continue;
        }
        
        // Filter out excluded products and categories
        const filteredProducts = dealProducts.filter((product) => {
          // Check if product should be excluded (checks excluded categories and product names)
          if (shouldExcludeProduct(product)) {
            return false;
          }
          
          // Ensure product is in allowed categories
          const categoryName = product.category?.name;
          if (categoryName) {
            // Must be in allowed categories
            if (!ALLOWED_CATEGORIES.includes(categoryName)) {
              return false;
            }
          } else if (product.categoryId) {
            // If we only have categoryId, we need to check it matches allowed categories
            // This is a fallback - ideally we should have category name
            // For now, we'll allow it if it's not in excluded categories
            // (The shouldExcludeProduct already checked excluded categories)
          }
          
          return true;
        });
        
        if (filteredProducts.length === 0) {
          // Skip deals with no valid products after filtering
          continue;
        }
        
        // Enrich products with deal information
        console.log(`[DEALS API ${requestId}] Enriching ${filteredProducts.length} products with deal pricing...`);
        const enrichedProducts: DealProduct[] = filteredProducts.map((product) => {
          const productId = parseInt(product.id, 10);
          const categoryId = product.categoryId ? parseInt(product.categoryId, 10) : null;
          const originalPrice = product.price;
          
          // Calculate deal price: product-specific > category > global
          let dealPrice = originalPrice;
          
          // 1. Check product-specific fixed price
          if (productDealPrices.has(productId)) {
            dealPrice = productDealPrices.get(productId)!;
          }
          // 2. Check product-specific percentage
          else if (productDealPercentages.has(productId)) {
            let percentage = productDealPercentages.get(productId)!;
            // Validate and clamp discount according to business rules
            const validation = validateDiscount(percentage, {
              price: originalPrice,
              name: product.name,
            });
            if (!validation.isValid) {
              console.warn(`[DEALS API] Invalid discount for product ${product.name}: ${validation.error}. Clamping...`);
              percentage = clampDiscount(percentage, {
                price: originalPrice,
                name: product.name,
              });
            }
            dealPrice = calculateDealPrice(originalPrice, percentage);
          }
          // 3. Check category-specific fixed price
          else if (categoryId && categoryDealPrices.has(categoryId)) {
            dealPrice = categoryDealPrices.get(categoryId)!;
          }
          // 4. Check category-specific percentage
          else if (categoryId && categoryDealPercentages.has(categoryId)) {
            let percentage = categoryDealPercentages.get(categoryId)!;
            // Validate and clamp discount according to business rules
            const validation = validateDiscount(percentage, {
              price: originalPrice,
              name: product.name,
            });
            if (!validation.isValid) {
              console.warn(`[DEALS API] Invalid discount for product ${product.name}: ${validation.error}. Clamping...`);
              percentage = clampDiscount(percentage, {
                price: originalPrice,
                name: product.name,
              });
            }
            dealPrice = calculateDealPrice(originalPrice, percentage);
          }
          // 5. Check global percentage (applies to all products if no specific rules)
          else if (globalPercentage !== null) {
            let percentage = globalPercentage;
            // Validate and clamp discount according to business rules
            const validation = validateDiscount(percentage, {
              price: originalPrice,
              name: product.name,
            });
            if (!validation.isValid) {
              console.warn(`[DEALS API] Invalid discount for product ${product.name}: ${validation.error}. Clamping...`);
              percentage = clampDiscount(percentage, {
                price: originalPrice,
                name: product.name,
              });
            }
            dealPrice = calculateDealPrice(originalPrice, percentage);
          }
          
          // Round to 2 decimal places
          dealPrice = Math.round(dealPrice * 100) / 100;
          
          // Use server-side time validation result
          const dealActive = dealIsActive;
          
          // Create deal product
          const dealProduct: DealProduct = {
            ...product,
            originalPrice,
            dealPrice,
            dealActive,
            savings: originalPrice - dealPrice,
            savingsPercent: originalPrice > 0
              ? Math.round(((originalPrice - dealPrice) / originalPrice) * 100)
              : 0,
          };
          
          // Security validation temporarily disabled for debugging
          // TODO: Re-enable after fixing import issues
          // try {
          //   const validation = validateDealProduct(dealProduct);
          //   if (!validation.isValid) {
          //     console.warn(`[DEALS API] Invalid deal product ${product.name}:`, validation.errors);
          //     return sanitizeDealProduct(dealProduct);
          //   }
          //   if (validation.warnings.length > 0) {
          //     console.warn(`[DEALS API] Warnings for ${product.name}:`, validation.warnings);
          //   }
          // } catch (validationError) {
          //   console.error(`[DEALS API] Validation error for ${product.name}:`, validationError);
          //   return sanitizeDealProduct(dealProduct);
          // }
          
          return dealProduct;
        });
        
        // Create deal object
        // Generate description based on deal type
        let description = `Special prices on ${enrichedProducts.length} item${enrichedProducts.length !== 1 ? "s" : ""}`;
        if (globalPercentage !== null) {
          description = `${globalPercentage}% discount on all ${enrichedProducts.length} item${enrichedProducts.length !== 1 ? "s" : ""}`;
        } else if (categoryDealPercentages.size > 0 || productDealPercentages.size > 0) {
          description = `Percentage discounts on ${enrichedProducts.length} item${enrichedProducts.length !== 1 ? "s" : ""}`;
        }
        
        // Get time window description
        const timeWindowDescription = getDealTimeWindowDescription(pricelist.name);
        if (timeWindowDescription !== 'Always available') {
          description += ` (${timeWindowDescription})`;
        }
        
        // Detect and create combo deals for Weekend Specials
        let combos: ComboDeal[] | undefined;
        if (pricelist.name === "Weekend Specials" || pricelist.name.toLowerCase().includes("weekend")) {
          console.log(`[DEALS API ${requestId}] Detecting combo deals for "${pricelist.name}"...`);
          combos = await detectComboDeals(client, pricelist.id, allProducts, dealIsActive);
          if (combos && combos.length > 0) {
            console.log(`[DEALS API ${requestId}] ✅ Found ${combos.length} combo deal(s)`);
          }
        }
        
        deals.push({
          id: `deal-${pricelist.id}`,
          name: pricelist.name,
          description,
          pricelistId: pricelist.id,
          products: enrichedProducts,
          active: dealIsActive, // Server-side time validation
          combos, // Combo deals if detected
        });
      } catch (err) {
        console.error(`[DEALS API] Error processing pricelist ${pricelist.id}:`, err);
        // Continue with other pricelists
      }
    }
    
    // If no deals found, return helpful message
    if (deals.length === 0) {
      console.log(`[DEALS API ${requestId}] ⚠️  No deals found after processing all pricelists`);
      return jsonResponse(
        successResponse({
          deals: [],
          message: "No deals found. Ensure pricelists have items with fixed prices and matching products exist.",
        }),
      );
    }
    
    const totalProducts = deals.reduce((sum, deal) => sum + deal.products.length, 0);
    const duration = Date.now() - startTime;
    console.log(`[DEALS API ${requestId}] ✅ Success: Returning ${deals.length} deal(s) with ${totalProducts} product(s) (${duration}ms total)`);
    
    return jsonResponse(
      successResponse({
        deals,
        count: deals.length,
        totalProducts,
      }),
    );
  } catch (err: any) {
    const duration = Date.now() - startTime;
    const msg = err?.message || "Failed to fetch deals";
    console.error(`[DEALS API ${requestId}] ❌ FATAL ERROR after ${duration}ms:`, err);
    if (err instanceof Error) {
      console.error(`[DEALS API ${requestId}] Error stack:`, err.stack);
    }
    console.error(`[DEALS API ${requestId}] Error details:`, {
      message: msg,
      name: err?.name,
      code: err?.code,
    });
    return jsonResponse(errorResponse(msg), 500);
  }
}

/**
 * Detect combo deals from Weekend Specials pricelist
 * Combo deals are identified by multiple products with the same fixed price
 * (indicating they're part of a bundle)
 */
async function detectComboDeals(
  client: ReturnType<typeof createOdooClient> | null,
  pricelistId: number,
  allProducts: Awaited<ReturnType<typeof getProductsSafe>>["products"],
  dealActive: boolean
): Promise<ComboDeal[]> {
  if (!client) {
    return [];
  }
  
  try {
    // Get all pricelist items for this pricelist
    const pricelistItems = await client.searchRead<any>(
      "product.pricelist.item",
      [["pricelist_id", "=", pricelistId], ["compute_price", "=", "fixed"]],
      ["product_id", "fixed_price"]
    );
    
    if (!pricelistItems || pricelistItems.length < 2) {
      return []; // Need at least 2 items for a combo
    }
    
    // Group items by fixed price (same price = same combo)
    // For Weekend Specials, products with same fixed price per item are part of a combo
    const priceGroups = new Map<number, Array<{ productId: number; price: number }>>();
    
    for (const item of pricelistItems) {
      if (!item.product_id || item.product_id === false || !item.fixed_price) {
        continue;
      }
      
      const productId = Array.isArray(item.product_id) ? item.product_id[0] : item.product_id;
      const fixedPrice = item.fixed_price;
      
      // Round to avoid floating point issues
      const roundedPrice = Math.round(fixedPrice * 100) / 100;
      
      if (!priceGroups.has(roundedPrice)) {
        priceGroups.set(roundedPrice, []);
      }
      priceGroups.get(roundedPrice)!.push({ productId, price: roundedPrice });
    }
    
    console.log(`[DEALS API] Price groups found: ${priceGroups.size} (for combo detection)`);
    
    const combos: ComboDeal[] = [];
    
    // Create combo deals from price groups with 2+ items
    for (const [comboPriceBase, items] of priceGroups.entries()) {
      if (items.length < 2) continue; // Skip single items
      
      const comboItems: ComboDeal["items"] = [];
      let originalTotal = 0;
      
      for (const { productId, price } of items) {
        const product = allProducts.find(p => parseInt(p.id, 10) === productId);
        if (!product) continue;
        
        comboItems.push({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.images?.[0],
          categoryId: product.categoryId,
        });
        
        originalTotal += product.price;
      }
      
      if (comboItems.length < 2) continue; // Need at least 2 valid products
      
      // Validate discount (max 30% for combos)
      let comboPrice = comboPriceBase;
      const discountPercent = originalTotal > 0
        ? ((originalTotal - comboPrice) / originalTotal) * 100
        : 0;
      
      const MAX_COMBO_DISCOUNT = 30; // Max 30% for combos
      if (discountPercent > MAX_COMBO_DISCOUNT) {
        console.warn(`[DEALS API] Combo discount ${discountPercent.toFixed(1)}% exceeds max ${MAX_COMBO_DISCOUNT}%, clamping...`);
        comboPrice = Math.round(originalTotal * (1 - MAX_COMBO_DISCOUNT / 100) * 100) / 100;
      }
      
      const savings = originalTotal - comboPrice;
      const savingsPercent = originalTotal > 0
        ? Math.round((savings / originalTotal) * 100)
        : 0;
      
      combos.push({
        id: `combo-${pricelistId}-${comboPrice}`,
        name: `${comboItems.map(i => i.name).join(" + ")} Combo`,
        description: `Bundle deal: ${comboItems.map(i => i.name).join(" + ")}`,
        items: comboItems,
        originalTotal,
        dealPrice: comboPrice,
        dealActive,
        savings,
        savingsPercent,
      });
    }
    
    return combos;
  } catch (error) {
    console.error("[DEALS API] Error detecting combo deals:", error);
    return [];
  }
}

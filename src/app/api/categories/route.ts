/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import {
  jsonResponse,
  successResponse,
  errorResponse,
} from "@/server/utils/apiHelpers";
import { redisGet } from "@/server/cache/redis";
import { syncProductsFromOdoo } from "@/server/utils/syncProducts";

type Category = { id: string; name: string; parentId?: string };

// Categories that should not be displayed on the website menu
// These are either:
// - POS-only categories (Services, administrative items)
// - Add-ons/extras (handled via product attributes, not standalone)
// - Promotional/discount categories (not browsable menu items)
// - Internal/expense categories
const EXCLUDED_CATEGORIES = [
  'Extras',         // Add-ons and extras (these are attributes)
  'EXTRA',          // Case variation
  'Services',       // Administrative items like "OPEN REGISTER"
  'Offers',         // Discounts and promotions (not browsable menu items)
  'Expenses',       // Internal expense tracking
  'Toppings',       // Add-ons (handled as product attributes)
  'Sauces',         // Add-ons (handled as product attributes)
  'Elite Essentials', // Internal supplies
];

export async function GET(_request: NextRequest) {
  try {
    let [allCategories, lastUpdate] = await Promise.all([
      redisGet<Category[]>("categories:list"),
      redisGet<string>("sync:last_update"),
    ]);
    
    // Check if cache is empty - auto-sync if needed
    if (!allCategories) {
      console.log('[CATEGORIES] Cache empty, triggering auto-sync...');
      const syncResult = await syncProductsFromOdoo();
      
      if (!syncResult.success) {
        return jsonResponse(
          errorResponse(
            "Category list is being synchronized. Please refresh the page in a moment.",
          ),
          503,
        );
      }
      
      // Fetch again after sync
      const freshCategories = await redisGet<Category[]>("categories:list");
      const freshLastUpdate = await redisGet<string>("sync:last_update");
      
      if (!freshCategories) {
        return jsonResponse(
          errorResponse("Failed to load categories after sync. Please try again."),
          503,
        );
      }
      
      // Update variables
      allCategories = freshCategories;
      lastUpdate = freshLastUpdate;
    }
    
    // Filter out excluded categories
    const categories = allCategories.filter(cat => 
      !EXCLUDED_CATEGORIES.includes(cat.name)
    );
    
    const response = jsonResponse(successResponse({ categories, lastUpdate: lastUpdate || null }));
    
    // Cache for 5 minutes, stale-while-revalidate for 1 hour
    response.headers.set("Cache-Control", "public, max-age=300, stale-while-revalidate=3600");
    
    return response;
  } catch (err: any) {
    const msg = err?.message || "Failed to fetch categories";
    return jsonResponse(errorResponse(msg), 500);
  }
}


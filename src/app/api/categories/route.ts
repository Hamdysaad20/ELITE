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
        // Check if sync is in progress - wait briefly for it
        const isLocked = await redisGet("sync:in_progress");
        if (isLocked) {
          console.log('[CATEGORIES] Sync in progress, waiting briefly...');
          // Wait up to 3 seconds for sync to complete
          for (let i = 0; i < 6; i++) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const waitCategories = await redisGet<Category[]>("categories:list");
            const waitLastUpdate = await redisGet<string>("sync:last_update");
            if (waitCategories) {
              allCategories = waitCategories;
              lastUpdate = waitLastUpdate;
              break;
            }
          }
        }
        
        // If still no data after waiting, return 503
        if (!allCategories) {
          return jsonResponse(
            errorResponse(
              "Category list is being synchronized. Please refresh the page in a moment.",
            ),
            503,
          );
        }
      } else {
        // Sync succeeded, fetch fresh data
        const freshCategories = await redisGet<Category[]>("categories:list");
        const freshLastUpdate = await redisGet<string>("sync:last_update");
        
        if (freshCategories) {
          allCategories = freshCategories;
          lastUpdate = freshLastUpdate;
        } else {
          // Sync said it succeeded but no data - this shouldn't happen, but handle gracefully
          console.error('[CATEGORIES] Sync succeeded but no categories found');
          return jsonResponse(
            errorResponse("Failed to load categories after sync. Please try again."),
            503,
          );
        }
      }
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
    // Log full error for debugging but return user-friendly message
    console.error('[API] /api/categories error:', err);
    return jsonResponse(errorResponse(msg), 500);
  }
}


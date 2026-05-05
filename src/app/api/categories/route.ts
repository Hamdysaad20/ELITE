/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import {
  jsonResponse,
  successResponse,
  errorResponse,
} from "@/server/utils/apiHelpers";
import { getCatalogSafe } from "@/server/services/product.service";
import { apiCache, CacheKeys } from "@/lib/apiCache";

type Category = { id: string; name: string; parentId?: string };

// Categories that should not be displayed on the website menu
// These are either:
// - POS-only categories (Services, administrative items)
// - Add-ons/extras (handled via product attributes, not standalone)
// - Promotional/discount categories (not browsable menu items)
// - Internal/expense categories
const EXCLUDED_CATEGORIES = [
  "Extras", // Add-ons and extras (these are attributes)
  "EXTRA", // Case variation
  "Services", // Administrative items like "OPEN REGISTER"
  "Offers", // Discounts and promotions (not browsable menu items)
  "Expenses", // Internal expense tracking
  "Toppings", // Add-ons (handled as product attributes)
  "Sauces", // Add-ons (handled as product attributes)
  "Elite Essentials", // Internal supplies
  "other", // Catch-all for uncategorized items that shouldn't be shown
  "Uncategorized", // Odoo default category for uncategorized products
  "Miscellaneous", // Common catch-all category that may contain non-menu items
  "Internal", // Internal use only items
  "Supplies", // Non-menu items used for operations
  "POS Only", // Items meant exclusively for point-of-sale, not online
];

export async function GET(_request: NextRequest) {
  try {
    // Add in-memory cache layer on top of Redis (15 minutes TTL)
    // Categories change infrequently, so longer cache is appropriate
    let cachedResult: {
      allCategories: Category[];
      lastUpdate: string | null;
    };

    try {
      cachedResult = await apiCache.get(
        CacheKeys.categories.all(),
        async () => {
          const { categories: allCategories, lastUpdate } =
            await getCatalogSafe();
          return { allCategories, lastUpdate };
        },
        900, // 15 minutes cache
      );
    } catch (err) {
      // True cold start / upstream outage: keep the category endpoint available
      // instead of showing a customer-facing sync/maintenance error.
      console.error("[CATEGORIES] Falling back to empty category list:", err);
      cachedResult = { allCategories: [], lastUpdate: null };
    }

    const { allCategories, lastUpdate } = cachedResult;

    // Filter out excluded categories (case-insensitive)
    const categories = allCategories.filter(
      (cat) =>
        !EXCLUDED_CATEGORIES.some(
          (ex) => ex.toLowerCase() === cat.name?.toLowerCase(),
        ),
    );

    const response = jsonResponse(
      successResponse({ categories, lastUpdate: lastUpdate || null }),
    );

    // Cache for 5 minutes, stale-while-revalidate for 1 hour
    response.headers.set(
      "Cache-Control",
      "public, max-age=300, stale-while-revalidate=3600",
    );

    return response;
  } catch (err: any) {
    const msg = err?.message || "Failed to fetch categories";
    // Log full error for debugging but return user-friendly message
    console.error("[API] /api/categories error:", err);
    return jsonResponse(errorResponse(msg), 500);
  }
}

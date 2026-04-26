/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import {
  jsonResponse,
  successResponse,
  errorResponse,
} from "@/server/utils/apiHelpers";
import { getProductsSafe } from "@/server/services/product.service";
import { apiCache, CacheKeys } from "@/lib/apiCache";
import { checkGenericRateLimit } from "@/server/utils/rateLimit";

type Product = {
  id: string;
  name: string; // Standardized naming
  description?: string | null;
  price: number;
  categoryId?: string;
  category?: {
    // Category object
    id: string;
    name: string;
  };
  available?: boolean;
  images?: string[];
  sku?: string;
  stock?: number | null; // Stock level
  sequence?: number; // Sort order
};

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

function applyFilters(
  items: Product[],
  opts: {
    category?: string | null;
    search?: string | null;
    availability?: string | null;
  },
): Product[] {
  let result = items;
  if (opts.category) {
    result = result.filter((p) => p.categoryId === opts.category);
  }
  if (opts.search) {
    const q = opts.search.toLowerCase();
    result = result.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.id?.toLowerCase().includes(q) ||
        p.categoryId?.toLowerCase().includes(q),
    );
  }
  if (opts.availability) {
    if (opts.availability === "available") {
      result = result.filter((p) => p.available !== false);
    }
    if (opts.availability === "unavailable") {
      result = result.filter((p) => p.available === false);
    }
  }
  return result;
}

function isStale(lastUpdate: string): boolean {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  return new Date(lastUpdate).getTime() < fiveMinutesAgo;
}

/**
 * Strip base64 images from product for list view (massive payload reduction)
 * Full images are only needed for individual product pages
 */
function stripImagesForListView(product: any): Product {
  return {
    ...product,
    // Remove base64 images from list view - they're ~30KB each
    // Images will be fetched on-demand when viewing product details
    images: product.images?.length > 0 ? ["has-image"] : [],
  };
}

export async function GET(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown_ip";
    const limitCheck = await checkGenericRateLimit(ip, "PRODUCTS");
    if (!limitCheck.allowed) {
      return jsonResponse(errorResponse("Too many requests"), 429);
    }

    const url = new URL(request.url);

    // Support fetching single product by ID
    const productId = url.searchParams.get("id");
    const categoryId = url.searchParams.get("categoryId");
    const limit = url.searchParams.get("limit");
    const includeImages = url.searchParams.get("includeImages") === "true";

    const page = Number(url.searchParams.get("page") || "1");
    const pageSize = Number(url.searchParams.get("pageSize") || "50");
    const category = url.searchParams.get("category");
    const search = url.searchParams.get("search");
    const availability = url.searchParams.get("availability");

    // Use in-memory cache for products list (5 minutes TTL)
    // This adds an additional layer on top of the existing SWR strategy
    const cacheKey = CacheKeys.products.all();
    const { products: allProducts, lastUpdate } = await apiCache.get(
      cacheKey,
      () => getProductsSafe(),
      300, // 5 minutes cache
    );

    // Filter out excluded categories (Extras, Services, etc.)
    const websiteProducts = allProducts.filter((product) => {
      if (!product.category) return false; // Exclude uncategorized products (POS-only admin items)
      return !EXCLUDED_CATEGORIES.includes(product.category.name);
    });

    // Handle single product fetch - ALWAYS include full images
    if (productId) {
      // Cache individual product lookups (10 minutes TTL)
      const product = await apiCache.get(
        CacheKeys.products.byId(productId),
        async () => {
          const found = websiteProducts.find((p) => p.id === productId);
          if (!found) throw new Error("Product not found");
          return found;
        },
        600, // 10 minutes cache
      );

      if (!product) {
        return jsonResponse(errorResponse("Product not found"), 404);
      }

      // Single product view: include full images
      return jsonResponse(
        successResponse(
          [product],
          lastUpdate ? `Last updated: ${lastUpdate}` : undefined,
        ),
      );
    }

    // Apply filters
    let filtered = applyFilters(websiteProducts, {
      category,
      search,
      availability,
    });

    // Filter by categoryId if provided (for related products)
    if (categoryId) {
      filtered = filtered.filter((p) => p.categoryId === categoryId);
    }

    // Apply limit if provided (for related products)
    if (limit) {
      const limitNum = Number(limit);
      if (Number.isFinite(limitNum) && limitNum > 0) {
        filtered = filtered.slice(0, limitNum);
        // Strip images for list view unless explicitly requested
        const items = includeImages
          ? filtered
          : filtered.map(stripImagesForListView);
        return jsonResponse(
          successResponse(
            items,
            lastUpdate ? `Last updated: ${lastUpdate}` : undefined,
          ),
        );
      }
    }

    const p = Number.isFinite(page) && page > 0 ? page : 1;
    const ps = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 50;
    const start = (p - 1) * ps;
    const end = start + ps;
    const slice = filtered.slice(start, end);

    // Strip base64 images for list view (massive payload reduction: 1MB -> ~50KB)
    // Images are fetched on-demand for individual product pages
    const items = includeImages ? slice : slice.map(stripImagesForListView);

    // Add cache headers for better performance
    const response = jsonResponse(
      successResponse({
        items,
        page: p,
        pageSize: ps,
        total: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / ps)),
        lastUpdate: lastUpdate || null,
      }),
    );

    // Cache for 5 minutes, stale-while-revalidate for 1 hour
    response.headers.set(
      "Cache-Control",
      "public, max-age=300, stale-while-revalidate=3600",
    );

    return response;
  } catch (err: any) {
    const msg = err?.message || "Failed to fetch products";
    // Log full error for debugging but return user-friendly message
    console.error("[API] /api/products error:", err);
    return jsonResponse(errorResponse(msg), 500);
  }
}

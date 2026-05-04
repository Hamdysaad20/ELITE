import { after } from "next/server";
import { redisGet, redisSet, redisSetNx, redisDel } from "../cache/redis";
import { syncProductsFromOdoo } from "../utils/syncProducts";

// Define types locally to match usage
export type Product = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  categoryId?: string;
  category?: {
    id: string;
    name: string;
  };
  available?: boolean;
  images?: string[];
  sku?: string;
  stock?: number | null;
  sequence?: number;
};

const CACHE_KEYS = {
  CATALOG: "catalog:current",
  DATA: "products:all",
  TIMESTAMP: "sync:last_update",
  LOCK: "sync:in_progress", // Must match SYNC_LOCK_KEY in syncProducts.ts
  LAST_BYPASS_ATTEMPT: "sync:last_bypass_attempt",
  CATEGORIES: "categories:list",
  VERSION: "cache:version",
};

export type Category = {
  id: string;
  name: string;
  description?: string;
};

// Soft TTL: 30 minutes (reduced for fresher data)
// Hard TTL: 2 hours (Redis expiry)
const SOFT_TTL = 30 * 60 * 1000;
const HARD_TTL = 2 * 60 * 60; // seconds for Redis
const VERY_STALE_TTL = 12 * 60 * 60 * 1000;
const BYPASS_ATTEMPT_COOLDOWN_SECONDS = 60 * 60;

// Categories that must never appear in any website-facing endpoint.
// Keep in sync with the same list in api/categories/route.ts and api/products/route.ts.
// Stored lowercase for case-insensitive matching
const EXCLUDED_CATEGORY_NAMES = new Set([
  "extras",
  "extra",
  "services",
  "offers",
  "expenses",
  "toppings",
  "sauces",
  "elite essentials",
  "other",
  "uncategorized",
  "miscellaneous",
  "internal",
  "supplies",
  "pos only",
]);

// Product names that should never be exposed in website catalog endpoints.
const EXCLUDED_PRODUCT_NAME_PATTERNS = [
  /^open\s*register$/i,
  /^open\s*cashier$/i,
  /^deposit$/i,
  /^extra\s+\w+$/i, // POS add-on entries like "EXTRA BOBA", "EXTRA SHOT"
  /\s+-\s+(?:xs|s|m|l|xl|xxl)$/i, // manual size variants like "AMERICANO - M"
];

function isExcludedWebsiteProduct(product: Product): boolean {
  // Exclude by category
  if (!product.category) return true; // no category = not a menu item
  if (EXCLUDED_CATEGORY_NAMES.has(product.category.name?.toLowerCase()))
    return true;
  // Exclude known POS-admin product names regardless of category
  const name = product.name?.trim();
  if (!name) return false;
  return EXCLUDED_PRODUCT_NAME_PATTERNS.some((pattern) => pattern.test(name));
}

function filterWebsiteProducts(products: Product[]): Product[] {
  return products.filter((product) => !isExcludedWebsiteProduct(product));
}

async function ensureFreshness(lastUpdate: string | null) {
  const now = Date.now();
  const lastSyncTime = lastUpdate ? new Date(lastUpdate).getTime() : 0;
  const isStale = !lastUpdate || now - lastSyncTime > SOFT_TTL;
  const veryStale = !lastUpdate || now - lastSyncTime > VERY_STALE_TTL;

  let bypassCircuitBreaker = false;
  if (veryStale) {
    // Self-healing path: when data is very stale, occasionally bypass circuit breaker
    // so the system can recover without manual intervention.
    bypassCircuitBreaker = await redisSetNx(
      CACHE_KEYS.LAST_BYPASS_ATTEMPT,
      String(now),
      BYPASS_ATTEMPT_COOLDOWN_SECONDS,
    ).catch(() => false);
  }

  if (isStale) {
    console.log("[CACHE] Data is stale, scheduling background sync...");
    // Use after() so Vercel keeps the function alive until the sync completes.
    // Falls back to fire-and-forget if called outside a request context (e.g. tests).
    const runSync = async () => {
      try {
        const result = await syncProductsFromOdoo({ bypassCircuitBreaker });
        if (result.success) {
          console.log("[CACHE] Background sync completed");
        } else {
          console.error("[CACHE] Background sync failed:", result.error);
        }
      } catch (err) {
        console.error("[CACHE] Background sync error:", err);
      }
    };
    try {
      after(runSync);
    } catch {
      runSync();
    }
  }
}

export async function getCatalogSafe(): Promise<{
  products: Product[];
  categories: Category[];
  lastUpdate: string | null;
}> {
  // Handle Redis failures gracefully
  let products: Product[] | null = null;
  let categories: Category[] | null = null;
  let lastUpdate: string | null = null;

  try {
    const [catalog, currentTimestamp] = await Promise.all([
      redisGet<{
        products?: Product[];
        categories?: Category[];
        lastUpdate?: string | null;
      }>(CACHE_KEYS.CATALOG),
      redisGet<string>(CACHE_KEYS.TIMESTAMP),
    ]);

    if (catalog?.products && catalog?.categories) {
      products = catalog.products;
      categories = catalog.categories;
      lastUpdate = currentTimestamp || null;
    } else {
      [products, categories] = await Promise.all([
        redisGet<Product[]>(CACHE_KEYS.DATA),
        redisGet<Category[]>(CACHE_KEYS.CATEGORIES),
      ]);
      lastUpdate = currentTimestamp || null;
    }
  } catch (err) {
    // Redis might be down - log but continue
    console.error(
      "[CACHE] Redis read failed, treating as cache miss:",
      err instanceof Error ? err.message : String(err),
    );
    products = null;
    categories = null;
    lastUpdate = null;
  }

  // Trigger freshness check whenever we have catalog data.
  // This also recovers from the webhook path where timestamp is intentionally deleted.
  if (products && categories) {
    try {
      await ensureFreshness(lastUpdate);
    } catch (err) {
      // Background sync failure is non-critical - log and continue
      console.warn(
        "[CACHE] Failed to ensure freshness:",
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  // If we have cached data, return it (even if stale - better than error)
  if (products && categories) {
    return {
      products: filterWebsiteProducts(products),
      categories,
      lastUpdate,
    };
  }

  // Cache miss - try to sync, but handle failures gracefully
  console.log("[CACHE] Cache miss (cold start), attempting sync...");
  let result = await syncProductsFromOdoo();

  // If sync failed due to circuit breaker and we have NO data at all,
  // try bypassing circuit breaker as last resort (root cause may be fixed)
  if (!result.success && !products && !categories) {
    const isCircuitBreakerError =
      result.error?.includes("Circuit breaker") ||
      result.error?.includes("OPEN");
    if (isCircuitBreakerError) {
      console.log(
        "[CACHE] Sync blocked by circuit breaker, attempting bypass as last resort...",
      );
      result = await syncProductsFromOdoo({ bypassCircuitBreaker: true });
    }
  }

  if (!result.success) {
    // If sync failed but we have stale data, return it
    if (products || categories) {
      console.log(
        "[CACHE] Sync failed but returning stale data:",
        result.error,
      );
      return {
        products: products || [],
        categories: categories || [],
        lastUpdate,
      };
    }

    const fallbackCatalog = result.data?.fallbackCatalog as
      | {
          products?: Product[];
          categories?: Category[];
          lastUpdate?: string | null;
        }
      | undefined;

    // If Redis is down but Odoo returned data directly, use it immediately.
    if (fallbackCatalog?.products && fallbackCatalog?.categories) {
      return {
        products: filterWebsiteProducts(fallbackCatalog.products),
        categories: fallbackCatalog.categories,
        lastUpdate: fallbackCatalog.lastUpdate || null,
      };
    }

    // No data at all - check if sync is in progress and wait a bit
    const isLocked = await redisGet(CACHE_KEYS.LOCK).catch(() => null);
    if (isLocked) {
      console.log("[CACHE] Sync in progress, waiting briefly...");
      // Wait up to 3 seconds for sync to complete
      for (let i = 0; i < 6; i++) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const [waitProducts, waitCategories, waitUpdate] = await Promise.all([
          redisGet<Product[]>(CACHE_KEYS.DATA),
          redisGet<Category[]>(CACHE_KEYS.CATEGORIES),
          redisGet<string>(CACHE_KEYS.TIMESTAMP),
        ]);
        if (waitProducts && waitCategories) {
          return {
            products: filterWebsiteProducts(waitProducts),
            categories: waitCategories,
            lastUpdate: waitUpdate,
          };
        }
      }
    }

    // Still no data - throw error (this is a real problem)
    throw new Error(
      result.error || "Failed to sync catalog and no cached data available",
    );
  }

  const fallbackCatalog = result.data?.fallbackCatalog as
    | {
        products?: Product[];
        categories?: Category[];
        lastUpdate?: string | null;
      }
    | undefined;

  if (fallbackCatalog?.products && fallbackCatalog?.categories) {
    return {
      products: filterWebsiteProducts(fallbackCatalog.products),
      categories: fallbackCatalog.categories,
      lastUpdate: fallbackCatalog.lastUpdate || null,
    };
  }

  // Sync succeeded, fetch fresh data
  const [freshProducts, freshCategories, freshUpdate] = await Promise.all([
    redisGet<Product[]>(CACHE_KEYS.DATA).catch(() => null),
    redisGet<Category[]>(CACHE_KEYS.CATEGORIES).catch(() => null),
    redisGet<string>(CACHE_KEYS.TIMESTAMP).catch(() => null),
  ]);

  return {
    products: filterWebsiteProducts(freshProducts || []),
    categories: freshCategories || [],
    lastUpdate: freshUpdate,
  };
}

export async function getProductsSafe(): Promise<{
  products: Product[];
  lastUpdate: string | null;
}> {
  const { products, lastUpdate } = await getCatalogSafe();
  return { products, lastUpdate };
}

/**
 * Force invalidate the cache - useful when Odoo data changes
 * This will trigger a fresh sync on the next request
 */
export async function invalidateCatalogCache(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // Keep the active catalog payload serving while the next sync builds a fresh snapshot.
    // Deleting products/categories here caused customer-facing 503 responses while sync was running.
    await redisDel(CACHE_KEYS.TIMESTAMP);
    // Increment version to bust client-side caches
    const version = Date.now().toString();
    await redisSet(CACHE_KEYS.VERSION, version, HARD_TTL);

    console.log("[CACHE] Catalog cache invalidated, version:", version);

    return {
      success: true,
      message: `Cache invalidated at ${new Date().toISOString()}`,
    };
  } catch (err) {
    console.error("[CACHE] Failed to invalidate cache:", err);
    return {
      success: false,
      message:
        err instanceof Error ? err.message : "Failed to invalidate cache",
    };
  }
}

/**
 * Get the current cache version for cache-busting
 */
export async function getCacheVersion(): Promise<string | null> {
  return redisGet<string>(CACHE_KEYS.VERSION);
}

import { redisGet, redisSet, redisDel } from "../cache/redis";
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
  DATA: "products:all",
  TIMESTAMP: "sync:last_update",
  LOCK: "sync:lock",
  CATEGORIES: "categories:list",
  VERSION: "cache:version"
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

async function ensureFreshness(lastUpdate: string | null) {
  const now = Date.now();
  const lastSyncTime = lastUpdate ? new Date(lastUpdate).getTime() : 0;
  const isStale = !lastUpdate || (now - lastSyncTime > SOFT_TTL);

  if (isStale) {
    const isLocked = await redisGet(CACHE_KEYS.LOCK);
    if (!isLocked) {
      console.log('[CACHE] Data is stale, triggering background sync...');
      await redisSet(CACHE_KEYS.LOCK, "true", 60);
      syncProductsFromOdoo()
        .then((result) => {
          if (result.success) console.log('[CACHE] Background sync completed');
          else console.error('[CACHE] Background sync failed:', result.error);
          return redisSet(CACHE_KEYS.LOCK, "", 1);
        })
        .catch(err => {
          console.error("[CACHE] Background sync error:", err);
          redisSet(CACHE_KEYS.LOCK, "", 1).catch(console.error);
        });
    }
  }
}

export async function getCatalogSafe(): Promise<{ products: Product[], categories: Category[], lastUpdate: string | null }> {
  const [products, categories, lastUpdate] = await Promise.all([
    redisGet<Product[]>(CACHE_KEYS.DATA),
    redisGet<Category[]>(CACHE_KEYS.CATEGORIES),
    redisGet<string>(CACHE_KEYS.TIMESTAMP)
  ]);

  await ensureFreshness(lastUpdate);

  if (products && categories) {
    return { products, categories, lastUpdate };
  }

  console.log('[CACHE] Cache miss (cold start), waiting for sync...');
  const result = await syncProductsFromOdoo();
  
  if (!result.success) {
    throw new Error(result.error || "Failed to sync catalog");
  }

  const [freshProducts, freshCategories, freshUpdate] = await Promise.all([
    redisGet<Product[]>(CACHE_KEYS.DATA),
    redisGet<Category[]>(CACHE_KEYS.CATEGORIES),
    redisGet<string>(CACHE_KEYS.TIMESTAMP)
  ]);
  
  return { 
    products: freshProducts || [], 
    categories: freshCategories || [],
    lastUpdate: freshUpdate 
  };
}

export async function getProductsSafe(): Promise<{ products: Product[], lastUpdate: string | null }> {
  const { products, lastUpdate } = await getCatalogSafe();
  return { products, lastUpdate };
}

/**
 * Force invalidate the cache - useful when Odoo data changes
 * This will trigger a fresh sync on the next request
 */
export async function invalidateCatalogCache(): Promise<{ success: boolean; message: string }> {
  try {
    // Delete the timestamp to force a fresh sync
    await redisDel(CACHE_KEYS.TIMESTAMP);
    // Increment version to bust client-side caches
    const version = Date.now().toString();
    await redisSet(CACHE_KEYS.VERSION, version, HARD_TTL);
    
    console.log('[CACHE] Catalog cache invalidated, version:', version);
    
    return { 
      success: true, 
      message: `Cache invalidated at ${new Date().toISOString()}` 
    };
  } catch (err) {
    console.error('[CACHE] Failed to invalidate cache:', err);
    return { 
      success: false, 
      message: err instanceof Error ? err.message : 'Failed to invalidate cache' 
    };
  }
}

/**
 * Get the current cache version for cache-busting
 */
export async function getCacheVersion(): Promise<string | null> {
  return redisGet<string>(CACHE_KEYS.VERSION);
}

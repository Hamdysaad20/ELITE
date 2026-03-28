/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from "node:crypto";
import { isOdooConfigured, createOdooClient } from "./odooClient";
import { redisSet, redisGet, redisSetNx, redisDel } from "../cache/redis";
import {
  isRequestAllowed,
  recordSuccess,
  recordFailure,
} from "./circuitBreaker";

type ProductRecord = {
  id: number;
  name: string;
  default_code?: string;
  list_price?: number;
  categ_id?: any;
  active?: boolean;
  sale_ok?: boolean;
  available_in_pos?: boolean;
  // website_published is NOT available in Odoo v19 on product.product
  // Use product filtering via regex patterns instead (see filtering logic below)
  image_128?: string | boolean;
  image_1024?: string | boolean;
  image_1920?: string | boolean;
  uom_id?: any;
  taxes_id?: any;
  product_tmpl_id?: any;
};

type ProductTemplateRecord = {
  id: number;
  available_in_pos?: boolean;
  image_128?: string | boolean;
  image_1024?: string | boolean;
  image_1920?: string | boolean;
  attribute_line_ids?: number[];
};

type AttributeValueRecord = {
  id: number;
  name: string;
  attribute_id: any;
  price_extra: number;
  product_tmpl_id: any;
};

type CategoryRecord = {
  id: number;
  name: string;
  parent_id?: any;
  active?: boolean;
};

import { getOldItemImage } from "./oldItemsMapping";

function normalizeProduct(
  rec: ProductRecord,
  templateImages?: Map<number, ProductTemplateRecord>,
  categoriesRaw: CategoryRecord[] = [],
  attributesByTemplate?: Map<number, Record<string, any>>,
) {
  const categoryId = Array.isArray(rec.categ_id)
    ? rec.categ_id[0]
    : rec.categ_id;
  const categoryName = Array.isArray(rec.categ_id)
    ? rec.categ_id[1]
    : undefined;

  const categoryDetail = categoriesRaw.find((c) => c.id === categoryId);

  const templateId = Array.isArray(rec.product_tmpl_id)
    ? rec.product_tmpl_id[0]
    : rec.product_tmpl_id;
  const template =
    templateId && templateImages ? templateImages.get(templateId) : null;

  // Product availability: active and sale_ok
  // Note: available_in_pos is not used here because products can be available for both website and POS
  const available = rec.active !== false && rec.sale_ok !== false;

  const attributes =
    templateId && attributesByTemplate
      ? attributesByTemplate.get(templateId)
      : undefined;

  const image1024 =
    rec.image_1024 && typeof rec.image_1024 === "string"
      ? rec.image_1024
      : template?.image_1024 && typeof template.image_1024 === "string"
        ? template.image_1024
        : null;

  const image1920 =
    rec.image_1920 && typeof rec.image_1920 === "string"
      ? rec.image_1920
      : template?.image_1920 && typeof template.image_1920 === "string"
        ? template.image_1920
        : null;

  const image128 =
    rec.image_128 && typeof rec.image_128 === "string"
      ? rec.image_128
      : template?.image_128 && typeof template.image_128 === "string"
        ? template.image_128
        : null;

  // Resolve Odoo images (base64)
  const odooImages = image1024
    ? [`data:image/png;base64,${image1024}`]
    : image1920
      ? [`data:image/png;base64,${image1920}`]
      : image128
        ? [`data:image/png;base64,${image128}`]
        : [];

  // Check for local "Old Items" image
  const localImage = getOldItemImage(rec.name);

  // Combine images: Local image strictly replaces Odoo images if found
  const images = localImage ? [localImage] : odooImages;

  // Thumbnail logic: Use local image if available, otherwise base64 thumbnail
  const thumbnail = localImage
    ? localImage
    : image128
      ? `data:image/png;base64,${image128}`
      : null;

  return {
    id: String(rec.id),
    name: rec.name,
    description: (rec as any).description_sale || null,
    sku: rec.default_code || String(rec.id),
    price: rec.list_price ?? 0,
    categoryId: categoryId ? String(categoryId) : undefined,
    category: categoryDetail
      ? {
          id: String(categoryDetail.id),
          name: categoryDetail.name,
        }
      : categoryName
        ? {
            id: String(categoryId),
            name: categoryName,
          }
        : undefined,
    available,
    stock: (rec as any).qty_available ?? null,
    sequence: (rec as any).sequence ?? 0,
    images: images,
    thumbnail: thumbnail, // expose thumbnail for list view optimization
    uom: Array.isArray(rec.uom_id)
      ? { id: rec.uom_id[0], name: rec.uom_id[1] }
      : undefined,
    taxes: Array.isArray(rec.taxes_id) ? rec.taxes_id : [],
    attributes: attributes,
  };
}

function normalizeCategory(rec: CategoryRecord) {
  return {
    id: String(rec.id),
    name: rec.name,
    description: (rec as any).display_name || rec.name,
    parentId: Array.isArray(rec.parent_id)
      ? String(rec.parent_id[0])
      : undefined,
  };
}

// Redis keys for distributed locking (works across serverless instances)
const SYNC_LOCK_KEY = "sync:in_progress";
const SYNC_LAST_ATTEMPT_KEY = "sync:last_attempt";
const SYNC_LOCK_TTL = 300; // 5 minutes max lock duration (sync should complete faster)
const SYNC_RATE_LIMIT_SECONDS = 10; // Reduced from 30s to 10s for better responsiveness
const SYNC_TIMEOUT_MS = 120000; // 2 minutes max sync time (prevents hanging)

// Batch size limits for pagination
const DEFAULT_BATCH_SIZE = 1000; // Products per batch
const MAX_BATCH_SIZE = 5000; // Hard limit to prevent memory issues

/**
 * Wrapper to add timeout to sync operation
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string,
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });
  return Promise.race([promise, timeout]);
}

export async function syncProductsFromOdoo(options?: {
  bypassCircuitBreaker?: boolean;
}): Promise<{ success: boolean; error?: string; data?: any }> {
  // Wrap entire sync in timeout to prevent hanging
  return withTimeout(
    performSync(options?.bypassCircuitBreaker),
    SYNC_TIMEOUT_MS,
    `Sync operation timed out after ${SYNC_TIMEOUT_MS}ms`,
  ).catch((err) => {
    console.error("[AUTO-SYNC] Sync timeout or error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  });
}

async function performSync(
  bypassCircuitBreaker: boolean = false,
): Promise<{ success: boolean; error?: string; data?: any }> {
  // Check circuit breaker before attempting sync (unless bypassed)
  if (!bypassCircuitBreaker) {
    const allowed = await isRequestAllowed();
    if (!allowed) {
      const errorMsg =
        "Circuit breaker is OPEN - Odoo is consistently failing. Sync blocked to prevent cascading failures.";
      console.error(`[AUTO-SYNC] ${errorMsg}`);
      return { success: false, error: errorMsg };
    }
  } else {
    console.log(
      "[MANUAL-SYNC] Circuit breaker bypass enabled (admin-triggered sync)",
    );
  }

  // Try to acquire distributed lock (atomic operation).
  // If Redis is unavailable, continue without lock and serve direct Odoo data.
  let redisAvailable = true;
  let lockAcquired = false;
  try {
    lockAcquired = await redisSetNx(
      SYNC_LOCK_KEY,
      Date.now().toString(),
      SYNC_LOCK_TTL,
    );
  } catch (err) {
    redisAvailable = false;
    console.warn("[AUTO-SYNC] Failed to check lock (Redis may be down):", err);
  }

  if (redisAvailable && !lockAcquired) {
    console.log("[AUTO-SYNC] Sync already in progress, skipping...");
    return { success: false, error: "Sync already in progress" };
  }

  // Check rate limiting using Redis (works across instances)
  if (redisAvailable) {
    try {
      const lastAttemptStr = await redisGet<string>(SYNC_LAST_ATTEMPT_KEY);
      if (lastAttemptStr) {
        const lastAttempt = parseInt(lastAttemptStr, 10);
        const now = Date.now();
        const timeSinceLastAttempt = (now - lastAttempt) / 1000; // seconds

        if (timeSinceLastAttempt < SYNC_RATE_LIMIT_SECONDS) {
          console.log(
            `[AUTO-SYNC] Rate limited, last sync was ${Math.round(timeSinceLastAttempt)}s ago`,
          );
          // Release lock since we're not syncing
          await redisDel(SYNC_LOCK_KEY).catch(() => {});
          return { success: false, error: "Rate limited" };
        }
      }
    } catch (err) {
      // Redis error - continue without rate limiting
      redisAvailable = false;
      console.warn("[AUTO-SYNC] Failed to check rate limit:", err);
    }
  }

  try {
    // Update last attempt timestamp (best effort)
    if (redisAvailable) {
      try {
        await redisSet(SYNC_LAST_ATTEMPT_KEY, Date.now().toString(), 60); // Keep for 1 minute
      } catch (err) {
        redisAvailable = false;
        console.warn(
          "[AUTO-SYNC] Failed to update last attempt timestamp:",
          err,
        );
      }
    }

    console.log("[AUTO-SYNC] Starting product sync from Odoo...");

    if (!isOdooConfigured()) {
      throw new Error("Odoo not configured");
    }

    const client = createOdooClient();
    if (!client) {
      throw new Error("Failed to init Odoo client");
    }

    // Get batch size from env or use default
    const batchSizeEnv = Number(
      process.env.SYNC_PRODUCTS_BATCH_SIZE || String(DEFAULT_BATCH_SIZE),
    );
    const batchSize =
      Number.isFinite(batchSizeEnv) && batchSizeEnv > 0
        ? Math.min(batchSizeEnv, MAX_BATCH_SIZE)
        : DEFAULT_BATCH_SIZE;

    // Legacy limit support (for testing/development)
    const limitEnv = Number(process.env.SYNC_PRODUCTS_LIMIT || "0");
    const limit =
      Number.isFinite(limitEnv) && limitEnv > 0 ? limitEnv : undefined;

    const productFields = [
      "id",
      "name",
      "default_code",
      "list_price",
      "categ_id",
      "active",
      "sale_ok",
      "available_in_pos",
      // Note: website_published is NOT available in Odoo v19 on product.product
      // Product filtering uses regex patterns as fallback (see filtering logic below)
      "image_128",
      "image_1024",
      "image_1920",
      "uom_id",
      "taxes_id",
      "product_tmpl_id",
      "description_sale",
      "qty_available",
      "virtual_available",
      "sequence",
    ];

    console.log(
      `[AUTO-SYNC] Fetching products with batch size: ${batchSize}${limit ? ` (limited to ${limit})` : ""}`,
    );

    // 1. Fetch Products and Categories
    // Use pagination for products if no limit is set, otherwise use simple searchRead
    let productsRaw: ProductRecord[];
    let categoriesRaw: CategoryRecord[];

    try {
      if (limit) {
        // Legacy mode: use simple searchRead with limit
        [productsRaw, categoriesRaw] = await Promise.all([
          client.searchRead<ProductRecord>(
            "product.product",
            [["sale_ok", "=", true]],
            productFields,
            { limit },
          ),
          client.searchRead<CategoryRecord>(
            "product.category",
            [],
            ["id", "name", "parent_id", "display_name", "complete_name"],
          ),
        ]);
      } else {
        // Production mode: use pagination for large catalogs
        [productsRaw, categoriesRaw] = await Promise.all([
          client.searchReadPaginated<ProductRecord>(
            "product.product",
            [["sale_ok", "=", true]],
            productFields,
            batchSize,
          ),
          client.searchRead<CategoryRecord>(
            "product.category",
            [],
            ["id", "name", "parent_id", "display_name", "complete_name"],
          ),
        ]);
      }

      // Record success for circuit breaker
      await recordSuccess();
      console.log(
        `[AUTO-SYNC] Fetched ${productsRaw.length} products, ${categoriesRaw.length} categories`,
      );
    } catch (err) {
      // Record failure for circuit breaker
      await recordFailure();
      throw err;
    }

    const templateIds = Array.from(
      new Set(
        productsRaw
          .map((p) =>
            Array.isArray(p.product_tmpl_id)
              ? p.product_tmpl_id[0]
              : p.product_tmpl_id,
          )
          .filter(Boolean),
      ),
    );

    // 2. Fetch Templates and Attributes in parallel (Dependent on Products)
    let templatesRaw: ProductTemplateRecord[] = [];
    let ptavsRaw: AttributeValueRecord[] = [];

    if (templateIds.length > 0) {
      try {
        [templatesRaw, ptavsRaw] = await Promise.all([
          client.searchRead<ProductTemplateRecord>(
            "product.template",
            [["id", "in", templateIds]],
            [
              "id",
              "available_in_pos",
              "image_128",
              "image_1024",
              "image_1920",
              "attribute_line_ids",
            ],
          ),
          client.searchRead<AttributeValueRecord>(
            "product.template.attribute.value",
            [["product_tmpl_id", "in", templateIds]],
            ["id", "name", "attribute_id", "price_extra", "product_tmpl_id"],
          ),
        ]);
        await recordSuccess(); // Record success for additional Odoo calls
      } catch (err) {
        await recordFailure();
        throw err;
      }
    }

    const templateImages = new Map(templatesRaw.map((t) => [t.id, t]));

    const attributesByTemplate = new Map<number, Record<string, any>>();

    for (const ptav of ptavsRaw) {
      const tmplId = Array.isArray(ptav.product_tmpl_id)
        ? ptav.product_tmpl_id[0]
        : ptav.product_tmpl_id;
      const attrName = Array.isArray(ptav.attribute_id)
        ? ptav.attribute_id[1]
        : "Unknown";

      if (!attributesByTemplate.has(tmplId)) {
        attributesByTemplate.set(tmplId, {});
      }

      const tmplAttrs = attributesByTemplate.get(tmplId)!;

      if (!tmplAttrs[attrName]) {
        tmplAttrs[attrName] = [];
      }

      tmplAttrs[attrName].push({
        id: ptav.id,
        name: ptav.name,
        priceExtra: ptav.price_extra || 0,
      });
    }

    /**
     * Filter out POS-only products using regex patterns on product names.
     *
     * NOTE: In Odoo v19, the `website_published` field is NOT available on `product.product`.
     * It only exists on `product.template` (as `is_published`), but we query `product.product` variants.
     *
     * Current approach: Use regex patterns to identify POS-only products by name.
     * This works for known patterns but may need updates if naming conventions change.
     *
     * Future enhancement: Could query `product.template.is_published` separately and join,
     * but the current regex-based approach is simpler and sufficient for now.
     */
    const posOnlyVariantPatterns = [
      /turkish coffee single/i,
      /turkish coffee double/i,
      /spanish latte.*single/i,
      /spanish latte.*double/i,
    ];

    // Filter out POS-only variant products before normalization
    const websiteProductsRaw = productsRaw.filter((p) => {
      // Use regex patterns to exclude POS-only products
      const name = p.name?.toLowerCase() || "";
      const matchesPosOnlyPattern = posOnlyVariantPatterns.some((pattern) =>
        pattern.test(name),
      );

      if (matchesPosOnlyPattern) {
        console.log(
          `[SYNC] Product "${p.name}" (ID: ${p.id}) excluded by name pattern (POS-only variant)`,
        );
        return false;
      }

      return true;
    });

    const products = websiteProductsRaw
      .map((p) =>
        normalizeProduct(
          p,
          templateImages,
          categoriesRaw,
          attributesByTemplate,
        ),
      )
      .filter((p) => p.available !== false); // Final filter to exclude inactive/unavailable products

    const uniqueCategories = new Map<string, any>();
    categoriesRaw.forEach((cat) => {
      if (cat.name.toLowerCase() === "extras") return;
      const normalized = normalizeCategory(cat);
      if (!uniqueCategories.has(normalized.name)) {
        uniqueCategories.set(normalized.name, normalized);
      }
    });

    const categories = Array.from(uniqueCategories.values());

    const etag = crypto
      .createHash("sha1")
      .update(JSON.stringify(products))
      .digest("hex");
    const lastUpdate = new Date().toISOString();

    // Cache for 7 days (long TTL to avoid "first hit penalty")
    // We rely on background sync to keep data fresh (Soft TTL)
    const cacheTTL = 60 * 60 * 24 * 7;

    // Clear old product cache keys before writing new data (cleanup)
    // Note: We don't delete all keys to avoid race conditions, but we overwrite the main ones
    if (redisAvailable) {
      console.log(
        `[AUTO-SYNC] Caching ${products.length} products, ${categories.length} categories`,
      );
    } else {
      console.warn(
        "[AUTO-SYNC] Redis unavailable - returning direct Odoo data without cache writes",
      );
    }

    // Cache with partial failure handling - cache what we can even if some writes fail
    const cacheErrors: string[] = [];

    if (redisAvailable) {
      try {
        await redisSet("categories:list", categories, cacheTTL);
      } catch (err) {
        cacheErrors.push(
          `Failed to cache categories: ${err instanceof Error ? err.message : String(err)}`,
        );
        console.error("[AUTO-SYNC] Failed to cache categories:", err);
      }
    }

    // Cache products individually to allow partial success
    // Store FULL product details (high-res images) in individual keys
    // Parallelize caching in chunks to prevent connection timeouts
    const chunkSize = 50;
    let cachedCount = 0;

    if (redisAvailable) {
      for (let i = 0; i < products.length; i += chunkSize) {
        const chunk = products.slice(i, i + chunkSize);
        const chunkResults = await Promise.all(
          chunk.map(async (p) => {
            try {
              // Remove the temporary 'thumbnail' field before saving individual product
              const { thumbnail, ...productToSave } = p as any;
              await redisSet(`products:${p.id}`, productToSave, cacheTTL);
              return true;
            } catch (err) {
              cacheErrors.push(
                `Failed to cache product ${p.id}: ${err instanceof Error ? err.message : String(err)}`,
              );
              return false;
            }
          }),
        );
        cachedCount += chunkResults.filter(Boolean).length;
      }
    }

    if (redisAvailable) {
      try {
        // Create lightweight summaries for the list view
        // Use the thumbnail as the main image to reduce payload size (50MB -> <2MB)
        const productSummaries = products.map((p: any) => {
          const { thumbnail, images, ...rest } = p;
          return {
            ...rest,
            // Use thumbnail if available, otherwise fallback to existing images (or empty)
            images: thumbnail ? [thumbnail] : images || [],
          };
        });

        await redisSet("products:all", productSummaries, cacheTTL);
      } catch (err) {
        cacheErrors.push(
          `Failed to cache products:all: ${err instanceof Error ? err.message : String(err)}`,
        );
        console.error("[AUTO-SYNC] Failed to cache products:all:", err);
      }
    }

    if (cacheErrors.length > 0) {
      console.warn(
        `[AUTO-SYNC] Some cache writes failed (${cacheErrors.length} errors), but ${cachedCount}/${products.length} products cached`,
      );
    }

    const pageSize = 50;
    const summaries = products.slice(0, pageSize).map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      categoryId: p.categoryId,
      available: p.available,
      images: p.images?.slice(0, 1) || [],
    }));
    if (redisAvailable) {
      try {
        await redisSet(`products:list:1:${pageSize}:all`, summaries, cacheTTL);
      } catch (err) {
        cacheErrors.push(
          `Failed to cache products list summary: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    if (redisAvailable) {
      try {
        await redisSet("sync:last_update", lastUpdate, cacheTTL);
      } catch (err) {
        cacheErrors.push(
          `Failed to cache last_update: ${err instanceof Error ? err.message : String(err)}`,
        );
        console.error("[AUTO-SYNC] Failed to cache last_update:", err);
      }

      try {
        await redisSet("sync:etag", etag, cacheTTL);
      } catch (err) {
        cacheErrors.push(
          `Failed to cache etag: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    // Consider sync successful when either cache write succeeds or direct Odoo data exists.
    const directDataAvailable =
      products.length > 0 || (products.length === 0 && categories.length > 0);
    const isSuccess = redisAvailable
      ? cachedCount > 0 || (products.length === 0 && categories.length > 0)
      : directDataAvailable;

    if (isSuccess) {
      console.log(
        `[AUTO-SYNC] Completed: ${cachedCount}/${products.length} products, ${categories.length} categories cached`,
      );
      if (cacheErrors.length > 0) {
        console.warn(
          `[AUTO-SYNC] Some cache writes failed (${cacheErrors.length} errors)`,
        );
      }
    } else {
      throw new Error(`Failed to cache any data: ${cacheErrors.join("; ")}`);
    }

    return {
      success: true,
      data: {
        products: products.length,
        categories: categories.length,
        lastUpdate,
        etag,
        fallbackCatalog: {
          products,
          categories,
          lastUpdate,
        },
      },
    };
  } catch (err: any) {
    const msg = err?.message || "Failed to sync products";
    console.error("[AUTO-SYNC] Error:", msg, err);
    return { success: false, error: msg };
  } finally {
    // Release lock only when Redis is available.
    if (redisAvailable) {
      await redisDel(SYNC_LOCK_KEY).catch((err) => {
        console.error("[AUTO-SYNC] Failed to release lock:", err);
      });
    }
  }
}

// Helper to check if cache needs refresh
export async function shouldRefreshCache(): Promise<boolean> {
  try {
    const [products, lastUpdate] = await Promise.all([
      redisGet<any[]>("products:all"),
      redisGet<string>("sync:last_update"),
    ]);

    // If no products, definitely need refresh
    if (!products || products.length === 0) {
      return true;
    }

    // If no last update timestamp, need refresh
    if (!lastUpdate) {
      return true;
    }

    // If data is older than 8 minutes, trigger refresh
    const eightMinutesAgo = Date.now() - 8 * 60 * 1000;
    if (new Date(lastUpdate).getTime() < eightMinutesAgo) {
      return true;
    }

    return false;
  } catch (err) {
    console.error("[CACHE-CHECK] Error checking cache:", err);
    return true; // On error, trigger refresh
  }
}

// Non-blocking background sync
export function triggerBackgroundSync(): void {
  // Don't await - run in background
  syncProductsFromOdoo().catch((err) => {
    console.error("[BACKGROUND-SYNC] Failed:", err);
  });
}

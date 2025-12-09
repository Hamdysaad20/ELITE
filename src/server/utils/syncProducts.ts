/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from "node:crypto";
import { isOdooConfigured, createOdooClient } from "./odooClient";
import { redisSet, redisGet } from "../cache/redis";

type ProductRecord = {
  id: number;
  name: string;
  default_code?: string;
  list_price?: number;
  categ_id?: any;
  active?: boolean;
  sale_ok?: boolean;
  image_128?: string | boolean;
  image_1024?: string | boolean;
  image_1920?: string | boolean;
  uom_id?: any;
  taxes_id?: any;
  product_tmpl_id?: any;
};

type ProductTemplateRecord = {
  id: number;
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

function normalizeProduct(
  rec: ProductRecord,
  templateImages?: Map<number, ProductTemplateRecord>,
  categoriesRaw: CategoryRecord[] = [],
  attributesByTemplate?: Map<number, Record<string, any>>
) {
  const categoryId = Array.isArray(rec.categ_id)
    ? rec.categ_id[0]
    : rec.categ_id;
  const categoryName = Array.isArray(rec.categ_id) ? rec.categ_id[1] : undefined;
  
  const categoryDetail = categoriesRaw.find(c => c.id === categoryId);
  const available = rec.active !== false && rec.sale_ok !== false;
  
  const templateId = Array.isArray(rec.product_tmpl_id) ? rec.product_tmpl_id[0] : rec.product_tmpl_id;
  const template = templateId && templateImages ? templateImages.get(templateId) : null;
  const attributes = templateId && attributesByTemplate ? attributesByTemplate.get(templateId) : undefined;
  
  const image1024 = (rec.image_1024 && typeof rec.image_1024 === 'string') 
    ? rec.image_1024 
    : (template?.image_1024 && typeof template.image_1024 === 'string') 
      ? template.image_1024 
      : null;
      
  const image1920 = (rec.image_1920 && typeof rec.image_1920 === 'string')
    ? rec.image_1920
    : (template?.image_1920 && typeof template.image_1920 === 'string')
      ? template.image_1920
      : null;
      
  const image128 = (rec.image_128 && typeof rec.image_128 === 'string')
    ? rec.image_128
    : (template?.image_128 && typeof template.image_128 === 'string')
      ? template.image_128
      : null;
  
  return {
    id: String(rec.id),
    name: rec.name,
    description: (rec as any).description_sale || null,
    sku: rec.default_code || String(rec.id),
    price: rec.list_price ?? 0,
    categoryId: categoryId ? String(categoryId) : undefined,
    category: categoryDetail ? {
      id: String(categoryDetail.id),
      name: categoryDetail.name,
    } : (categoryName ? {
      id: String(categoryId),
      name: categoryName,
    } : undefined),
    available,
    stock: (rec as any).qty_available ?? null,
    sequence: (rec as any).sequence ?? 0,
    images: image1024
      ? [`data:image/png;base64,${image1024}`]
      : image1920
        ? [`data:image/png;base64,${image1920}`]
        : image128
          ? [`data:image/png;base64,${image128}`]
          : [],
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
    parentId: Array.isArray(rec.parent_id) ? String(rec.parent_id[0]) : undefined,
  };
}

// Track ongoing syncs to prevent duplicates
let syncInProgress = false;
let lastSyncAttempt = 0;

export async function syncProductsFromOdoo(): Promise<{ success: boolean; error?: string; data?: any }> {
  // Prevent concurrent syncs
  if (syncInProgress) {
    console.log('[AUTO-SYNC] Sync already in progress, skipping...');
    return { success: false, error: 'Sync already in progress' };
  }

  // Rate limit: don't sync more than once per 30 seconds
  const now = Date.now();
  if (now - lastSyncAttempt < 30000) {
    console.log('[AUTO-SYNC] Rate limited, last sync was too recent');
    return { success: false, error: 'Rate limited' };
  }

  try {
    syncInProgress = true;
    lastSyncAttempt = now;
    
    console.log('[AUTO-SYNC] Starting product sync from Odoo...');

    if (!process.env.REDIS_URL) {
      throw new Error("REDIS_URL is not configured for sync");
    }

    if (!isOdooConfigured()) {
      throw new Error("Odoo not configured");
    }

    const client = createOdooClient();
    if (!client) throw new Error("Failed to init Odoo client");

    const limitEnv = Number(process.env.SYNC_PRODUCTS_LIMIT || "0");
    const limit = Number.isFinite(limitEnv) && limitEnv > 0 ? limitEnv : undefined;

    const productFields = [
      "id", "name", "default_code", "list_price", "categ_id", "active", "sale_ok",
      "image_128", "image_1024", "image_1920", "uom_id", "taxes_id", "product_tmpl_id",
      "description_sale", "qty_available", "virtual_available", "sequence",
    ];

    // 1. Fetch Products and Categories in parallel (Independent)
    const [productsRaw, categoriesRaw] = await Promise.all([
      client.searchRead<ProductRecord>(
        "product.product",
        [["sale_ok", "=", true]],
        productFields,
        limit ? { limit } : {},
      ),
      client.searchRead<CategoryRecord>(
        "product.category",
        [],
        ["id", "name", "parent_id", "display_name", "complete_name"],
      )
    ]);

    const templateIds = Array.from(
      new Set(
        productsRaw
          .map(p => Array.isArray(p.product_tmpl_id) ? p.product_tmpl_id[0] : p.product_tmpl_id)
          .filter(Boolean)
      )
    );
    
    // 2. Fetch Templates and Attributes in parallel (Dependent on Products)
    const [templatesRaw, ptavsRaw] = await Promise.all([
      templateIds.length > 0
        ? client.searchRead<ProductTemplateRecord>(
            "product.template",
            [["id", "in", templateIds]],
            ["id", "image_128", "image_1024", "image_1920", "attribute_line_ids"]
          )
        : Promise.resolve([]),
      templateIds.length > 0
        ? client.searchRead<AttributeValueRecord>(
            "product.template.attribute.value",
            [["product_tmpl_id", "in", templateIds]],
            ["id", "name", "attribute_id", "price_extra", "product_tmpl_id"]
          )
        : Promise.resolve([])
    ]);
    
    const templateImages = new Map(templatesRaw.map(t => [t.id, t]));

    const attributesByTemplate = new Map<number, Record<string, any>>();
    
    for (const ptav of ptavsRaw) {
      const tmplId = Array.isArray(ptav.product_tmpl_id) ? ptav.product_tmpl_id[0] : ptav.product_tmpl_id;
      const attrName = Array.isArray(ptav.attribute_id) ? ptav.attribute_id[1] : "Unknown";
      
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
        priceExtra: ptav.price_extra || 0
      });
    }

    const products = productsRaw.map(p => normalizeProduct(p, templateImages, categoriesRaw, attributesByTemplate));
    
    const uniqueCategories = new Map<string, any>();
    categoriesRaw.forEach(cat => {
      if (cat.name.toLowerCase() === 'extras') return;
      const normalized = normalizeCategory(cat);
      if (!uniqueCategories.has(normalized.name)) {
        uniqueCategories.set(normalized.name, normalized);
      }
    });
    
    const categories = Array.from(uniqueCategories.values());

    const etag = crypto.createHash("sha1").update(JSON.stringify(products)).digest("hex");
    const lastUpdate = new Date().toISOString();

    // Cache for 7 days (long TTL to avoid "first hit penalty")
    // We rely on background sync to keep data fresh (Soft TTL)
    const cacheTTL = 60 * 60 * 24 * 7;

    await redisSet("categories:list", categories, cacheTTL);

    for (const p of products) {
      await redisSet(`products:${p.id}`, p, cacheTTL);
    }

    await redisSet("products:all", products, cacheTTL);

    const pageSize = 50;
    const summaries = products.slice(0, pageSize).map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      categoryId: p.categoryId,
      available: p.available,
      images: p.images?.slice(0, 1) || [],
    }));
    await redisSet(`products:list:1:${pageSize}:all`, summaries, cacheTTL);

    await redisSet("sync:last_update", lastUpdate, cacheTTL);
    await redisSet("sync:etag", etag, cacheTTL);

    console.log(`[AUTO-SYNC] Completed successfully: ${products.length} products, ${categories.length} categories`);

    return {
      success: true,
      data: {
        products: products.length,
        categories: categories.length,
        lastUpdate,
        etag,
      }
    };
  } catch (err: any) {
    const msg = err?.message || "Failed to sync products";
    console.error("[AUTO-SYNC] Error:", msg, err);
    return { success: false, error: msg };
  } finally {
    syncInProgress = false;
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
    console.error('[CACHE-CHECK] Error checking cache:', err);
    return true; // On error, trigger refresh
  }
}

// Non-blocking background sync
export function triggerBackgroundSync(): void {
  // Don't await - run in background
  syncProductsFromOdoo().catch(err => {
    console.error('[BACKGROUND-SYNC] Failed:', err);
  });
}

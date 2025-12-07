/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import crypto from "node:crypto";
import { isOdooConfigured, createOdooClient } from "@/server/utils/odooClient";
import { redisSet } from "@/server/cache/redis";
import {
  jsonResponse,
  successResponse,
  errorResponse,
} from "@/server/utils/apiHelpers";

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

type AttributeLineRecord = {
  id: number;
  attribute_id: any; // [id, name]
  value_ids: number[];
};

type AttributeValueRecord = {
  id: number;
  name: string;
  attribute_id: any; // [id, name]
  price_extra: number;
  product_tmpl_id: any; // [id, name]
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
  
  // Find category in categoriesRaw for more details
  const categoryDetail = categoriesRaw.find(c => c.id === categoryId);
  
  const available = rec.active !== false && rec.sale_ok !== false;
  
  // Get template ID for image lookup
  const templateId = Array.isArray(rec.product_tmpl_id) ? rec.product_tmpl_id[0] : rec.product_tmpl_id;
  const template = templateId && templateImages ? templateImages.get(templateId) : null;
  
  // Get attributes for this template
  const attributes = templateId && attributesByTemplate ? attributesByTemplate.get(templateId) : undefined;
  
  // Debug logging for image investigation (log first 3 products only)
  const productIndex = Math.random(); // Simple way to log only some
  if (productIndex < 0.05) { // ~5% of products
    console.log(`[IMAGE DEBUG] Product ${rec.id} (${rec.name}):`, {
      product_image_128_type: typeof rec.image_128,
      product_image_1024_type: typeof rec.image_1024,
      product_image_1920_type: typeof rec.image_1920,
      product_image_128_is_false: rec.image_128 === false,
      product_image_1024_is_false: rec.image_1024 === false,
      product_image_1920_is_false: rec.image_1920 === false,
      has_template: !!template,
      template_id: templateId,
    });
  }
  
  // Try to get images from product first, then from template
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
    name: rec.name,                                        // Standardized to 'name'
    description: (rec as any).description_sale || null,    // Add description
    sku: rec.default_code || String(rec.id),
    price: rec.list_price ?? 0,
    categoryId: categoryId ? String(categoryId) : undefined,
    category: categoryDetail ? {                           // Add category object
      id: String(categoryDetail.id),
      name: categoryDetail.name,
    } : (categoryName ? {                                  // Fallback to name from categ_id
      id: String(categoryId),
      name: categoryName,
    } : undefined),
    available,
    stock: (rec as any).qty_available ?? null,             // Add stock
    sequence: (rec as any).sequence ?? 0,                  // Add sequence
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
    description: (rec as any).display_name || rec.name,  // Use display_name as description
    parentId: Array.isArray(rec.parent_id) ? String(rec.parent_id[0]) : undefined,
    // sequence and productCount will be calculated on frontend
  };
}

export async function POST(request: NextRequest) {
  try {
    if (request.headers.get("x-admin-token") !== process.env.ADMIN_TOKEN) {
      return jsonResponse(errorResponse("Forbidden"), 403);
    }

    if (!process.env.REDIS_URL) {
      return jsonResponse(
        errorResponse("REDIS_URL is not configured for sync"),
        500,
      );
    }

    if (!isOdooConfigured()) {
      return jsonResponse(errorResponse("Odoo not configured"), 500);
    }

    const client = createOdooClient();
    if (!client)
      return jsonResponse(errorResponse("Failed to init Odoo client"), 500);

    const limitEnv = Number(process.env.SYNC_PRODUCTS_LIMIT || "0");
    const limit =
      Number.isFinite(limitEnv) && limitEnv > 0 ? limitEnv : undefined;

    // Fetch products
    const fields = [
      "id",
      "name",
      "default_code",
      "list_price",
      "categ_id",
      "active",
      "sale_ok",
      "image_128",
      "image_1024",
      "image_1920",
      "uom_id",
      "taxes_id",
      "product_tmpl_id",
      // Newly added fields for production
      "description_sale",      // Customer-facing description
      "qty_available",         // Stock on hand
      "virtual_available",     // Forecasted stock
      "sequence",              // Sort order
      // Note: website_published is on product.template, not product.product
    ];
    const productsRaw = await client.searchRead<ProductRecord>(
      "product.product",
      [["sale_ok", "=", true]],
      fields,
      limit ? { limit } : {},
    );

    // Fetch product templates for images and attributes
    const templateIds = Array.from(
      new Set(
        productsRaw
          .map(p => Array.isArray(p.product_tmpl_id) ? p.product_tmpl_id[0] : p.product_tmpl_id)
          .filter(Boolean)
      )
    );
    
    const templatesRaw = templateIds.length > 0
      ? await client.searchRead<ProductTemplateRecord>(
          "product.template",
          [["id", "in", templateIds]],
          ["id", "image_128", "image_1024", "image_1920", "attribute_line_ids"]
        )
      : [];
    
    // Create template map for quick lookup
    const templateImages = new Map(
      templatesRaw.map(t => [t.id, t])
    );

    // Fetch attribute values for these templates
    // We use product.template.attribute.value to get the specific configuration (price_extra)
    const ptavsRaw = templateIds.length > 0
      ? await client.searchRead<AttributeValueRecord>(
          "product.template.attribute.value",
          [["product_tmpl_id", "in", templateIds]],
          ["id", "name", "attribute_id", "price_extra", "product_tmpl_id"]
        )
      : [];

    // Group attributes by template
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

    // Fetch categories
    const categoriesRaw = await client.searchRead<CategoryRecord>(
      "product.category",
      [],
      [
        "id",
        "name",
        "parent_id",
        "display_name",      // Full category path
        "complete_name",     // Hierarchy
        // Note: sequence and product_count don't exist on standard product.category
      ],
    );

    const products = productsRaw.map(p => normalizeProduct(p, templateImages, categoriesRaw, attributesByTemplate));
    
    // Filter out Extras category and remove duplicates
    const uniqueCategories = new Map<string, any>();
    categoriesRaw.forEach(cat => {
      // Skip Extras category
      if (cat.name.toLowerCase() === 'extras') {
        return;
      }
      
      const normalized = normalizeCategory(cat);
      // Use name as key to deduplicate
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

    // Write categories
    await redisSet("categories:list", categories);

    // Write individual products
    for (const p of products) {
      await redisSet(`products:${p.id}`, p);
    }

    // Store full list for API consumption (small/medium catalogs)
    await redisSet("products:all", products);

    // Write first page summary
    const pageSize = 50;
    const summaries = products.slice(0, pageSize).map((p) => ({
      id: p.id,
      name: p.name,                    // Changed from title to name
      price: p.price,
      categoryId: p.categoryId,
      available: p.available,
      images: p.images?.slice(0, 1) || [],
    }));
    await redisSet(`products:list:1:${pageSize}:all`, summaries);

    await redisSet("sync:last_update", lastUpdate);
    await redisSet("sync:etag", etag);

    return jsonResponse(
      successResponse(
        {
          products: products.length,
          categories: categories.length,
          lastUpdate,
          etag,
        },
        "Product sync completed",
      ),
    );
  } catch (err: any) {
    const msg = err?.message || "Failed to sync products";
    console.error("sync/products error", err);
    return jsonResponse(errorResponse(msg), 500);
  }
}


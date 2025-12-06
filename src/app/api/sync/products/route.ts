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
  image_128?: string;
  image_1024?: string;
  image_1920?: string;
  uom_id?: any;
  taxes_id?: any;
  product_tmpl_id?: any;
};

type CategoryRecord = {
  id: number;
  name: string;
  parent_id?: any;
  active?: boolean;
};

function normalizeProduct(rec: ProductRecord) {
  const categoryId = Array.isArray(rec.categ_id)
    ? rec.categ_id[0]
    : rec.categ_id;
  const available = rec.active !== false && rec.sale_ok !== false;
  return {
    id: String(rec.id),
    title: rec.name,
    sku: rec.default_code || String(rec.id),
    price: rec.list_price ?? 0,
    categoryId: categoryId ? String(categoryId) : undefined,
    available,
    images: rec.image_1024
      ? [`data:image/png;base64,${rec.image_1024}`]
      : rec.image_1920
        ? [`data:image/png;base64,${rec.image_1920}`]
        : rec.image_128
          ? [`data:image/png;base64,${rec.image_128}`]
          : [],
    uom: Array.isArray(rec.uom_id)
      ? { id: rec.uom_id[0], name: rec.uom_id[1] }
      : undefined,
    taxes: Array.isArray(rec.taxes_id) ? rec.taxes_id : [],
    attributes: undefined,
  };
}

function normalizeCategory(rec: CategoryRecord) {
  return {
    id: String(rec.id),
    name: rec.name,
    parentId: Array.isArray(rec.parent_id) ? String(rec.parent_id[0]) : undefined,
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
    ];
    const productsRaw = await client.searchRead<ProductRecord>(
      "product.product",
      [["sale_ok", "=", true]],
      fields,
      limit ? { limit } : {},
    );

    // Fetch categories
    const categoriesRaw = await client.searchRead<CategoryRecord>(
      "product.category",
      [["active", "=", true]],
      ["id", "name", "parent_id", "active"],
    );

    const products = productsRaw.map(normalizeProduct);
    const categories = categoriesRaw.map(normalizeCategory);

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
      title: p.title,
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


/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import {
  jsonResponse,
  successResponse,
  errorResponse,
} from "@/server/utils/apiHelpers";
import { redisGet } from "@/server/cache/redis";

type Product = {
  id: string;
  name: string;              // Standardized naming
  description?: string | null;
  price: number;
  categoryId?: string;
  available?: boolean;
  images?: string[];
  sku?: string;
  stock?: number | null;     // Stock level
  sequence?: number;         // Sort order
};

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

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    
    // Support fetching single product by ID
    const productId = url.searchParams.get("id");
    const categoryId = url.searchParams.get("categoryId");
    const limit = url.searchParams.get("limit");
    
    const page = Number(url.searchParams.get("page") || "1");
    const pageSize = Number(url.searchParams.get("pageSize") || "50");
    const category = url.searchParams.get("category");
    const search = url.searchParams.get("search");
    const availability = url.searchParams.get("availability");

    const [allProducts, lastUpdate] = await Promise.all([
      redisGet<Product[]>("products:all"),
      redisGet<string>("sync:last_update"),
    ]);
    if (!allProducts) {
      return jsonResponse(
        errorResponse(
          "Catalog cache is empty. Run /api/sync/products to populate.",
        ),
        503,
      );
    }

    // Handle single product fetch
    if (productId) {
      const product = allProducts.find((p) => p.id === productId);
      if (!product) {
        return jsonResponse(errorResponse("Product not found"), 404);
      }
      return jsonResponse(successResponse([product], { lastUpdate }));
    }

    // Apply filters
    let filtered = applyFilters(allProducts, { category, search, availability });
    
    // Filter by categoryId if provided (for related products)
    if (categoryId) {
      filtered = filtered.filter((p) => p.categoryId === categoryId);
    }
    
    // Apply limit if provided (for related products)
    if (limit) {
      const limitNum = Number(limit);
      if (Number.isFinite(limitNum) && limitNum > 0) {
        filtered = filtered.slice(0, limitNum);
        return jsonResponse(successResponse(filtered, { lastUpdate }));
      }
    }

    const p = Number.isFinite(page) && page > 0 ? page : 1;
    const ps = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 50;
    const start = (p - 1) * ps;
    const end = start + ps;
    const slice = filtered.slice(start, end);

    return jsonResponse(
      successResponse({
        items: slice,
        page: p,
        pageSize: ps,
        total: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / ps)),
        lastUpdate: lastUpdate || null,
      }),
    );
  } catch (err: any) {
    const msg = err?.message || "Failed to fetch products";
    return jsonResponse(errorResponse(msg), 500);
  }
}


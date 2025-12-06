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
  title: string;
  price: number;
  categoryId?: string;
  available?: boolean;
  images?: string[];
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
        p.title?.toLowerCase().includes(q) ||
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

    const filtered = applyFilters(allProducts, { category, search, availability });

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


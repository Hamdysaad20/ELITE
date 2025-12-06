/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import {
  jsonResponse,
  successResponse,
  errorResponse,
} from "@/server/utils/apiHelpers";
import { redisGet } from "@/server/cache/redis";

type Category = { id: string; name: string; parentId?: string };

export async function GET(_request: NextRequest) {
  try {
    const [categories, lastUpdate] = await Promise.all([
      redisGet<Category[]>("categories:list"),
      redisGet<string>("sync:last_update"),
    ]);
    if (!categories) {
      return jsonResponse(
        errorResponse(
          "Category cache is empty. Run /api/sync/products to populate.",
        ),
        503,
      );
    }
    return jsonResponse(successResponse({ categories, lastUpdate: lastUpdate || null }));
  } catch (err: any) {
    const msg = err?.message || "Failed to fetch categories";
    return jsonResponse(errorResponse(msg), 500);
  }
}


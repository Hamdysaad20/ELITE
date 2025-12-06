import { NextRequest } from "next/server";
import {
  jsonResponse,
  successResponse,
  errorResponse,
} from "@/server/utils/apiHelpers";
import { redisGet } from "@/server/cache/redis";

// GET /api/menu/proxy
// Returns cached categories + products for the UI to migrate off static menuData
export async function GET(_req: NextRequest) {
  try {
    const [categories, products, lastUpdate] = await Promise.all([
      redisGet<any[]>("categories:list"),
      redisGet<any[]>("products:all"),
      redisGet<string>("sync:last_update"),
    ]);
    if (!categories || !products) {
      return jsonResponse(
        errorResponse(
          "Catalog cache is empty. Run /api/sync/products to populate.",
        ),
        503,
      );
    }
    return jsonResponse(
      successResponse({
        categories,
        products,
        lastUpdate: lastUpdate || null,
      }),
    );
  } catch (err: any) {
    const msg = err?.message || "Failed to fetch menu";
    return jsonResponse(errorResponse(msg), 500);
  }
}


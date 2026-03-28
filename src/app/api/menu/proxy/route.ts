import { NextRequest } from "next/server";
import {
  jsonResponse,
  successResponse,
  errorResponse,
} from "@/server/utils/apiHelpers";
import { getCatalogSafe } from "@/server/services/product.service";

// GET /api/menu/proxy
// Returns cached categories + products for the UI to migrate off static menuData
export async function GET(_req: NextRequest) {
  try {
    // Use safe catalog fetching with SWR strategy
    const { categories, products, lastUpdate } = await getCatalogSafe();

    const response = jsonResponse(
      successResponse({
        categories,
        products,
        lastUpdate: lastUpdate || null,
      }),
    );
    // Catalog data — cache for 5 minutes, stale for 1 hour
    response.headers.set(
      "Cache-Control",
      "public, max-age=300, stale-while-revalidate=3600",
    );
    return response;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch menu";
    return jsonResponse(errorResponse(msg), 500);
  }
}

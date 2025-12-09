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
    
    return jsonResponse(
      successResponse({
        categories,
        products,
        lastUpdate: lastUpdate || null,
      }),
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch menu";
    return jsonResponse(errorResponse(msg), 500);
  }
}


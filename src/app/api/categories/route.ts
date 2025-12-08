/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import {
  jsonResponse,
  successResponse,
  errorResponse,
} from "@/server/utils/apiHelpers";
import { redisGet } from "@/server/cache/redis";

type Category = { id: string; name: string; parentId?: string };

// Categories that should not be displayed on the website
const EXCLUDED_CATEGORIES = [
  'Extras',     // Add-ons and extras (these are attributes, not products)
  'Services',   // Administrative items like "OPEN REGISTER"
];

export async function GET(_request: NextRequest) {
  try {
    const [allCategories, lastUpdate] = await Promise.all([
      redisGet<Category[]>("categories:list"),
      redisGet<string>("sync:last_update"),
    ]);
    if (!allCategories) {
      return jsonResponse(
        errorResponse(
          "Category cache is empty. Run /api/sync/products to populate.",
        ),
        503,
      );
    }
    
    // Filter out excluded categories
    const categories = allCategories.filter(cat => 
      !EXCLUDED_CATEGORIES.includes(cat.name)
    );
    
    return jsonResponse(successResponse({ categories, lastUpdate: lastUpdate || null }));
  } catch (err: any) {
    const msg = err?.message || "Failed to fetch categories";
    return jsonResponse(errorResponse(msg), 500);
  }
}


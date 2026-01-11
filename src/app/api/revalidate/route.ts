import { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import {
  jsonResponse,
  successResponse,
  errorResponse,
} from "@/server/utils/apiHelpers";

/**
 * Cache Revalidation API
 *
 * This endpoint allows on-demand cache invalidation when Odoo data changes.
 * Can be triggered by:
 * 1. Odoo webhook on product/category changes
 * 2. Admin dashboard "Refresh Cache" button
 * 3. Cron job after sync
 *
 * POST /api/revalidate
 * Body: { tags?: string[], secret?: string }
 *
 * Tags:
 * - "products" - Invalidate all product data
 * - "categories" - Invalidate all category data
 * - "catalog" - Invalidate entire catalog (products + categories)
 * - "all" - Invalidate everything
 */

const REVALIDATE_SECRET =
  process.env.REVALIDATE_SECRET || "elite-revalidate-2024";

// Valid cache tags
const VALID_TAGS = [
  "products",
  "categories",
  "catalog",
  "menu",
  "all",
] as const;
type CacheTag = (typeof VALID_TAGS)[number];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { tags = ["catalog"], secret } = body;

    // Validate secret (optional but recommended for production)
    const authHeader = request.headers.get("authorization");
    const providedSecret = secret || authHeader?.replace("Bearer ", "");

    if (
      process.env.NODE_ENV === "production" &&
      providedSecret !== REVALIDATE_SECRET
    ) {
      return jsonResponse(errorResponse("Invalid revalidation secret"), 401);
    }

    // Validate and normalize tags
    const tagsToRevalidate: CacheTag[] = Array.isArray(tags)
      ? tags.filter((t: string): t is CacheTag =>
          VALID_TAGS.includes(t as CacheTag),
        )
      : ["catalog"];

    if (tagsToRevalidate.length === 0) {
      tagsToRevalidate.push("catalog");
    }

    // Expand "all" to include everything
    const expandedTags = tagsToRevalidate.includes("all")
      ? ["products", "categories", "catalog", "menu"]
      : tagsToRevalidate;

    // Revalidate each tag
    const revalidatedTags: string[] = [];
    for (const tag of expandedTags) {
      try {
        revalidateTag(tag);
        revalidatedTags.push(tag);
      } catch (err) {
        console.warn(`Failed to revalidate tag: ${tag}`, err);
      }
    }

    // Also clear client-side cache by setting a version header
    const response = jsonResponse(
      successResponse({
        revalidated: revalidatedTags,
        timestamp: new Date().toISOString(),
        message: `Cache revalidated for: ${revalidatedTags.join(", ")}`,
      }),
    );

    // Add cache-busting headers
    response.headers.set("Cache-Control", "no-store, must-revalidate");
    response.headers.set("X-Cache-Revalidated", "true");
    response.headers.set("X-Revalidate-Version", Date.now().toString());

    return response;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Revalidation failed";
    return jsonResponse(errorResponse(msg), 500);
  }
}

// GET endpoint for simple cache refresh (browser-friendly)
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tag = url.searchParams.get("tag") || "catalog";
  const secret = url.searchParams.get("secret");

  // Redirect to POST with proper body
  return POST(
    new NextRequest(request.url, {
      method: "POST",
      body: JSON.stringify({ tags: [tag], secret }),
      headers: { "Content-Type": "application/json" },
    }),
  );
}

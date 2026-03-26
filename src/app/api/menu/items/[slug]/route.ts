import { NextRequest } from "next/server";
import { menuData } from "@/lib/menuData";
import {
  successResponse,
  jsonResponse,
  handleApiError,
} from "@/server/utils/apiHelpers";

/**
 * GET /api/menu/items/[slug]
 * Get a specific menu item by slug (using local data)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    let menuItem = null;

    // Search through all categories and subcategories for the item
    for (const category of menuData) {
      for (const subCategory of category.subCategories) {
        const item = subCategory.items.find((item) => item.id === slug);
        if (item) {
          menuItem = item;
          break;
        }
      }
      if (menuItem) break;
    }

    if (!menuItem) {
      return jsonResponse(
        { success: false, error: "Menu item not found" },
        404,
      );
    }

    const response = jsonResponse(successResponse(menuItem));
    // Static menu data — cache aggressively
    response.headers.set(
      "Cache-Control",
      "public, max-age=600, stale-while-revalidate=3600",
    );
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

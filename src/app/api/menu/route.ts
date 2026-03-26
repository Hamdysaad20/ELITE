import { NextRequest } from "next/server";
import { menuData } from "@/lib/menuData";
import {
  successResponse,
  jsonResponse,
  handleApiError,
} from "@/server/utils/apiHelpers";

/**
 * GET /api/menu
 * Get all menu categories (using local data)
 */
export async function GET(request: NextRequest) {
  try {
    const response = jsonResponse(successResponse(menuData));
    // Menu data is static — cache aggressively
    response.headers.set(
      "Cache-Control",
      "public, max-age=600, stale-while-revalidate=3600",
    );
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

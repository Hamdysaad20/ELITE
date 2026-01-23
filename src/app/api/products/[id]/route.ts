/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import {
  jsonResponse,
  successResponse,
  errorResponse,
} from "@/server/utils/apiHelpers";
import { redisGet } from "@/server/cache/redis";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const [product, lastUpdate] = await Promise.all([
      redisGet<any>(`products:${id}`),
      redisGet<string>("sync:last_update"),
    ]);

    if (!product) {
      return jsonResponse(errorResponse("Product not found"), 404);
    }

    const response = jsonResponse(
      successResponse({
        product,
        lastUpdate: lastUpdate || null,
      }),
    );

    // Cache for 5 minutes, stale-while-revalidate for 1 hour
    response.headers.set(
      "Cache-Control",
      "public, max-age=300, stale-while-revalidate=3600",
    );

    return response;
  } catch (err: any) {
    const msg = err?.message || "Failed to fetch product";
    return jsonResponse(errorResponse(msg), 500);
  }
}

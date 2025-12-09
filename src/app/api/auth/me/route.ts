import { NextRequest } from "next/server";
import {
  jsonResponse,
  successResponse,
  errorResponse,
} from "@/server/utils/apiHelpers";
import { getAuthUser } from "@/server/auth/session";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return jsonResponse(errorResponse("Unauthorized"), 401);

    return jsonResponse(
      successResponse({
        id: user.id,
        email: user.email,
        name: user.name,
        loyalty: { points: 0, level: "bronze", totalSpent: 0 },
      }),
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch profile";
    return jsonResponse(errorResponse(msg), 401);
  }
}


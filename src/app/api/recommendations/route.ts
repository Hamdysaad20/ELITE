import { NextRequest } from "next/server";
import {
  jsonResponse,
  successResponse,
  handleApiError,
  parseRequestBody,
  getUserId,
} from "@/server/utils/apiHelpers";
import { BadRequestError } from "@/server/utils/errors";
import {
  preferenceSchema,
  type PreferenceInput,
} from "@/server/validators/recommendationSchemas";
import { suggestDrinks } from "@/server/utils/recommender";
import { getItemById } from "@/lib/menuData";
import { orderDB } from "@/server/utils/jsonDatabase";
import { getAuthUser } from "@/server/auth/session";

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    const userId = authUser?.id || getUserId(request);
    const raw = await parseRequestBody<unknown>(request);

    const parsed = preferenceSchema.safeParse(raw);
    if (!parsed.success) {
      return jsonResponse(
        {
          success: false,
          error: "Invalid request body",
          message: parsed.error.issues.map((i) => i.message).join("; "),
        },
        400,
      );
    }
    const prefs: PreferenceInput = parsed.data;

    // Lightweight personalization using order history
    const history = orderDB.getByUserId(userId);
    const favCount = new Map<string, number>();
    for (const o of history) {
      for (const it of o.items)
        favCount.set(
          it.menuItemId,
          (favCount.get(it.menuItemId) || 0) + it.quantity,
        );
    }
    const topFavIds = Array.from(favCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => id);

    const { top: baseTop, alternatives: baseAlts } = suggestDrinks(prefs);
    let top = baseTop;
    let alternatives = baseAlts || [];
    // If a favorite appears in alternatives and scores close to top, promote it
    const favAlt = alternatives.find((a) => topFavIds.includes(a.item.id));
    if (favAlt && baseTop && favAlt.score >= baseTop.score - 1) {
      top = favAlt;
      alternatives = [
        baseTop,
        ...alternatives.filter((a) => a !== favAlt),
      ].slice(0, 3);
    }

    if (!top) {
      throw new BadRequestError("No available items to suggest");
    }

    // Expand items with full details
    const data = {
      userId,
      recommendation: {
        item: top.item,
        suggestedSize: top.suggestedSize,
        suggestedFlavors: top.suggestedFlavors,
        reasons: top.reasons,
      },
      alternatives: alternatives.map((a) => ({
        item: a.item,
        suggestedSize: a.suggestedSize,
        suggestedFlavors: a.suggestedFlavors,
        reasons: a.reasons,
      })),
      personalization: {
        favorites: topFavIds,
        usedHistory: history.length > 0,
      },
    };

    return jsonResponse(successResponse(data, "Drink suggestion generated"));
  } catch (error) {
    return handleApiError(error);
  }
}

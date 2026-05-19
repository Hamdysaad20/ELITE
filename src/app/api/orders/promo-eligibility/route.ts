import { NextRequest } from "next/server";
import {
  jsonResponse,
  successResponse,
  handleApiError,
} from "@/server/utils/apiHelpers";
import { getAuthUser } from "@/server/auth";
import { prisma } from "@/server/db/client";
import {
  FIRST_ORDER_DISCOUNT_PERCENT,
  getEligiblePriorOrderFilter,
  isFirstOrderPromoActive,
} from "@/server/services/orderPromotions";

/**
 * GET /api/orders/promo-eligibility
 * Tells the checkout UI whether this user qualifies for the first-order
 * online discount. The UI must trust this — never compute discount locally.
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    const promoActive = isFirstOrderPromoActive(new Date());

    if (!authUser?.id || !promoActive) {
      return jsonResponse(
        successResponse({
          eligible: false,
          promoActive,
          discountPercent: FIRST_ORDER_DISCOUNT_PERCENT,
        }),
      );
    }

    const priorPaidOrders = await prisma.order.count({
      where: getEligiblePriorOrderFilter(authUser.id),
    });

    return jsonResponse(
      successResponse({
        eligible: priorPaidOrders === 0,
        promoActive,
        discountPercent: FIRST_ORDER_DISCOUNT_PERCENT,
      }),
    );
  } catch (error) {
    return handleApiError(error);
  }
}

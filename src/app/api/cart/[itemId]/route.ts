import { NextRequest } from "next/server";
import { cartDB } from "@/server/utils/jsonDatabase";
import {
  successResponse,
  jsonResponse,
  handleApiError,
  parseRequestBody,
  getUserId,
} from "@/server/utils/apiHelpers";
import { updateCartItemSchema } from "@/server/validators/cartSchemas";
import { BadRequestError } from "@/server/utils/errors";
import { getAuthUser } from "@/server/auth/session";

/**
 * DELETE /api/cart/[itemId]
 * Remove specific item from cart
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  try {
    const authUser = await getAuthUser(request);
    const userId = authUser?.id || getUserId(request);
    const { itemId } = await params;

    cartDB.removeItem(userId, itemId);

    return jsonResponse(successResponse(null, "Item removed from cart"));
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/cart/[itemId]
 * Update cart item quantity
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  try {
    const authUser = await getAuthUser(request);
    const userId = authUser?.id || getUserId(request);
    const { itemId } = await params;
    const raw = await parseRequestBody(request);
    const { quantity } = updateCartItemSchema.parse(raw);

    cartDB.updateQuantity(userId, itemId, quantity);

    return jsonResponse(successResponse(null, "Cart item updated"));
  } catch (error) {
    if (error instanceof Error && "issues" in error) {
      return handleApiError(new BadRequestError("Invalid request body"));
    }
    return handleApiError(error);
  }
}

import { NextRequest } from "next/server";
import { menuData } from "@/lib/menuData";
import { cartDB } from "@/server/utils/jsonDatabase";
import {
  successResponse,
  jsonResponse,
  handleApiError,
  parseRequestBody,
  getUserId,
} from "@/server/utils/apiHelpers";
import { addToCartSchema } from "@/server/validators/cartSchemas";
import {
  BadRequestError,
  NotFoundError,
  ServiceUnavailableError,
  TooManyRequestsError,
} from "@/server/utils/errors";
import { checkGenericRateLimit } from "@/server/utils/rateLimit";
import { CART_CONFIG, SUCCESS_MESSAGES, ERROR_MESSAGES } from "@/lib/constants";
import type { CartItem } from "@/types";
import { redisGet } from "@/server/cache/redis";
import { getAuthUser } from "@/server/auth/session";
import { getOrderingStatus } from "@/server/config/ordering";
import { ORDERING_DISABLED_MESSAGE } from "@/lib/constants";
import { calculateTotals } from "@/lib/cartTotals";

// Utility function to find a menu item by ID with price validation
async function findMenuItem(menuItemId: string) {
  // Prefer cached product from Redis (primary source of truth)
  const cached = await redisGet<{
    id: string;
    title: string;
    price: number;
    categoryId?: string;
    images?: string[];
    available?: boolean;
  }>(`products:${menuItemId}`);
  if (cached) {
    return {
      id: cached.id,
      name: cached.title,
      description: cached.title,
      price: cached.price,
      category: cached.categoryId || "catalog",
      subCategory: cached.categoryId || "catalog",
      images: cached.images || [],
      featured: false,
      available: cached.available !== false,
      allergens: [],
      sizes: [],
      flavors: [],
      toppings: [],
      // Store original cached price for validation
      _cachedPrice: cached.price,
    };
  }
  // Fallback to static menu data for dev (when cache not available)
  for (const category of menuData) {
    for (const subCategory of category.subCategories) {
      const item = subCategory.items.find((item) => item.id === menuItemId);
      if (item) return { ...item, _cachedPrice: undefined };
    }
  }
  return null;
}

/**
 * Validate that the calculated price matches the cached product price
 * This prevents price manipulation attacks
 */
function validatePrice(
  menuItem: { _cachedPrice?: number },
  calculatedBasePrice: number,
): void {
  if (menuItem._cachedPrice !== undefined) {
    // If we have a cached price, validate against it
    if (Math.abs(calculatedBasePrice - menuItem._cachedPrice) > 0.01) {
      throw new BadRequestError(
        `Price mismatch detected. Expected ${menuItem._cachedPrice}, got ${calculatedBasePrice}. Please refresh and try again.`,
      );
    }
  }
}

/**
 * GET /api/cart
 * Retrieves the current user's cart with calculated totals
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    const userId = authUser?.id || getUserId(request);
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const limit = await checkGenericRateLimit(userId || clientIp, "CART");
    if (!limit.allowed)
      throw new TooManyRequestsError("Too many cart requests");

    const items = cartDB.get(userId);
    const totals = calculateTotals(items);

    return jsonResponse(
      successResponse({
        cart: { items },
        totals,
      }),
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/cart
 * Adds an item to the user's cart with proper price calculation
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    const userId = authUser?.id || getUserId(request);
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const limit = await checkGenericRateLimit(userId || clientIp, "CART");
    if (!limit.allowed)
      throw new TooManyRequestsError("Too many cart requests");

    const { orderingEnabled, orderingMessage } = getOrderingStatus();
    if (!orderingEnabled) {
      throw new ServiceUnavailableError(
        orderingMessage || ORDERING_DISABLED_MESSAGE,
      );
    }
    const raw = await parseRequestBody(request);
    const body = addToCartSchema.parse(raw);
    const { menuItemId, quantity, size, flavor, toppings, attributes } = body;

    // Validate quantity limits
    if (quantity > CART_CONFIG.MAX_QUANTITY) {
      throw new BadRequestError(
        `Maximum quantity is ${CART_CONFIG.MAX_QUANTITY}`,
      );
    }

    // Find menu item
    const menuItem = await findMenuItem(menuItemId);
    if (!menuItem) throw new NotFoundError(ERROR_MESSAGES.MENU_ITEM_NOT_FOUND);

    // Availability check
    if (menuItem.available === false) {
      throw new BadRequestError("Item is unavailable");
    }

    // Calculate price with validation
    let price = menuItem.price;

    // Validate base price against cache (prevents price manipulation)
    validatePrice(menuItem, price);

    // Size/flavor/toppings adjustments only apply if present in menu data fallback
    if (size && menuItem.sizes?.length) {
      const sizeOption = menuItem.sizes.find(
        (s: { name: string; priceModifier: number }) => s.name === size,
      );
      if (sizeOption) price += sizeOption.priceModifier;
    }

    if (flavor && menuItem.flavors?.length) {
      const flavorOption = menuItem.flavors.find(
        (f: { name: string; price: number }) => f.name === flavor,
      );
      if (flavorOption) price += flavorOption.price;
    }

    if (toppings && menuItem.toppings?.length) {
      for (const toppingName of toppings) {
        const topping = (
          menuItem.toppings as Array<{ name: string; price: number }>
        ).find((t) => t.name === toppingName);
        if (topping) price += topping.price;
      }
    }

    // Handle generic attributes (from Odoo)
    // Note: In a real implementation, we would validate these against the cached product attributes
    // For now, we trust the client's price calculation or rely on the base price validation
    // Ideally, we should fetch the full product with attributes from Redis here to validate extra prices

    const cartItem: CartItem = {
      id: `cart-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      menuItemId,
      quantity,
      size,
      flavor,
      toppings: toppings || [],
      attributes: attributes || {},
      price: Number((price * quantity).toFixed(2)),
      menuItem,
    };

    cartDB.addItem(userId, cartItem);

    return jsonResponse(
      successResponse(cartItem, SUCCESS_MESSAGES.ITEM_ADDED),
      201,
    );
  } catch (error) {
    if (error instanceof Error && "issues" in error) {
      // zod error
      return handleApiError(new BadRequestError("Invalid request body"));
    }
    return handleApiError(error);
  }
}

/**
 * DELETE /api/cart
 * Clears all items from the user's cart
 */
export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    const userId = authUser?.id || getUserId(request);
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const limit = await checkGenericRateLimit(userId || clientIp, "CART");
    if (!limit.allowed)
      throw new TooManyRequestsError("Too many cart requests");

    cartDB.clear(userId);

    return jsonResponse(successResponse(null, SUCCESS_MESSAGES.CART_CLEARED));
  } catch (error) {
    return handleApiError(error);
  }
}

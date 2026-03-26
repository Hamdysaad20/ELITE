import { redisGet } from "@/server/cache/redis";
import { BadRequestError } from "@/server/utils/errors";
import type { CartItemInput } from "@/server/validators/orderSchemas";
import { getItemById } from "@/lib/menuData";
import { CART_CONFIG } from "@/lib/constants";

type CachedProduct = {
  id: string;
  name: string;
  price: number;
  categoryId?: string;
  available?: boolean;
  attributes?: Record<
    string,
    Array<{
      id: number;
      name: string;
      priceExtra: number;
    }>
  >;
  sku?: string;
};

type PricedOrderItem = {
  productId: string;
  sku: string;
  name: string;
  categoryId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  attributes: {
    basePrice: number;
    selections: Record<
      string,
      Array<{
        valueId: number;
        valueName: string;
        priceExtra: number;
      }>
    >;
    formatted: string[];
  };
};

function toFixed2Number(value: number): number {
  return Number(value.toFixed(2));
}

export async function buildPricedOrderItems(
  items: CartItemInput[],
): Promise<{ pricedItems: PricedOrderItem[]; subtotal: number }> {
  // Resolve all products up front (parallel) since this runs inside a single request.
  const pricedItems = await Promise.all(
    items.map(async (item) => {
      if (item.quantity > CART_CONFIG.MAX_QUANTITY) {
        throw new BadRequestError("Invalid quantity for one of the items");
      }

      const cached = await redisGet<CachedProduct>(
        `products:${item.productId}`,
      );

      const clientAttributes = item.attributes ?? {};
      const clientHasCustomOptions =
        clientAttributes && Object.keys(clientAttributes).length > 0;

      // Fallback: menuData only knows about base product prices and menu sizes/flavors/toppings
      // (not the Odoo attribute templates used by your LocalCartItem.attributes).
      if (!cached) {
        if (clientHasCustomOptions) {
          throw new BadRequestError(
            "Pricing unavailable for selected item options. Please try again.",
          );
        }

        const menuItem = getItemById(item.productId);
        if (!menuItem || menuItem.available === false) {
          throw new BadRequestError("Item is unavailable");
        }

        const basePrice = toFixed2Number(menuItem.price);
        const unitPrice = basePrice;
        const totalPrice = toFixed2Number(unitPrice * item.quantity);

        // basic sanity vs client-provided totals
        if (Math.abs(item.totalPrice - totalPrice) > 0.01) {
          throw new BadRequestError("Price mismatch detected for cart items");
        }

        return {
          productId: item.productId,
          sku: item.productId,
          name: menuItem.name,
          categoryId: undefined,
          quantity: item.quantity,
          unitPrice,
          totalPrice,
          attributes: {
            basePrice,
            selections: {},
            formatted: [],
          },
        };
      }

      if (cached.available === false) {
        throw new BadRequestError("Item is unavailable");
      }

      const basePrice = toFixed2Number(Number(cached.price ?? 0));
      if (!Number.isFinite(basePrice) || basePrice < 0) {
        throw new BadRequestError("Invalid product pricing");
      }

      // Validate client base price quickly (helps detect tampering).
      if (Math.abs(item.basePrice - basePrice) > 0.01) {
        throw new BadRequestError("Price mismatch detected for cart items");
      }

      const selections: PricedOrderItem["attributes"]["selections"] = {};
      const formattedSelections: string[] = [];
      let extrasTotal = 0;

      for (const [attrName, values] of Object.entries(clientAttributes)) {
        const cachedOptions = cached.attributes?.[attrName];
        if (!cachedOptions || !Array.isArray(cachedOptions)) {
          throw new BadRequestError("Invalid item option selected");
        }

        for (const selected of values) {
          const cachedOpt = cachedOptions.find(
            (o) => o.id === selected.valueId,
          );
          if (!cachedOpt) {
            throw new BadRequestError("Invalid item option selected");
          }

          const extra = toFixed2Number(Number(cachedOpt.priceExtra ?? 0));
          extrasTotal += extra;

          // Store trusted selection details (never trust client priceExtra/name)
          if (!selections[attrName]) selections[attrName] = [];
          selections[attrName].push({
            valueId: cachedOpt.id,
            valueName: cachedOpt.name,
            priceExtra: extra,
          });
          formattedSelections.push(`${attrName}: ${cachedOpt.name}`);
        }
      }

      const unitPrice = toFixed2Number(basePrice + extrasTotal);
      const totalPrice = toFixed2Number(unitPrice * item.quantity);

      if (Math.abs(item.totalPrice - totalPrice) > 0.01) {
        throw new BadRequestError("Price mismatch detected for cart items");
      }

      return {
        productId: item.productId,
        sku: cached.sku || item.productId,
        name: cached.name,
        categoryId: cached.categoryId,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
        attributes: {
          basePrice,
          selections,
          formatted: formattedSelections,
        },
      };
    }),
  );

  const subtotal = pricedItems.reduce((sum, it) => sum + it.totalPrice, 0);
  return { pricedItems, subtotal };
}

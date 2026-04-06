import { NextRequest } from "next/server";
import { prisma } from "@/server/db/client";
import type {
  Order as PrismaOrder,
  OrderItem as PrismaOrderItem,
} from "@prisma/client";
import {
  successResponse,
  jsonResponse,
  handleApiError,
  getUserId,
} from "@/server/utils/apiHelpers";
import { getAuthUser } from "@/server/auth/session";
import { redisGet } from "@/server/cache/redis";
import { getProductsSafe } from "@/server/services/product.service";
import {
  getLocalProductImageCandidates,
  sanitizeImages,
} from "@/lib/imageUtils";

type DbOrderWithItems = PrismaOrder & { items: PrismaOrderItem[] };

function normalizeProductName(value: string | null | undefined): string {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeProductName(value: string | null | undefined): string[] {
  return normalizeProductName(value)
    .split(" ")
    .filter((token) => token.length > 2);
}

async function serializeOrder(dbOrder: DbOrderWithItems) {
  // Primary source: shared catalog cache/service used by menu/products APIs.
  const { products: catalogProducts } = await getProductsSafe().catch(() => ({
    products: [],
  }));

  const imagesById = new Map<string, string[]>();
  const imagesByName = new Map<string, string[]>();

  for (const product of catalogProducts) {
    const images = sanitizeImages(product.images);

    if (images.length === 0) {
      continue;
    }

    if (product.id) {
      imagesById.set(product.id, images);
    }

    const normalizedName = normalizeProductName(product.name);
    if (normalizedName) {
      imagesByName.set(normalizedName, images);
    }
  }

  // Fetch product images from Redis cache for each item
  const itemsWithImages = await Promise.all(
    (dbOrder.items || []).map(async (it) => {
      let images: string[] = [];

      const catalogById = imagesById.get(it.productId);
      if (catalogById?.length) {
        images = catalogById;
      }

      if (images.length === 0) {
        const catalogByName = imagesByName.get(normalizeProductName(it.name));
        if (catalogByName?.length) {
          images = catalogByName;
        }
      }

      // Fuzzy fallback for renamed/customized line items (e.g. "Taro Matcha")
      // where the catalog product may have a longer canonical name.
      if (images.length === 0) {
        const itemTokens = tokenizeProductName(it.name);
        if (itemTokens.length > 0) {
          const fuzzyMatch = catalogProducts.find((product) => {
            const productTokens = tokenizeProductName(product.name);
            return itemTokens.every((token) => productTokens.includes(token));
          });

          if (fuzzyMatch?.images?.length) {
            images = sanitizeImages(fuzzyMatch.images);
          }
        }
      }

      // Legacy fallback: direct per-product Redis key if catalog lookup misses.
      if (images.length === 0) {
        try {
          const cachedProduct = await redisGet<{
            id: string;
            title: string;
            images?: string[];
            image_128?: string;
            image_1024?: string;
            image_1920?: string;
          }>(`products:${it.productId}`);

          if (cachedProduct) {
            // Prefer image arrays, fallback to single image fields
            if (cachedProduct.images && Array.isArray(cachedProduct.images)) {
              images = sanitizeImages(cachedProduct.images);
            } else if (cachedProduct.image_1920) {
              images = [cachedProduct.image_1920];
            } else if (cachedProduct.image_1024) {
              images = [cachedProduct.image_1024];
            } else if (cachedProduct.image_128) {
              images = [cachedProduct.image_128];
            }
          }
        } catch (err) {
          // Silently fail - images are optional
          console.debug(
            `Failed to fetch images for product ${it.productId}:`,
            err,
          );
        }
      }

      // Name-based local fallback from /public/Old Items when catalog/redis misses.
      if (images.length === 0 && it.name) {
        const localCandidates = getLocalProductImageCandidates(
          it.name,
          "-1.png",
        );
        if (localCandidates.length > 0) {
          images = [localCandidates[0]];
        }
      }

      if (images.length === 0) {
        images = ["/images/PRINTING_CUP.png"];
      }

      return {
        id: it.id,
        menuItemId: it.productId,
        quantity: it.quantity,
        unitPrice: Number(it.unitPrice),
        totalPrice: Number(it.totalPrice),
        attributes: it.attributes,
        menuItem: it.name
          ? {
              id: it.productId,
              name: it.name,
              description: it.name,
              price: Number(it.unitPrice),
              category: it.categoryId || "unknown",
              subCategory: it.categoryId || "unknown",
              images: images,
              featured: false,
              available: true,
              allergens: [],
              sizes: [],
              flavors: [],
              toppings: [],
            }
          : undefined,
      };
    }),
  );

  return {
    id: dbOrder.id,
    orderNumber: dbOrder.id,
    userId: dbOrder.userId || "demo-user",
    status: dbOrder.status,
    paymentStatus: dbOrder.paymentStatus,
    paymentMethod: dbOrder.paymentMethod,
    orderType: dbOrder.orderType,
    subtotal: Number(dbOrder.subtotal),
    deliveryFee: Number(dbOrder.deliveryFee),
    codFee: Number((dbOrder as { codFee?: unknown }).codFee ?? 0),
    discount: Number(dbOrder.discount),
    total: Number(dbOrder.total),
    notes: dbOrder.notes || undefined,
    address: dbOrder.addressId
      ? await prisma.address.findUnique({
          where: { id: dbOrder.addressId },
        })
      : undefined,
    items: itemsWithImages,
    createdAt: dbOrder.createdAt,
    updatedAt: dbOrder.updatedAt,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(request);
    const userId = authUser?.id || getUserId(request);

    const order = await prisma.order.findFirst({
      where: { id, userId },
      include: { items: true, address: true },
    });

    if (!order) {
      return jsonResponse({ success: false, error: "Order not found" }, 404);
    }
    // Hide unpaid online-payment orders (awaiting webhook confirmation).
    // CASH orders are auto-marked PAID; this is a safety net.
    if (order.paymentStatus !== "PAID" && order.paymentMethod !== "CASH") {
      return jsonResponse({ success: false, error: "Order not found" }, 404);
    }

    const serialized = await serializeOrder(order);
    return jsonResponse(successResponse(serialized));
  } catch (error) {
    return handleApiError(error);
  }
}

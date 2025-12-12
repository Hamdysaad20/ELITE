import { NextRequest } from "next/server";
import { prisma } from "@/server/db/client";
import type { Order as PrismaOrder, OrderItem as PrismaOrderItem } from "@prisma/client";
import {
  successResponse,
  jsonResponse,
  handleApiError,
  getUserId,
} from "@/server/utils/apiHelpers";
import { getAuthUser } from "@/server/auth/session";
import { redisGet } from "@/server/cache/redis";

type DbOrderWithItems = PrismaOrder & { items: PrismaOrderItem[] };

async function serializeOrder(dbOrder: DbOrderWithItems) {
  // Fetch product images from Redis cache for each item
  const itemsWithImages = await Promise.all(
    (dbOrder.items || []).map(async (it) => {
      let images: string[] = [];
      
      // Try to get product images from Redis cache
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
            images = cachedProduct.images;
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
        console.debug(`Failed to fetch images for product ${it.productId}:`, err);
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
    })
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

    const serialized = await serializeOrder(order);
    return jsonResponse(successResponse(serialized));
  } catch (error) {
    return handleApiError(error);
  }
}

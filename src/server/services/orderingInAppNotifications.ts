import { prisma } from "@/server/db/client";

/**
 * Mark item-availability subscriptions as ready for in-app notification.
 * This flips `notified=true` and refreshes `createdAt` so newest status updates appear first.
 */
export async function markOrderingResumedInAppNotifications(options?: {
  productIds?: string[];
}): Promise<{ updated: number }> {
  const filteredProductIds = options?.productIds?.filter(Boolean) ?? [];

  if (options?.productIds && filteredProductIds.length === 0) {
    return { updated: 0 };
  }

  const result = await prisma.itemAvailabilityNotification.updateMany({
    where: {
      notified: false,
      ...(filteredProductIds.length > 0
        ? { productId: { in: filteredProductIds } }
        : {}),
    },
    data: {
      notified: true,
      createdAt: new Date(),
    },
  });

  return { updated: result.count };
}

/**
 * Mark pending subscriptions as notified for products that are currently available.
 */
export async function markOrderingResumedForAvailableProducts(
  availableProductIds: string[],
): Promise<{ updated: number; matchedProductIds: string[] }> {
  const ids = availableProductIds.filter(Boolean);

  if (ids.length === 0) {
    return { updated: 0, matchedProductIds: [] };
  }

  const pending = await prisma.itemAvailabilityNotification.findMany({
    where: {
      notified: false,
      productId: { in: ids },
    },
    select: {
      productId: true,
    },
    distinct: ["productId"],
  });

  const matchedProductIds = pending.map((row) => row.productId);

  if (matchedProductIds.length === 0) {
    return { updated: 0, matchedProductIds: [] };
  }

  const result = await prisma.itemAvailabilityNotification.updateMany({
    where: {
      notified: false,
      productId: { in: matchedProductIds },
    },
    data: {
      notified: true,
      createdAt: new Date(),
    },
  });

  return {
    updated: result.count,
    matchedProductIds,
  };
}

import { prisma } from "@/server/db/client";

/**
 * Legacy compatibility wrapper.
 *
 * This function used to send emails. It now marks subscriptions as
 * in-app/system notifications only.
 */
export async function sendOrderingResumedEmails(options?: {
  productIds?: string[];
}): Promise<void> {
  const filteredProductIds = options?.productIds?.filter(Boolean) ?? [];
  if (options?.productIds && filteredProductIds.length === 0) {
    console.log(
      "[orderingSystemNotifications] No product ids provided for targeted notification",
    );
    return;
  }

  // Fetch pending subscriptions that should become in-app notifications.
  const pending = await prisma.itemAvailabilityNotification.findMany({
    where: {
      notified: false,
      ...(filteredProductIds.length > 0
        ? { productId: { in: filteredProductIds } }
        : {}),
    },
  });

  if (pending.length === 0) {
    console.log("[orderingSystemNotifications] No pending notifications");
    return;
  }

  const pendingIds = pending.map((row) => row.id);
  if (pendingIds.length === 0) {
    return;
  }

  // Mark processed records as notified so they appear in the in-app system feed.
  const updateResult = await prisma.itemAvailabilityNotification.updateMany({
    where: {
      id: { in: pendingIds },
      notified: false,
    },
    data: { notified: true },
  });

  console.log(
    `[orderingSystemNotifications] Marked ${updateResult.count} notifications as ready`,
  );
}

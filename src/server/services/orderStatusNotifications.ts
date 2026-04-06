import { normalizeOrderStatus } from "@/lib/orderStatus";
import { prisma } from "@/server/db/client";

interface NotifyOrderStatusChangeInput {
  orderId: string;
  userId?: string | null;
  previousStatus: string;
  nextStatus: string;
  source: "odoo-sync" | "odoo-poll";
}

export async function notifyOrderStatusChange(
  input: NotifyOrderStatusChangeInput,
): Promise<void> {
  const previous = normalizeOrderStatus(input.previousStatus);
  const next = normalizeOrderStatus(input.nextStatus);

  if (previous === next) {
    return;
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: input.orderId },
      select: { id: true, clientOrderRef: true, notes: true },
    });

    if (!order) {
      return;
    }

    const systemLine = `[SYSTEM] Order ${order.clientOrderRef || order.id} status changed: ${previous} -> ${next} (${input.source}) at ${new Date().toISOString()}`;
    const existing = order.notes?.trim();

    await prisma.order.update({
      where: { id: order.id },
      data: {
        notes: existing ? `${existing}\n${systemLine}` : systemLine,
      },
    });

    console.log(
      `[orderStatusNotifications] Created system notification for order ${input.orderId}: ${previous} -> ${next}`,
    );
  } catch (error) {
    // Notification failures must never block status synchronization.
    console.error(
      `[orderStatusNotifications] Failed to create system status notification for order ${input.orderId}:`,
      error,
    );
  }
}

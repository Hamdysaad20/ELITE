import { normalizeOrderStatus } from "@/lib/orderStatus";
import { prisma } from "@/server/db/client";

interface NotifyOrderStatusChangeInput {
  orderId: string;
  existingNotes?: string | null;
  clientOrderRef?: string | null;
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
    const systemLine = `[SYSTEM] Order ${input.clientOrderRef || input.orderId} status changed: ${previous} -> ${next} (${input.source}) at ${new Date().toISOString()}`;
    const existing = input.existingNotes?.trim();

    await prisma.order.update({
      where: { id: input.orderId },
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

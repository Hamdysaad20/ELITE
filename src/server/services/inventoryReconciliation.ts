import { prisma } from "@/server/db/client";

export async function reconcileSubmittedInventoryCount(
  countId: string,
  recordedById: string,
) {
  const existing = await prisma.stockMovement.findFirst({
    where: { referenceType: "inventory_count", referenceId: countId },
    select: { id: true },
  });
  if (existing) return { created: 0, skipped: true };

  const count = await prisma.inventoryCount.findUnique({
    where: { id: countId },
    select: {
      id: true,
      location: true,
      status: true,
      entries: {
        select: {
          itemId: true,
          totalQuantity: true,
        },
      },
    },
  });

  if (!count || count.status !== "submitted")
    return { created: 0, skipped: true };

  const current = await prisma.stockMovement.groupBy({
    by: ["itemId"],
    where: { location: count.location },
    _sum: { quantity: true },
  });

  const currentByItem = new Map(
    current.map((row) => [row.itemId, Number(row._sum.quantity || 0)]),
  );

  const movements = count.entries
    .map((entry) => {
      const counted = Number(entry.totalQuantity);
      const currentQty = currentByItem.get(entry.itemId) || 0;
      const delta = Math.round((counted - currentQty) * 100) / 100;
      return { itemId: entry.itemId, delta };
    })
    .filter((entry) => entry.delta !== 0);

  if (movements.length === 0) return { created: 0, skipped: false };

  await prisma.stockMovement.createMany({
    data: movements.map((movement) => ({
      itemId: movement.itemId,
      location: count.location,
      type: "count_reconciliation",
      quantity: movement.delta,
      referenceType: "inventory_count",
      referenceId: count.id,
      note: `Reconciled ${count.location} stock to submitted count`,
      recordedById,
    })),
  });

  return { created: movements.length, skipped: false };
}

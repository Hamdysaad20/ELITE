import { describe, expect, it, vi, beforeEach } from "vitest";
import { prismaMock } from "../../setup/prisma";
import { reconcileSubmittedInventoryCount } from "@/server/services/inventoryReconciliation";

describe("inventory count reconciliation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates adjustment movements that align stock with submitted counts", async () => {
    prismaMock.stockMovement.findFirst.mockResolvedValue(null);
    prismaMock.inventoryCount.findUnique.mockResolvedValue({
      id: "count-1",
      location: "bar",
      status: "submitted",
      entries: [
        { itemId: "milk", totalQuantity: 10 },
        { itemId: "cups", totalQuantity: 5 },
      ],
    } as never);
    prismaMock.stockMovement.groupBy.mockResolvedValue([
      { itemId: "milk", _sum: { quantity: 7 } },
      { itemId: "cups", _sum: { quantity: 8 } },
    ] as never);
    prismaMock.stockMovement.createMany.mockResolvedValue({ count: 2 } as never);

    const result = await reconcileSubmittedInventoryCount("count-1", "user-1");

    expect(result).toEqual({ created: 2, skipped: false });
    expect(prismaMock.stockMovement.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          itemId: "milk",
          quantity: 3,
          referenceType: "inventory_count",
          referenceId: "count-1",
        }),
        expect.objectContaining({
          itemId: "cups",
          quantity: -3,
          referenceType: "inventory_count",
          referenceId: "count-1",
        }),
      ]),
    });
  });

  it("is idempotent when reconciliation movements already exist", async () => {
    prismaMock.stockMovement.findFirst.mockResolvedValue({ id: "movement-1" } as never);

    const result = await reconcileSubmittedInventoryCount("count-1", "user-1");

    expect(result).toEqual({ created: 0, skipped: true });
    expect(prismaMock.stockMovement.createMany).not.toHaveBeenCalled();
  });
});


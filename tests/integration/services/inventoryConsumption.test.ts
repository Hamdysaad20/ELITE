import { describe, expect, it, vi, beforeEach } from "vitest";
import { prismaMock } from "../../setup/prisma";
import { consumeInventoryForOnlineOrder } from "@/server/services/inventoryConsumption";

vi.mock("@/server/services/inventoryAutomation", () => ({
  getInventoryAutomationUserId: vi.fn().mockResolvedValue("system-user"),
}));

describe("inventory recipe consumption", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates recipe consumption movements for paid online order items", async () => {
    prismaMock.order.findUnique.mockResolvedValue({
      id: "order-1",
      paymentStatus: "PAID",
      paymentMethod: "CARD",
      items: [
        {
          id: "line-1",
          productId: "latte",
          name: "Latte",
          quantity: 2,
        },
      ],
    } as never);
    prismaMock.stockMovement.findFirst.mockResolvedValue(null);
    prismaMock.recipe.findMany.mockResolvedValue([
      {
        id: "recipe-1",
        ingredients: [
          { itemId: "milk", quantity: 0.2, unit: "liter" },
          { itemId: "beans", quantity: 0.018, unit: "kg" },
        ],
      },
    ] as never);
    prismaMock.stockMovement.createMany.mockResolvedValue({ count: 2 } as never);

    const result = await consumeInventoryForOnlineOrder("order-1");

    expect(result).toEqual({ created: 2, skipped: 0 });
    expect(prismaMock.stockMovement.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          itemId: "milk",
          quantity: -0.4,
          referenceType: "online_order",
          referenceId: "online:order-1:line-1",
        }),
        expect.objectContaining({
          itemId: "beans",
          quantity: -0.036,
          referenceType: "online_order",
          referenceId: "online:order-1:line-1",
        }),
      ]),
    });
  });

  it("does not consume unpaid online orders", async () => {
    prismaMock.order.findUnique.mockResolvedValue({
      id: "order-1",
      paymentStatus: "PENDING",
      paymentMethod: "CARD",
      items: [{ id: "line-1", productId: "latte", name: "Latte", quantity: 1 }],
    } as never);

    const result = await consumeInventoryForOnlineOrder("order-1");

    expect(result).toEqual({ created: 0, skipped: 1 });
    expect(prismaMock.stockMovement.createMany).not.toHaveBeenCalled();
  });
});


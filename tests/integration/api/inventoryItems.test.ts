import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { prismaMock } from "../../setup/prisma";
import { PATCH } from "@/app/api/admin/inventory-items/route";

vi.mock("@/server/auth/session", () => ({
  requireRole: vi.fn().mockResolvedValue({ id: "manager-1", role: "manager" }),
}));

describe("admin inventory item rules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates ordering rules and records field-level history", async () => {
    prismaMock.inventoryItem.findUnique.mockResolvedValue({
      id: "item-1",
      minimumStock: 0,
      alertLevel: 0,
      maximumStock: 5,
      backupThreshold: 1,
      preferredSupplier: null,
    } as never);
    prismaMock.$transaction.mockImplementation(async (callback) =>
      callback({
        inventoryItem: {
          update: vi.fn().mockResolvedValue({ id: "item-1", minimumStock: 2 }),
        },
        inventoryRuleChangeLog: {
          createMany: vi.fn().mockResolvedValue({ count: 2 }),
        },
      } as never),
    );

    const response = await PATCH(
      new NextRequest("http://localhost/api/admin/inventory-items", {
        method: "PATCH",
        body: JSON.stringify({
          itemId: "00000000-0000-0000-0000-000000000001",
          minimumStock: 2,
          backupThreshold: 0.5,
          reason: "Configured real threshold",
        }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
  });
});

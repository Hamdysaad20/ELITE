import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/admin/inventory/route";
import { prismaMock } from "../../setup/prisma";

vi.mock("@/server/auth/session", () => ({
  requireRole: vi.fn().mockResolvedValue({ id: "user-1", role: "barista" }),
}));

vi.mock("@/server/services/inventoryReconciliation", () => ({
  reconcileSubmittedInventoryCount: vi.fn().mockResolvedValue({
    created: 0,
    skipped: false,
  }),
}));

describe("API Integrations: Admin Inventory POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calculates totalQuantity using each item's packSize", async () => {
    prismaMock.inventoryItem.findMany.mockResolvedValue([
      { id: "11111111-1111-4111-8111-111111111111", packSize: 24 },
      { id: "22222222-2222-4222-8222-222222222222", packSize: 12 },
    ] as never);
    prismaMock.inventoryCount.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    prismaMock.inventoryCount.create.mockResolvedValue({
      id: "count-1",
      entries: [],
    } as never);

    const req = new NextRequest("http://localhost/api/admin/inventory", {
      method: "POST",
      body: JSON.stringify({
        location: "bar",
        shiftConfirmed: "morning",
        entries: [
          {
            itemId: "11111111-1111-4111-8111-111111111111",
            packsCount: 2,
            looseSingles: 3,
            quantity: 0,
          },
          {
            itemId: "22222222-2222-4222-8222-222222222222",
            packsCount: 4,
            looseSingles: 1,
            quantity: 0.75,
          },
        ],
        submit: true,
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(prismaMock.inventoryCount.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.inventoryCount.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          entries: {
            create: expect.arrayContaining([
              expect.objectContaining({
                itemId: "11111111-1111-4111-8111-111111111111",
                totalQuantity: 51,
              }),
              expect.objectContaining({
                itemId: "22222222-2222-4222-8222-222222222222",
                totalQuantity: 0.75,
              }),
            ]),
          },
        }),
      }),
    );
  });

  it("returns 404 when submitted item ids do not match inventory records", async () => {
    prismaMock.inventoryItem.findMany.mockResolvedValue([
      { id: "11111111-1111-4111-8111-111111111111", packSize: 24 },
    ] as never);

    const req = new NextRequest("http://localhost/api/admin/inventory", {
      method: "POST",
      body: JSON.stringify({
        location: "bar",
        shiftConfirmed: "morning",
        entries: [
          {
            itemId: "11111111-1111-4111-8111-111111111111",
            quantity: 1,
          },
          {
            itemId: "33333333-3333-4333-8333-333333333333",
            quantity: 1,
          },
        ],
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.success).toBe(false);
    expect(prismaMock.inventoryCount.create).not.toHaveBeenCalled();
    expect(prismaMock.inventoryCount.update).not.toHaveBeenCalled();
  });
});

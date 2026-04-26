import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { prismaMock } from "../../setup/prisma";
import { GET as getStock } from "@/app/api/admin/stock/route";
import { GET as getDailySummary } from "@/app/api/cron/daily-summary/route";
import { sendDailySummaryEmail } from "@/app/api/cron/daily-summary/email";

vi.mock("@/server/auth/session", () => ({
  requireRole: vi.fn().mockResolvedValue({ id: "manager_1", role: "manager" }),
}));

vi.mock("@/app/api/cron/daily-summary/email", () => ({
  sendDailySummaryEmail: vi.fn().mockResolvedValue(undefined),
}));

describe("Inventory shortage notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  it("classifies items with unset minimum stock and low partial quantity as backup orders", async () => {
    prismaMock.inventoryItem.findMany.mockResolvedValue([
      {
        id: "passion-fruit",
        name: "Passion Fruit",
        nameAr: "باشن فروت",
        section: "syrups_sauces",
        unit: "bottle",
        unitAr: "زجاجة",
        packSize: 1,
        minimumStock: 0,
        alertLevel: 0,
        maximumStock: 6,
        backupThreshold: 0.75,
        preferredSupplier: "Syrups Supplier",
        sortOrder: 1,
      },
      {
        id: "milk",
        name: "Milk",
        nameAr: "لبن",
        section: "coffee_beverages",
        unit: "liter",
        unitAr: "لتر",
        packSize: 1,
        minimumStock: 2,
        alertLevel: 4,
        maximumStock: 10,
        backupThreshold: 1,
        preferredSupplier: "Milk Supplier",
        sortOrder: 2,
      },
    ] as never);
    prismaMock.stockMovement.groupBy
      .mockResolvedValueOnce([
        {
          itemId: "passion-fruit",
          location: "storage",
          _sum: { quantity: 0.5 },
        },
        {
          itemId: "milk",
          location: "bar",
          _sum: { quantity: 2 },
        },
      ] as never)
      .mockResolvedValueOnce([] as never);
    prismaMock.inventoryCountEntry.findMany.mockResolvedValue([] as never);

    const response = await getStock(
      new NextRequest("http://localhost/api/admin/stock"),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.levels).toMatchObject([
      {
        itemId: "passion-fruit",
        totalQty: 0.5,
        totalStatus: "backup_order",
        fallbackThreshold: 0.75,
        statusReason: "backup_threshold",
        suggestedOrderQty: 5.5,
      },
      {
        itemId: "milk",
        totalQty: 2,
        totalStatus: "order_now",
        fallbackThreshold: 1,
        statusReason: "minimum_stock",
        suggestedOrderQty: 8,
      },
    ]);
  });

  it("includes backup shortage items and head baristas in the daily summary email flow", async () => {
    process.env.CRON_SECRET = "test-secret";
    prismaMock.inventoryItem.findMany.mockResolvedValue([
      {
        id: "passion-fruit",
        name: "Passion Fruit",
        nameAr: "باشن فروت",
        section: "syrups_sauces",
        unit: "bottle",
        unitAr: "زجاجة",
        packSize: 1,
        minimumStock: 0,
        alertLevel: 0,
        maximumStock: 6,
        backupThreshold: 1,
        preferredSupplier: "Syrups Supplier",
      },
    ] as never);
    prismaMock.stockMovement.groupBy.mockResolvedValue([
      {
        itemId: "passion-fruit",
        location: "storage",
        _sum: { quantity: 0.5 },
      },
    ] as never);
    prismaMock.inventoryCount.count.mockResolvedValue(1);
    prismaMock.stockTransfer.count.mockResolvedValue(2);
    prismaMock.wasteEntry.count.mockResolvedValue(3);
    prismaMock.user.findMany.mockResolvedValue([
      {
        email: "head@example.com",
        name: "Head Barista",
      },
    ] as never);

    const response = await getDailySummary(
      new NextRequest("http://localhost/api/cron/daily-summary", {
        headers: { authorization: "Bearer test-secret" },
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data).toMatchObject({ sent: 2, total: 2, orderNowCount: 1 });
    expect(sendDailySummaryEmail).toHaveBeenCalledWith(
      "head@example.com",
      expect.objectContaining({
        orderNow: [
          expect.objectContaining({
            name: "Passion Fruit",
            totalQty: 0.5,
            reason: "backup_threshold",
          }),
        ],
      }),
    );
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { redisGet, redisQuit, redisSet } from "@/server/cache/redis";

const syncMocks = vi.hoisted(() => ({
  syncProductsFromOdoo: vi.fn(),
}));

const nextServerMocks = vi.hoisted(() => ({
  after: vi.fn((callback: () => unknown) => callback()),
}));

vi.mock("next/server", async (importActual) => {
  const actual = await importActual<typeof import("next/server")>();
  return {
    ...actual,
    after: nextServerMocks.after,
  };
});

vi.mock("@/server/utils/syncProducts", () => ({
  syncProductsFromOdoo: syncMocks.syncProductsFromOdoo,
}));

const catalogProduct = {
  id: "p1",
  name: "Latte",
  price: 80,
  categoryId: "c1",
  category: { id: "c1", name: "Coffee" },
  available: true,
};

const catalogCategory = { id: "c1", name: "Coffee" };

async function seedPromotedCatalog(lastUpdate = new Date().toISOString()) {
  await redisSet("catalog:current", {
    products: [catalogProduct],
    categories: [catalogCategory],
    lastUpdate,
    etag: "etag-current",
  });
}

describe("catalog availability during Odoo sync", () => {
  beforeEach(async () => {
    await redisQuit();
    vi.clearAllMocks();
    syncMocks.syncProductsFromOdoo.mockResolvedValue({ success: true });
  });

  it("keeps serving the promoted catalog and refreshes in the background when invalidated", async () => {
    const { getCatalogSafe, invalidateCatalogCache } =
      await import("@/server/services/product.service");

    await seedPromotedCatalog("2026-05-04T00:00:00.000Z");
    await redisSet("products:all", [catalogProduct]);
    await redisSet("categories:list", [catalogCategory]);
    await redisSet("sync:last_update", "2026-05-04T00:00:00.000Z");

    await invalidateCatalogCache();

    const catalog = await getCatalogSafe();

    expect(catalog.products).toEqual([catalogProduct]);
    expect(catalog.categories).toEqual([catalogCategory]);
    expect(catalog.lastUpdate).toBeNull();
    expect(syncMocks.syncProductsFromOdoo).toHaveBeenCalledWith({
      bypassCircuitBreaker: false,
    });
    expect(await redisGet("products:all")).toEqual([catalogProduct]);
    expect(await redisGet("categories:list")).toEqual([catalogCategory]);
    expect(await redisGet("catalog:current")).toMatchObject({
      products: [catalogProduct],
      categories: [catalogCategory],
    });
  });

  it("does not refresh when the promoted catalog still has a fresh timestamp", async () => {
    const { getCatalogSafe } =
      await import("@/server/services/product.service");
    const freshTimestamp = new Date().toISOString();

    await seedPromotedCatalog("2026-05-04T00:00:00.000Z");
    await redisSet("sync:last_update", freshTimestamp);

    const catalog = await getCatalogSafe();

    expect(catalog.products).toEqual([catalogProduct]);
    expect(catalog.categories).toEqual([catalogCategory]);
    expect(catalog.lastUpdate).toBe(freshTimestamp);
    expect(syncMocks.syncProductsFromOdoo).not.toHaveBeenCalled();
  });

  it("falls back to legacy product and category keys before a promoted snapshot exists", async () => {
    const { getCatalogSafe } =
      await import("@/server/services/product.service");

    await redisSet("products:all", [catalogProduct]);
    await redisSet("categories:list", [catalogCategory]);
    await redisSet("sync:last_update", new Date().toISOString());

    const catalog = await getCatalogSafe();

    expect(catalog.products).toEqual([catalogProduct]);
    expect(catalog.categories).toEqual([catalogCategory]);
    expect(syncMocks.syncProductsFromOdoo).not.toHaveBeenCalled();
  });

  it("uses direct Odoo fallback data when Redis writes fail during a cold start", async () => {
    const { getCatalogSafe } =
      await import("@/server/services/product.service");

    syncMocks.syncProductsFromOdoo.mockResolvedValueOnce({
      success: true,
      data: {
        fallbackCatalog: {
          products: [catalogProduct],
          categories: [catalogCategory],
          lastUpdate: "2026-05-04T01:00:00.000Z",
        },
      },
    });

    const catalog = await getCatalogSafe();

    expect(catalog.products).toEqual([catalogProduct]);
    expect(catalog.categories).toEqual([catalogCategory]);
    expect(catalog.lastUpdate).toBe("2026-05-04T01:00:00.000Z");
  });
});

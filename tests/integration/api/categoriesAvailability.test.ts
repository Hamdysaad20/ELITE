import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { apiCache } from "@/lib/apiCache";

const productServiceMocks = vi.hoisted(() => ({
  getCatalogSafe: vi.fn(),
}));

vi.mock("@/server/services/product.service", () => ({
  getCatalogSafe: productServiceMocks.getCatalogSafe,
}));

describe("categories API availability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiCache.clear();
  });

  it("returns an empty successful category list when the safe catalog loader fails on cold start", async () => {
    const { GET } = await import("@/app/api/categories/route");
    productServiceMocks.getCatalogSafe.mockRejectedValueOnce(
      new Error("Failed to sync catalog and no cached data available"),
    );

    const response = await GET(
      new NextRequest("http://localhost/api/categories"),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data).toEqual({ categories: [], lastUpdate: null });
  });

  it("filters excluded categories from the safe catalog response", async () => {
    const { GET } = await import("@/app/api/categories/route");
    productServiceMocks.getCatalogSafe.mockResolvedValueOnce({
      products: [],
      categories: [
        { id: "coffee", name: "Coffee" },
        { id: "extras", name: "Extras" },
      ],
      lastUpdate: "2026-05-04T10:00:00.000Z",
    });

    const response = await GET(
      new NextRequest("http://localhost/api/categories"),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data).toEqual({
      categories: [{ id: "coffee", name: "Coffee" }],
      lastUpdate: "2026-05-04T10:00:00.000Z",
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/cart/route";
import { NextRequest } from "next/server";

// Isolate internal auth sessions protecting API flows securely
vi.mock("@/server/auth/session", () => ({
  getAuthUser: vi.fn().mockResolvedValue({ id: "mock_user_123" }),
}));

describe("API Integrations: Cart Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should successfully retrieve Cart JSON aggregates resolving 200 OK structures natively", async () => {

    // Inject Mock Next.js 14 Request parameters
    const mockRequest = new NextRequest("http://localhost/api/cart", {
      method: "GET",
      headers: new Headers({
        "x-forwarded-for": "127.0.0.1", // Standard intercept logic checking rate limit
      }),
    });

    // Directly evaluate the Next.js exported Route execution without HTTP wrappers
    const response = await GET(mockRequest);
    const payload = await response.json();

    // Verify 200 architectures
    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);

    // Evaluate Data Structure mappings mapped accurately to Database results natively
    expect(payload.data.cart.items).toBeInstanceOf(Array);
    expect(payload.data.totals.subtotal).toBeDefined();
    expect(payload.data.totals.tax).toBeDefined();
    expect(payload.data.totals.total).toBeDefined();
    expect(payload.data.totals.itemCount).toBeDefined();
  });
});

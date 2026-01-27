/**
 * Unit tests for Item Availability Notifications API endpoint
 * Tests /api/notify/item-availability route
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "../src/server/db/client";
import { POST } from "../src/app/api/notify/item-availability/route";

// Mock next-auth - will be updated in beforeEach with real user ID
let mockGetServerSession: ReturnType<typeof vi.fn>;

vi.mock("next-auth", () => {
  const mockSessionFn = vi.fn();
  return {
    getServerSession: mockSessionFn,
    authOptions: {},
  };
});

// Mock the auth module
vi.mock("@/server/auth", () => ({
  authOptions: {
    providers: [],
    adapter: null,
  },
}));

describe("Item Availability Notifications API", () => {
  let testUser: { id: string; email: string; name: string | null };
  let testProduct1: { id: string; name: string };
  let testProduct2: { id: string; name: string };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: `test-api-${Date.now()}@example.com`,
        name: "Test API User",
      },
    });

    // Create test products
    // Use modulo to ensure odooId fits in INT4 (max 2,147,483,647)
    const timestamp = Date.now();
    testProduct1 = await prisma.product.create({
      data: {
        id: `api-product-1-${timestamp}`,
        name: "Test Espresso",
        price: 25.0,
        odooId: 5000000 + (timestamp % 1000000),
      },
    });

    testProduct2 = await prisma.product.create({
      data: {
        id: `api-product-2-${timestamp}`,
        name: "Test Cappuccino",
        price: 30.0,
        odooId: 6000000 + (timestamp % 1000000),
      },
    });

    // Update mock to use real user ID
    const { getServerSession } = await import("next-auth");
    mockGetServerSession = vi.mocked(getServerSession);
    mockGetServerSession.mockResolvedValue({
      user: {
        id: testUser.id,
        email: testUser.email,
        name: testUser.name || undefined,
      },
    } as any);
  });

  afterEach(async () => {
    // Clean up test data (handle cases where products might not exist)
    try {
      if (testUser?.id) {
        await prisma.itemAvailabilityNotification.deleteMany({
          where: {
            userId: testUser.id,
          },
        });
      }

      if (testProduct1?.id && testProduct2?.id) {
        await prisma.product.deleteMany({
          where: {
            id: { in: [testProduct1.id, testProduct2.id] },
          },
        });
      }

      if (testUser?.id) {
        await prisma.user.delete({
          where: { id: testUser.id },
        });
      }
    } catch (error) {
      // Ignore cleanup errors
      console.warn("Cleanup error (ignored):", error);
    }
  });

  describe("POST /api/notify/item-availability", () => {
    it("should create notifications for valid productIds", async () => {
      const request = new NextRequest("http://localhost/api/notify/item-availability", {
        method: "POST",
        body: JSON.stringify({
          productIds: [testProduct1.id, testProduct2.id],
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.created).toBe(2);

      // Verify notifications were created
      const notifications = await prisma.itemAvailabilityNotification.findMany({
        where: { userId: testUser.id },
      });

      expect(notifications).toHaveLength(2);
      expect(notifications.map((n) => n.productId)).toContain(testProduct1.id);
      expect(notifications.map((n) => n.productId)).toContain(testProduct2.id);
    });

    it("should return 401 for unauthenticated requests", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest("http://localhost/api/notify/item-availability", {
        method: "POST",
        body: JSON.stringify({
          productIds: [testProduct1.id],
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("UNAUTHORIZED");
    });

    it("should return 400 for empty productIds array", async () => {
      const request = new NextRequest("http://localhost/api/notify/item-availability", {
        method: "POST",
        body: JSON.stringify({
          productIds: [],
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("No items to register for notification");
    });

    it("should return 400 for missing productIds", async () => {
      const request = new NextRequest("http://localhost/api/notify/item-availability", {
        method: "POST",
        body: JSON.stringify({}),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("No items to register for notification");
    });

    it("should return 400 for invalid request body", async () => {
      const request = new NextRequest("http://localhost/api/notify/item-availability", {
        method: "POST",
        body: "invalid json",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid request body");
    });

    it("should skip duplicates (idempotent)", async () => {
      // Create first notification
      await prisma.itemAvailabilityNotification.create({
        data: {
          userId: testUser.id,
          productId: testProduct1.id,
        },
      });

      const request = new NextRequest("http://localhost/api/notify/item-availability", {
        method: "POST",
        body: JSON.stringify({
          productIds: [testProduct1.id, testProduct2.id],
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.created).toBe(1); // Only the new one

      // Verify we still have 2 total
      const notifications = await prisma.itemAvailabilityNotification.findMany({
        where: { userId: testUser.id },
      });

      expect(notifications).toHaveLength(2);
    });

    it("should handle single productId", async () => {
      const request = new NextRequest("http://localhost/api/notify/item-availability", {
        method: "POST",
        body: JSON.stringify({
          productIds: [testProduct1.id],
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.created).toBe(1);
    });

    it("should handle large number of productIds", async () => {
      // Create many products (reduced from 50 to 10 for faster tests)
      const productIds: string[] = [];
      const baseTimestamp = Date.now();
      for (let i = 0; i < 10; i++) {
        const product = await prisma.product.create({
          data: {
            id: `bulk-product-${i}-${baseTimestamp}`,
            name: `Product ${i}`,
            price: 25.0,
            odooId: 7000000 + i + (baseTimestamp % 1000000),
          },
        });
        productIds.push(product.id);
      }

      const request = new NextRequest("http://localhost/api/notify/item-availability", {
        method: "POST",
        body: JSON.stringify({
          productIds,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.created).toBe(10);

      // Clean up
      await prisma.itemAvailabilityNotification.deleteMany({
        where: { userId: testUser.id },
      });
      await prisma.product.deleteMany({
        where: { id: { in: productIds } },
      });
    }, 15000); // Increase timeout for bulk operations

    it("should return 500 on database error", async () => {
      // Mock prisma to throw error
      const createManySpy = vi
        .spyOn(prisma.itemAvailabilityNotification, "createMany")
        .mockRejectedValue(new Error("Database error"));

      const request = new NextRequest("http://localhost/api/notify/item-availability", {
        method: "POST",
        body: JSON.stringify({
          productIds: [testProduct1.id],
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");

      // Restore
      createManySpy.mockRestore();
    });
  });
});

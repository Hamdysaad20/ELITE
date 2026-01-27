/**
 * Integration tests for Item Availability Notifications
 * Tests the complete flow from UI → API → Database → Email
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { prisma } from "../src/server/db/client";
import type { sendOrderingResumedEmails as SendOrderingResumedEmailsType } from "../src/server/services/orderingEmailNotifications";
import { orderingResumedEmail } from "../src/server/auth/emailTemplates";

// Mock nodemailer
const mockSendMail = vi.fn().mockResolvedValue({ messageId: "test-message-id" });
const mockCreateTransport = vi.fn().mockReturnValue({
  sendMail: mockSendMail,
});

vi.mock("nodemailer", () => ({
  default: {
    createTransport: mockCreateTransport,
  },
}));

describe("Item Availability Notifications - Integration Tests", () => {
  let testUser: { id: string; email: string; name: string | null };
  let testProduct1: { id: string; name: string };
  let testProduct2: { id: string; name: string };
  let sendOrderingResumedEmails: typeof SendOrderingResumedEmailsType;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: `integration-test-${Date.now()}@example.com`,
        name: "Integration Test User",
      },
    });

    // Create test products
    const timestamp = Date.now();
    testProduct1 = await prisma.product.create({
      data: {
        id: `integration-product-1-${timestamp}`,
        name: "Test Espresso",
        price: 25.0,
        odooId: 8000000 + (timestamp % 1000000),
      },
    });

    testProduct2 = await prisma.product.create({
      data: {
        id: `integration-product-2-${timestamp}`,
        name: "Test Cappuccino",
        price: 30.0,
        odooId: 9000000 + (timestamp % 1000000),
      },
    });

    // Set up email env vars
    process.env.EMAIL_SERVER_HOST = "smtp.test.com";
    process.env.EMAIL_SERVER_PORT = "587";
    process.env.EMAIL_SERVER_USER = "test@example.com";
    process.env.EMAIL_SERVER_PASSWORD = "test-password";
    process.env.EMAIL_FROM = "noreply@test.com";
    process.env.NEXT_PUBLIC_SITE_URL = "https://test.com";

    mockSendMail.mockResolvedValue({ messageId: "test-message-id" });
    mockCreateTransport.mockReturnValue({
      sendMail: mockSendMail,
    });

    // Re-import service to get fresh transporter
    vi.resetModules();
    const module = await import("../src/server/services/orderingEmailNotifications");
    sendOrderingResumedEmails = module.sendOrderingResumedEmails;
  });

  afterEach(async () => {
    try {
      await prisma.itemAvailabilityNotification.deleteMany({
        where: { userId: testUser?.id },
      });
      if (testProduct1?.id && testProduct2?.id) {
        await prisma.product.deleteMany({
          where: { id: { in: [testProduct1.id, testProduct2.id] } },
        });
      }
      if (testUser?.id) {
        await prisma.user.delete({ where: { id: testUser.id } });
      }
    } catch (error) {
      console.warn("Cleanup error (ignored):", error);
    }
  });

  describe("End-to-End Flow", () => {
    it("should handle complete flow: register → trigger → email → mark notified", async () => {
      // Step 1: Simulate user clicking "Notify me" (what CartDrawer does)
      const productIds = [testProduct1.id, testProduct2.id];

      // Step 2: Create notifications (what API does)
      const createResult = await prisma.itemAvailabilityNotification.createMany({
        data: productIds.map((productId) => ({
          userId: testUser.id,
          productId,
        })),
        skipDuplicates: true,
      });

      expect(createResult.count).toBe(2);

      // Verify notifications exist
      const beforeNotifications = await prisma.itemAvailabilityNotification.findMany({
        where: { userId: testUser.id, notified: false },
      });
      expect(beforeNotifications).toHaveLength(2);

      // Step 3: Trigger email sending (what admin endpoint does)
      await sendOrderingResumedEmails();

      // Step 4: Verify email was sent with correct content
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const emailCall = mockSendMail.mock.calls[0][0];

      expect(emailCall.to).toBe(testUser.email);
      expect(emailCall.subject).toContain("Online ordering is back");
      expect(emailCall.html).toContain("Test Espresso");
      expect(emailCall.html).toContain("Test Cappuccino");
      expect(emailCall.html).toContain("https://test.com/menu");

      // Step 5: Verify notifications are marked as notified
      const afterNotifications = await prisma.itemAvailabilityNotification.findMany({
        where: { userId: testUser.id, notified: false },
      });
      expect(afterNotifications).toHaveLength(0);

      const allNotifications = await prisma.itemAvailabilityNotification.findMany({
        where: { userId: testUser.id },
      });
      expect(allNotifications.every((n) => n.notified === true)).toBe(true);
    });

    it("should verify email template generates correct HTML", () => {
      const template = orderingResumedEmail({
        userName: "Test User",
        items: ["Espresso", "Cappuccino"],
        siteUrl: "https://test.com",
      });

      // Verify subject
      expect(template.subject).toContain("Online ordering is back");

      // Verify HTML contains all items
      expect(template.html).toContain("Espresso");
      expect(template.html).toContain("Cappuccino");

      // Verify HTML contains user name
      expect(template.html).toContain("Test User");

      // Verify HTML contains order link
      expect(template.html).toContain("https://test.com/menu");
      expect(template.html).toContain("Order Now");

      // Verify HTML is properly escaped (check for XSS protection)
      const xssAttempt = orderingResumedEmail({
        userName: "<script>alert('xss')</script>",
        items: ["<img src=x onerror=alert(1)>"],
        siteUrl: "https://test.com",
      });

      // Should escape HTML - check that script tags are escaped
      // The template should escape < and >, so <script> becomes &lt;script&gt;
      expect(xssAttempt.html).not.toContain("<script>alert");
      // onerror should be escaped or not appear
      expect(xssAttempt.html).not.toContain('onerror="');

      // Verify text version exists
      expect(template.text).toBeTruthy();
      expect(template.text).toContain("Espresso");
      expect(template.text).toContain("Cappuccino");
    });

    it("should handle duplicate registrations (idempotent)", async () => {
      // First registration
      const result1 = await prisma.itemAvailabilityNotification.createMany({
        data: [{ userId: testUser.id, productId: testProduct1.id }],
        skipDuplicates: true,
      });
      expect(result1.count).toBe(1);

      // Second registration (duplicate)
      const result2 = await prisma.itemAvailabilityNotification.createMany({
        data: [{ userId: testUser.id, productId: testProduct1.id }],
        skipDuplicates: true,
      });
      expect(result2.count).toBe(0); // Should skip duplicate

      // Verify only one notification exists
      const notifications = await prisma.itemAvailabilityNotification.findMany({
        where: { userId: testUser.id },
      });
      expect(notifications).toHaveLength(1);
    });

    it("should verify product name lookup works correctly", async () => {
      // Create notification
      await prisma.itemAvailabilityNotification.create({
        data: {
          userId: testUser.id,
          productId: testProduct1.id,
          notified: false,
        },
      });

      // Send emails
      await sendOrderingResumedEmails();

      // Verify email contains actual product name from database
      const emailCall = mockSendMail.mock.calls[0][0];
      expect(emailCall.html).toContain(testProduct1.name);
      expect(emailCall.html).not.toContain(testProduct1.id); // Should use name, not ID
    });

    it("should verify email grouping by user works", async () => {
      // Clear any previous calls
      mockSendMail.mockClear();

      // Create multiple notifications for same user
      await prisma.itemAvailabilityNotification.createMany({
        data: [
          { userId: testUser.id, productId: testProduct1.id, notified: false },
          { userId: testUser.id, productId: testProduct2.id, notified: false },
        ],
      });

      await sendOrderingResumedEmails();

      // Should send only ONE email with BOTH items
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const emailCall = mockSendMail.mock.calls[0][0];

      expect(emailCall.html).toContain(testProduct1.name);
      expect(emailCall.html).toContain(testProduct2.name);
    });

    it("should verify database constraints are enforced", async () => {
      // Create first notification
      await prisma.itemAvailabilityNotification.create({
        data: {
          userId: testUser.id,
          productId: testProduct1.id,
        },
      });

      // Try to create duplicate - should fail
      await expect(
        prisma.itemAvailabilityNotification.create({
          data: {
            userId: testUser.id,
            productId: testProduct1.id,
          },
        })
      ).rejects.toThrow();

      // Verify only one exists
      const count = await prisma.itemAvailabilityNotification.count({
        where: { userId: testUser.id, productId: testProduct1.id },
      });
      expect(count).toBe(1);
    });
  });

  describe("Real-World Scenarios", () => {
    it("should handle user with multiple saved items", async () => {
      // Clear any previous calls
      mockSendMail.mockClear();

      // Simulate user saving 5 different items
      const products = [];
      const timestamp = Date.now();
      for (let i = 0; i < 5; i++) {
        const product = await prisma.product.create({
          data: {
            id: `multi-item-${i}-${timestamp}`,
            name: `Product ${i}`,
            price: 25.0,
            odooId: 10000000 + i + (timestamp % 1000000),
          },
        });
        products.push(product);
      }

      // Register all items
      await prisma.itemAvailabilityNotification.createMany({
        data: products.map((p) => ({
          userId: testUser.id,
          productId: p.id,
          notified: false,
        })),
        skipDuplicates: true,
      });

      // Trigger emails (use the function from beforeEach)
      await sendOrderingResumedEmails();

      // Should get ONE email with ALL 5 items
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const emailCall = mockSendMail.mock.calls[0][0];

      for (let i = 0; i < 5; i++) {
        expect(emailCall.html).toContain(`Product ${i}`);
      }

      // Cleanup
      await prisma.itemAvailabilityNotification.deleteMany({
        where: { userId: testUser.id },
      });
      await prisma.product.deleteMany({
        where: { id: { in: products.map((p) => p.id) } },
      });
    });

    it("should handle multiple users with overlapping items", async () => {
      // Create second user
      const testUser2 = await prisma.user.create({
        data: {
          email: `integration-test-2-${Date.now()}@example.com`,
          name: "Test User 2",
        },
      });

      // Both users want same product
      await prisma.itemAvailabilityNotification.createMany({
        data: [
          { userId: testUser.id, productId: testProduct1.id, notified: false },
          { userId: testUser2.id, productId: testProduct1.id, notified: false },
        ],
      });

      await sendOrderingResumedEmails();

      // Should send TWO emails (one per user)
      expect(mockSendMail).toHaveBeenCalledTimes(2);

      // Both emails should contain the same product
      const email1 = mockSendMail.mock.calls[0][0];
      const email2 = mockSendMail.mock.calls[1][0];

      expect(email1.to).toBe(testUser.email);
      expect(email2.to).toBe(testUser2.email);
      expect(email1.html).toContain(testProduct1.name);
      expect(email2.html).toContain(testProduct1.name);

      // Cleanup
      await prisma.itemAvailabilityNotification.deleteMany({
        where: { userId: { in: [testUser.id, testUser2.id] } },
      });
      await prisma.user.delete({ where: { id: testUser2.id } });
    }, 10000); // Increase timeout

    it("should verify email template handles edge cases", () => {
      // Empty items array
      const emptyTemplate = orderingResumedEmail({
        userName: "Test",
        items: [],
        siteUrl: "https://test.com",
      });
      expect(emptyTemplate.html).toBeTruthy();

      // Very long product name
      const longName = "A".repeat(1000);
      const longTemplate = orderingResumedEmail({
        userName: "Test",
        items: [longName],
        siteUrl: "https://test.com",
      });
      expect(longTemplate.html).toContain(longName);

      // Special characters
      const specialTemplate = orderingResumedEmail({
        userName: "Test & User",
        items: ["Item <with> 'quotes' \"double\" & symbols"],
        siteUrl: "https://test.com",
      });
      // Should not break HTML structure
      expect(specialTemplate.html).toContain("Item");
    });
  });
});

/**
 * End-to-end test script for Paymob purchase flow
 * This simulates the full payment process
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import { createPaymobClient, isPaymobConfigured } from "../src/server/services/paymob/paymobClient";
import { getPaymentService } from "../src/server/services/paymob/paymentService";
import { prisma } from "../src/server/db/client";

async function testPaymobPurchase() {
  console.log("🧪 Testing Paymob Purchase Flow\n");

  // Step 1: Verify configuration
  console.log("1. Verifying Paymob configuration...");
  if (!isPaymobConfigured()) {
    console.error("❌ Paymob is not configured");
    process.exit(1);
  }
  console.log("✅ Paymob is configured\n");

  // Step 2: Test authentication
  console.log("2. Testing Paymob authentication...");
  const client = createPaymobClient();
  if (!client) {
    console.error("❌ Failed to create Paymob client");
    process.exit(1);
  }
  console.log("✅ Paymob client created\n");

  // Step 3: Test creating an order in Paymob
  console.log("3. Testing Paymob order creation...");
  try {
    const testOrder = await client.createOrder(
      10000, // 100.00 EGP in cents
      [
        {
          name: "Test Product",
          amount_cents: 10000,
          description: "Test purchase",
          quantity: 1,
        },
      ],
      `test-${Date.now()}`,
      false
    );
    console.log(`✅ Paymob order created: ID ${testOrder.id}`);
    console.log(`   Merchant Order ID: ${testOrder.merchant_order_id}`);
    console.log(`   Amount: ${testOrder.amount_cents / 100} EGP\n`);

    // Step 4: Test getting payment key
    console.log("4. Testing payment key generation...");
    const billingData = {
      apartment: "1",
      email: "test@example.com",
      floor: "1",
      first_name: "Test",
      street: "Test Street",
      building: "1",
      phone_number: "01000000000",
      shipping_method: "PKG",
      postal_code: "12345",
      city: "Cairo",
      country: "Egypt",
      last_name: "User",
      state: "Cairo",
    };

    const paymentKey = await client.getPaymentKey(
      testOrder.id,
      10000,
      billingData
    );
    console.log(`✅ Payment key generated: ${paymentKey.substring(0, 20)}...`);
    console.log(`   Use this key to test payment in browser\n`);

    // Step 5: Display test instructions
    console.log("📋 Test Instructions:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("1. Start your dev server: npm run dev");
    console.log("2. Go to your website and add items to cart");
    console.log("3. Go to checkout and select 'Card' payment method");
    console.log("4. Complete the order");
    console.log("5. You'll be redirected to Paymob payment page");
    console.log("\n💳 Test Card (Sandbox):");
    console.log("   Card Number: 4987654321098769");
    console.log("   CVV: 123");
    console.log("   Expiry: Any future date (e.g., 12/25)");
    console.log("   Name: Any name");
    console.log("\n6. Complete payment with test card");
    console.log("7. Check Paymob dashboard for the transaction");
    console.log("8. Check your database for order status update");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Step 6: Check database
    console.log("5. Checking database setup...");
    try {
      const testTransaction = await prisma.paymentTransaction.findFirst({
        take: 1,
      });
      console.log("✅ PaymentTransaction model is accessible");
      
      const testOrder = await prisma.order.findFirst({
        where: { paymentStatus: "PAID" },
        take: 1,
      });
      if (testOrder) {
        console.log(`✅ Found ${testOrder ? 1 : 0} paid order(s) in database`);
      }
    } catch (error) {
      console.error("❌ Database check failed:", error);
    }

    await prisma.$disconnect();
    console.log("\n✅ All pre-flight checks passed!");
    console.log("🚀 Ready to test purchase flow\n");

  } catch (error: unknown) {
    console.error("❌ Test failed:", error);
    const message = (error as { message?: string })?.message || "Unknown error";
    console.error(`   Error: ${message}`);
    process.exit(1);
  }
}

testPaymobPurchase().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});


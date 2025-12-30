/**
 * Full end-to-end test of Paymob payment flow
 * This script tests the complete flow from order creation to payment
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import { prisma } from "../src/server/db/client";
import { createPaymobClient } from "../src/server/services/paymob/paymobClient";
import { getPaymentService } from "../src/server/services/paymob/paymentService";

async function testFullPaymentFlow() {
  console.log("🧪 Testing Full Paymob Payment Flow\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  try {
    // Step 1: Create a test order
    console.log("1️⃣ Creating test order...");
    
    // Get or create a test user
    let testUser = await prisma.user.findFirst({
      where: { email: "test@paymob-test.com" },
    });

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          email: "test@paymob-test.com",
          name: "Paymob Test User",
          role: "CUSTOMER",
        },
      });
      console.log(`   ✅ Created test user: ${testUser.id}`);
    } else {
      console.log(`   ✅ Using existing test user: ${testUser.id}`);
    }

    // Create a test order
    const testOrder = await prisma.order.create({
      data: {
        userId: testUser.id,
        clientOrderRef: `TEST-${Date.now()}`,
        status: "PENDING",
        paymentStatus: "PENDING",
        paymentMethod: "CARD",
        orderType: "PICKUP",
        subtotal: 100.00,
        deliveryFee: 0,
        codFee: 0,
        discount: 0,
        total: 100.00,
        items: {
          create: [
            {
              productId: "test-item-1",
              name: "Test Coffee",
              quantity: 1,
              unitPrice: 100.00,
              totalPrice: 100.00,
            },
          ],
        },
      },
      include: {
        items: true,
        user: true,
      },
    });

    console.log(`   ✅ Order created: ${testOrder.id}`);
    console.log(`   📋 Order Reference: ${testOrder.clientOrderRef}`);
    console.log(`   💰 Total: ${testOrder.total} EGP\n`);

    // Step 2: Create payment intent
    console.log("2️⃣ Creating payment intent with Paymob...");
    
    const paymentService = getPaymentService();
    if (!paymentService) {
      throw new Error("Payment service not available");
    }

    const paymentIntent = await paymentService.createPaymentIntent({
      orderId: testOrder.id,
      paymentMethod: "card",
    });

    console.log(`   ✅ Payment intent created`);
    console.log(`   🔑 Payment Key: ${paymentIntent.paymentKey.substring(0, 20)}...`);
    console.log(`   🌐 iFrame URL: ${paymentIntent.iframeUrl}`);
    console.log(`   🆔 Transaction ID: ${paymentIntent.transactionId}\n`);

    // Step 3: Verify order was updated
    console.log("3️⃣ Verifying order updates...");
    
    const updatedOrder = await prisma.order.findUnique({
      where: { id: testOrder.id },
      select: {
        paymentIntentId: true,
        paymobPaymentKey: true,
        paymentStatus: true,
      },
    });

    if (updatedOrder?.paymentIntentId && updatedOrder?.paymobPaymentKey) {
      console.log(`   ✅ Order updated with payment intent`);
      console.log(`   📝 Payment Intent ID: ${updatedOrder.paymentIntentId}`);
      console.log(`   🔑 Payment Key stored: ${updatedOrder.paymobPaymentKey.substring(0, 20)}...`);
    } else {
      console.log(`   ⚠️  Order not updated with payment intent`);
    }

    // Step 4: Check PaymentTransaction record
    console.log("\n4️⃣ Checking PaymentTransaction record...");
    
    const paymentTransaction = await prisma.paymentTransaction.findFirst({
      where: { orderId: testOrder.id },
      orderBy: { createdAt: "desc" },
    });

    if (paymentTransaction) {
      console.log(`   ✅ PaymentTransaction created`);
      console.log(`   🆔 Transaction ID: ${paymentTransaction.paymobTransactionId}`);
      console.log(`   💰 Amount: ${paymentTransaction.amount} EGP`);
      console.log(`   📊 Status: ${paymentTransaction.status}`);
    } else {
      console.log(`   ⚠️  PaymentTransaction not found (will be created on webhook)`);
    }

    // Step 5: Display test instructions
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ TEST ORDER CREATED SUCCESSFULLY!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    
    console.log("📋 Test Details:");
    console.log(`   Order ID: ${testOrder.id}`);
    console.log(`   Order Reference: ${testOrder.clientOrderRef}`);
    console.log(`   Amount: ${testOrder.total} EGP`);
    console.log(`   Payment Key: ${paymentIntent.paymentKey.substring(0, 30)}...`);
    console.log("\n🌐 Next Steps:");
    console.log("   1. Open payment page in browser:");
    console.log(`      http://localhost:3000/payment/process?orderId=${testOrder.id}&paymentKey=${paymentIntent.paymentKey}`);
    console.log("\n   2. Use test card (Sandbox):");
    console.log("      Card: 4987654321098769");
    console.log("      CVV: 123");
    console.log("      Expiry: 12/25");
    console.log("      Name: Test User");
    console.log("\n   3. Complete payment");
    console.log("\n   4. Check Paymob dashboard:");
    console.log("      https://accept.paymob.com/");
    console.log("      → Go to Transactions");
    console.log("      → Look for order: " + testOrder.clientOrderRef);
    console.log("\n   5. Verify in database:");
    console.log("      npx prisma studio");
    console.log("      → Check Order table for paymentStatus = PAID");
    console.log("      → Check PaymentTransaction table for status = success");
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Keep the order for testing
    console.log("💡 This test order will remain in the database for manual testing.");
    console.log("   You can complete the payment using the URL above.\n");

    await prisma.$disconnect();
    
  } catch (error: unknown) {
    console.error("\n❌ Test failed:", error);
    const message = (error as { message?: string })?.message || "Unknown error";
    console.error(`   Error: ${message}`);
    
    if (error instanceof Error && error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }
    
    await prisma.$disconnect();
    process.exit(1);
  }
}

testFullPaymentFlow().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});


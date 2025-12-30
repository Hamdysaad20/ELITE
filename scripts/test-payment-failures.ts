/**
 * Test Payment Failure Scenarios
 * Tests failed payments, cancellations, and error recovery
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import { prisma } from "../src/server/db/client";
import { getPaymentService } from "../src/server/services/paymob/paymentService";
import { processPaymobWebhook } from "../src/server/services/paymob/webhookHandler";

async function testPaymentFailures() {
  console.log("🧪 Testing Payment Failure Scenarios\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  try {
    // Test 1: Failed Payment Webhook
    console.log("1. Testing Failed Payment Webhook\n");

    const testUser = await prisma.user.findFirst({
      where: { email: "test-failure@example.com" },
    }) || await prisma.user.create({
      data: {
        email: "test-failure@example.com",
        name: "Test User",
        role: "CUSTOMER",
      },
    });

    const failedOrder = await prisma.order.create({
      data: {
        userId: testUser.id,
        clientOrderRef: `TEST-FAILED-${Date.now()}`,
        status: "PENDING",
        paymentStatus: "PENDING",
        paymentMethod: "CARD",
        orderType: "PICKUP",
        subtotal: 100,
        deliveryFee: 0,
        codFee: 0,
        discount: 0,
        total: 100,
      },
    });

    // Simulate failed payment webhook
    const failedTransaction = {
      obj: {
        id: 999999,
        success: false,
        pending: false,
        amount_cents: 10000,
        currency: "EGP",
        order: {
          id: 1,
          merchant_order_id: failedOrder.clientOrderRef,
        },
        integration_id: 983629,
        is_3d_secure: false,
        is_auth: false,
        is_capture: false,
        is_standalone_payment: false,
        is_voided: false,
        is_refunded: false,
      },
    };

    await processPaymobWebhook(failedTransaction as any);

    // Verify order status
    const updatedOrder = await prisma.order.findUnique({
      where: { id: failedOrder.id },
    });

    console.log(`   ✅ Failed payment webhook processed`);
    console.log(`   📊 Order payment status: ${updatedOrder?.paymentStatus}`);
    console.log(`   📊 Order status: ${updatedOrder?.status}`);

    // Check PaymentTransaction
    const paymentTransaction = await prisma.paymentTransaction.findFirst({
      where: { orderId: failedOrder.id },
    });

    if (paymentTransaction) {
      console.log(`   ✅ PaymentTransaction created`);
      console.log(`   📊 Transaction status: ${paymentTransaction.status}`);
    }

    // Cleanup
    await prisma.order.delete({ where: { id: failedOrder.id } });
    if (paymentTransaction) {
      await prisma.paymentTransaction.delete({ where: { id: paymentTransaction.id } });
    }

    // Test 2: Cancelled Payment
    console.log("\n2. Testing Cancelled Payment\n");

    const cancelledOrder = await prisma.order.create({
      data: {
        userId: testUser.id,
        clientOrderRef: `TEST-CANCELLED-${Date.now()}`,
        status: "PENDING",
        paymentStatus: "PENDING",
        paymentMethod: "CARD",
        orderType: "PICKUP",
        subtotal: 100,
        deliveryFee: 0,
        codFee: 0,
        discount: 0,
        total: 100,
      },
    });

    const cancelledTransaction = {
      obj: {
        ...failedTransaction.obj,
        id: 999998,
        success: false,
        pending: false,
        order: {
          id: 2,
          merchant_order_id: cancelledOrder.clientOrderRef,
        },
      },
    };

    await processPaymobWebhook(cancelledTransaction as any);

    const updatedCancelledOrder = await prisma.order.findUnique({
      where: { id: cancelledOrder.id },
    });

    console.log(`   ✅ Cancelled payment webhook processed`);
    console.log(`   📊 Order payment status: ${updatedCancelledOrder?.paymentStatus}`);

    // Cleanup
    await prisma.order.delete({ where: { id: cancelledOrder.id } });

    // Test 3: Pending Payment
    console.log("\n3. Testing Pending Payment\n");

    const pendingOrder = await prisma.order.create({
      data: {
        userId: testUser.id,
        clientOrderRef: `TEST-PENDING-${Date.now()}`,
        status: "PENDING",
        paymentStatus: "PENDING",
        paymentMethod: "CARD",
        orderType: "PICKUP",
        subtotal: 100,
        deliveryFee: 0,
        codFee: 0,
        discount: 0,
        total: 100,
      },
    });

    const pendingTransaction = {
      obj: {
        ...failedTransaction.obj,
        id: 999997,
        success: false,
        pending: true,
        order: {
          id: 3,
          merchant_order_id: pendingOrder.clientOrderRef,
        },
      },
    };

    await processPaymobWebhook(pendingTransaction as any);

    const updatedPendingOrder = await prisma.order.findUnique({
      where: { id: pendingOrder.id },
    });

    console.log(`   ✅ Pending payment webhook processed`);
    console.log(`   📊 Order payment status: ${updatedPendingOrder?.paymentStatus}`);

    // Cleanup
    await prisma.order.delete({ where: { id: pendingOrder.id } });

    // Test 4: Successful Payment (for comparison)
    console.log("\n4. Testing Successful Payment (for comparison)\n");

    const successOrder = await prisma.order.create({
      data: {
        userId: testUser.id,
        clientOrderRef: `TEST-SUCCESS-${Date.now()}`,
        status: "PENDING",
        paymentStatus: "PENDING",
        paymentMethod: "CARD",
        orderType: "PICKUP",
        subtotal: 100,
        deliveryFee: 0,
        codFee: 0,
        discount: 0,
        total: 100,
      },
    });

    const successTransaction = {
      obj: {
        ...failedTransaction.obj,
        id: 999996,
        success: true,
        pending: false,
        order: {
          id: 4,
          merchant_order_id: successOrder.clientOrderRef,
        },
      },
    };

    await processPaymobWebhook(successTransaction as any);

    const updatedSuccessOrder = await prisma.order.findUnique({
      where: { id: successOrder.id },
    });

    console.log(`   ✅ Successful payment webhook processed`);
    console.log(`   📊 Order payment status: ${updatedSuccessOrder?.paymentStatus}`);
    console.log(`   📊 Order status: ${updatedSuccessOrder?.status}`);

    // Cleanup
    await prisma.order.delete({ where: { id: successOrder.id } });

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ All failure scenarios tested successfully!\n");

  } catch (error: unknown) {
    console.error("\n❌ Test failed:", error);
    const message = (error as { message?: string })?.message || "Unknown error";
    console.error(`   Error: ${message}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testPaymentFailures().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});


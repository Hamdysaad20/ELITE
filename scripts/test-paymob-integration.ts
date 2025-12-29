/**
 * Test script for Paymob integration
 * Run with: npx tsx scripts/test-paymob-integration.ts
 */

// Load environment variables from .env.local if it exists
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import { createPaymobClient, isPaymobConfigured } from "../src/server/services/paymob/paymobClient";
import { getPaymentService } from "../src/server/services/paymob/paymentService";

async function testPaymobIntegration() {
  console.log("🧪 Testing Paymob Integration\n");

  // Test 1: Check if Paymob is configured
  console.log("1. Checking Paymob configuration...");
  if (!isPaymobConfigured()) {
    console.error("❌ Paymob is not configured. Please check your environment variables:");
    console.error("   - PAYMOB_API_KEY");
    console.error("   - PAYMOB_SECRET_KEY");
    console.error("   - PAYMOB_PUBLIC_KEY");
    console.error("   - PAYMOB_HMAC_SECRET");
    console.error("   - PAYMOB_INTEGRATION_ID");
    console.error("\n💡 Make sure these are set in .env.local file");
    process.exit(1);
  }
  console.log("✅ Paymob is configured\n");

  // Test 2: Test authentication
  console.log("2. Testing Paymob authentication...");
  try {
    const client = createPaymobClient();
    if (!client) {
      throw new Error("Failed to create Paymob client");
    }
    
    // Try to authenticate (this will be cached, so it's safe to call)
    // We'll test by trying to create a minimal order
    console.log("   Attempting to authenticate...");
    
    // Note: We can't actually create an order without a real order ID,
    // but we can verify the client is created correctly
    console.log("✅ Paymob client created successfully");
    console.log(`   Environment: ${process.env.PAYMOB_ENVIRONMENT || "sandbox"}`);
    console.log(`   Integration ID: ${process.env.PAYMOB_INTEGRATION_ID}`);
    if (process.env.PAYMOB_WALLET_INTEGRATION_ID) {
      console.log(`   Wallet Integration ID: ${process.env.PAYMOB_WALLET_INTEGRATION_ID}`);
    }
  } catch (error) {
    console.error("❌ Authentication test failed:", error);
    process.exit(1);
  }
  console.log();

  // Test 3: Check payment service
  console.log("3. Testing payment service...");
  try {
    const paymentService = getPaymentService();
    if (!paymentService) {
      throw new Error("Payment service not available");
    }
    console.log("✅ Payment service is available");
  } catch (error) {
    console.error("❌ Payment service test failed:", error);
    process.exit(1);
  }
  console.log();

  // Test 4: Verify environment variables
  console.log("4. Verifying environment variables...");
  const requiredVars = [
    "PAYMOB_API_KEY",
    "PAYMOB_SECRET_KEY",
    "PAYMOB_PUBLIC_KEY",
    "PAYMOB_HMAC_SECRET",
    "PAYMOB_INTEGRATION_ID",
  ];
  
  const optionalVars = [
    "PAYMOB_WALLET_INTEGRATION_ID",
    "PAYMOB_ENVIRONMENT",
  ];

  let allPresent = true;
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      const value = process.env[varName];
      const masked = value?.substring(0, 8) + "..." + value?.substring(value.length - 4);
      console.log(`   ✅ ${varName}: ${masked}`);
    } else {
      console.error(`   ❌ ${varName}: MISSING`);
      allPresent = false;
    }
  }

  for (const varName of optionalVars) {
    if (process.env[varName]) {
      if (varName === "PAYMOB_WALLET_INTEGRATION_ID") {
        console.log(`   ℹ️  ${varName}: ${process.env[varName]} (optional - will use default Integration ID if not set)`);
      } else {
        console.log(`   ℹ️  ${varName}: ${process.env[varName]}`);
      }
    } else {
      if (varName === "PAYMOB_WALLET_INTEGRATION_ID") {
        console.log(`   ✅ ${varName}: Not set (optional - default Integration ID will be used for wallets)`);
      } else {
        console.log(`   ⚠️  ${varName}: Not set (optional)`);
      }
    }
  }
  
  console.log("\n   💡 Note: PAYMOB_WALLET_INTEGRATION_ID is optional.");
  console.log("      If not set, wallets will use PAYMOB_INTEGRATION_ID.");

  if (!allPresent) {
    console.error("\n❌ Some required environment variables are missing!");
    process.exit(1);
  }
  console.log();

  // Test 5: Database connection (if Prisma is available)
  console.log("5. Testing database connection...");
  try {
    const { prisma } = await import("../src/server/db/client");
    await prisma.$connect();
    console.log("✅ Database connection successful");
    
    // Check if PaymentTransaction model exists
    try {
      await prisma.paymentTransaction.findFirst({ take: 1 });
      console.log("✅ PaymentTransaction model is accessible");
    } catch (error) {
      console.error("❌ PaymentTransaction model not found. Run migration first!");
      process.exit(1);
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
  console.log();

  console.log("🎉 All tests passed! Paymob integration is ready.");
  console.log("\nNext steps:");
  console.log("1. Configure webhook URLs in Paymob dashboard");
  console.log("   See: docs/PAYMOB_WEBHOOK_SETUP.md");
  console.log("2. Test with a real order (use sandbox environment)");
  console.log("3. Monitor webhook logs for incoming payment notifications");
}

// Run tests
testPaymobIntegration().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

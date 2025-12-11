import { config } from "dotenv";
import { prisma } from "@/server/db/client";
import { createOdooClient } from "@/server/utils/odooClient";
import { awardOrderPoints } from "@/server/services/loyalty";

// Load environment variables
config();

/**
 * Comprehensive Integration Test Suite for Odoo Sync
 * Tests all sync features end-to-end
 */

// Color codes for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[36m",
  magenta: "\x1b[35m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log("\n" + "=".repeat(60));
  log(title, "magenta");
  console.log("=".repeat(60));
}

function logTest(testName: string) {
  log(`\n🧪 Testing: ${testName}`, "blue");
}

function logSuccess(message: string) {
  log(`✅ ${message}`, "green");
}

function logError(message: string) {
  log(`❌ ${message}`, "red");
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, "yellow");
}

// Test data
const testUser = {
  email: `test-${Date.now()}@elite-test.com`,
  name: "Elite Test User",
  phone: "+201234567890",
};

const testAddress = {
  label: "Home",
  street: "123 Test Street",
  apartment: "Apt 4B",
  city: "Cairo",
  state: "Cairo Governorate",
  zipCode: "11511",
  country: "Egypt",
  phone: "+201234567890",
  notes: "Ring doorbell twice",
};

let testUserId: string;
let testAddressId: string;
let testOrderId: string;
let odooPartnerId: number | null = null;

async function cleanup() {
  logSection("🧹 CLEANUP: Removing Test Data");
  
  try {
    if (testUserId) {
      // Delete in order: dependent records first
      await prisma.loyaltyLedger.deleteMany({ where: { userId: testUserId } });
      await prisma.loyaltyAccount.deleteMany({ where: { userId: testUserId } });
      await prisma.address.deleteMany({ where: { userId: testUserId } });
      
      // Delete order items first, then orders
      if (testOrderId) {
        await prisma.orderItem.deleteMany({ where: { orderId: testOrderId } });
        await prisma.order.deleteMany({ where: { id: testOrderId } });
      }
      
      // Delete auth records
      await prisma.account.deleteMany({ where: { userId: testUserId } });
      await prisma.session.deleteMany({ where: { userId: testUserId } });
      
      // Finally delete user
      await prisma.user.delete({ where: { id: testUserId } });
      
      logSuccess("Test data cleaned up from database");
    }
  } catch (error) {
    logError(`Cleanup failed: ${error}`);
  }
}

/**
 * Test 1: User Signup and Odoo Partner Creation
 */
async function testUserSignup() {
  logSection("TEST 1: User Signup & Odoo Partner Creation");
  
  try {
    // Create user in database (simulating signup)
    logTest("Creating user in database");
    const user = await prisma.user.create({
      data: {
        email: testUser.email,
        name: testUser.name,
        phone: testUser.phone,
        emailVerified: new Date(),
      },
    });
    testUserId = user.id;
    logSuccess(`User created: ${user.id}`);
    logInfo(`Email: ${user.email}`);
    logInfo(`Name: ${user.name}`);
    
    // Create loyalty account
    logTest("Creating loyalty account");
    const loyaltyAccount = await prisma.loyaltyAccount.create({
      data: {
        userId: user.id,
        points: 0,
        totalSpent: 0,
        level: "bronze",
      },
    });
    logSuccess(`Loyalty account created: ${loyaltyAccount.points} points, ${loyaltyAccount.level} tier`);
    
    // Sync to Odoo
    logTest("Syncing user to Odoo as partner");
    const odooClient = createOdooClient();
    if (!odooClient) {
      logError("Odoo client not configured - skipping Odoo tests");
      return false;
    }
    
    odooPartnerId = await odooClient.findOrCreatePartner({
      name: user.name || user.email.split('@')[0],
      email: user.email,
      phone: user.phone || undefined,
    });
    
    logSuccess(`Odoo partner created/found: ID ${odooPartnerId}`);
    
    // Verify in Odoo
    logTest("Verifying partner in Odoo");
    const partners = await odooClient.searchRead<any>(
      "res.partner",
      [["id", "=", odooPartnerId]],
      ["name", "email", "phone"]
    );
    
    if (partners && partners.length > 0) {
      logSuccess("Partner verified in Odoo:");
      logInfo(`  Name: ${partners[0].name}`);
      logInfo(`  Email: ${partners[0].email}`);
      logInfo(`  Phone: ${partners[0].phone || "Not set"}`);
      return true;
    } else {
      logError("Partner not found in Odoo");
      return false;
    }
  } catch (error) {
    logError(`Test failed: ${error}`);
    return false;
  }
}

/**
 * Test 2: Address Creation and Sync
 */
async function testAddressSync() {
  logSection("TEST 2: Address Creation & Odoo Sync");
  
  try {
    if (!testUserId) {
      logError("No test user - run testUserSignup first");
      return false;
    }
    
    // Create address
    logTest("Creating address in database");
    const address = await prisma.address.create({
      data: {
        userId: testUserId,
        ...testAddress,
        isDefault: true,
      },
    });
    testAddressId = address.id;
    logSuccess(`Address created: ${address.id}`);
    logInfo(`${address.street}, ${address.city}`);
    
    // Sync to Odoo
    logTest("Syncing address to Odoo partner");
    const odooClient = createOdooClient();
    if (!odooClient) {
      logError("Odoo client not configured");
      return false;
    }
    
    const user = await prisma.user.findUnique({ where: { id: testUserId } });
    if (!user?.email) {
      logError("User email not found");
      return false;
    }
    
    const partnerId = await odooClient.findOrCreatePartner({
      name: user.name || user.email.split('@')[0],
      email: user.email,
      phone: address.phone || undefined,
      street: `${address.street}${address.apartment ? ', ' + address.apartment : ''}`,
      city: address.city,
      zip: address.zipCode || undefined,
    });
    
    logSuccess(`Address synced to partner ID: ${partnerId}`);
    
    // Verify in Odoo
    logTest("Verifying address in Odoo");
    const partners = await odooClient.searchRead<any>(
      "res.partner",
      [["id", "=", partnerId]],
      ["name", "street", "city", "zip", "phone"]
    );
    
    if (partners && partners.length > 0) {
      logSuccess("Address verified in Odoo:");
      logInfo(`  Street: ${partners[0].street || "Not set"}`);
      logInfo(`  City: ${partners[0].city || "Not set"}`);
      logInfo(`  Zip: ${partners[0].zip || "Not set"}`);
      logInfo(`  Phone: ${partners[0].phone || "Not set"}`);
      return true;
    } else {
      logError("Address not found in Odoo");
      return false;
    }
  } catch (error) {
    logError(`Test failed: ${error}`);
    return false;
  }
}

/**
 * Test 3: Order Placement and Odoo Sync
 */
async function testOrderSync() {
  logSection("TEST 3: Order Placement & Odoo Sync");
  
  try {
    if (!testUserId || !testAddressId) {
      logError("Prerequisites not met - run previous tests first");
      return false;
    }
    
    // Create order with items
    logTest("Creating order in database");
    const order = await prisma.order.create({
      data: {
        userId: testUserId,
        addressId: testAddressId,
        status: "PENDING",
        paymentStatus: "PENDING",
        paymentMethod: "CASH",
        orderType: "DELIVERY",
        subtotal: 150,
        deliveryFee: 20,
        discount: 0,
        total: 170,
        notes: "Test order - please deliver ASAP",
        clientOrderRef: `test-${Date.now()}`,
        items: {
          create: [
            {
              productId: "test-prod-1",
              sku: "CAPPUCCINO-M",
              name: "Cappuccino Medium",
              categoryId: "hot-coffee",
              quantity: 2,
              unitPrice: 50,
              totalPrice: 100,
              attributes: { size: "medium", milk: "whole" },
            },
            {
              productId: "test-prod-2",
              sku: "CROISSANT",
              name: "Butter Croissant",
              categoryId: "pastries",
              quantity: 1,
              unitPrice: 50,
              totalPrice: 50,
              attributes: {},
            },
          ],
        },
      },
      include: {
        items: true,
        address: true,
      },
    });
    testOrderId = order.id;
    logSuccess(`Order created: ${order.id}`);
    logInfo(`Total: ${order.total} EGP`);
    logInfo(`Items: ${order.items.length}`);
    
    // Sync to Odoo
    logTest("Syncing order to Odoo (Sale Order)");
    const odooClient = createOdooClient();
    if (!odooClient) {
      logError("Odoo client not configured");
      return false;
    }
    
    const user = await prisma.user.findUnique({ where: { id: testUserId } });
    const address = await prisma.address.findUnique({ where: { id: testAddressId } });
    
    if (!user || !address) {
      logError("User or address not found");
      return false;
    }
    
    // Create sale order in Odoo
    const saleOrderId = await odooClient.createSaleOrderFromWebsiteOrder(
      order as any,
      {
        name: user.name || user.email?.split('@')[0] || "Guest",
        email: user.email || undefined,
        phone: address.phone || undefined,
        street: `${address.street}${address.apartment ? ', ' + address.apartment : ''}`,
        city: address.city,
        zip: address.zipCode || undefined,
      }
    );
    
    logSuccess(`Sale Order created in Odoo: ID ${saleOrderId}`);
    
    // Update order with Odoo IDs
    const host = process.env.ODOO_HOST;
    const odooWebUrl = `${host}/web#model=sale.order&id=${saleOrderId}`;
    
    await prisma.order.update({
      where: { id: order.id },
      data: {
        saleOrderId,
        odooWebUrl,
        odooStatusSale: "synced",
        status: "CONFIRMED",
      },
    });
    
    logSuccess(`Order updated with Odoo data`);
    logInfo(`Odoo URL: ${odooWebUrl}`);
    
    // Verify in Odoo
    logTest("Verifying sale order in Odoo");
    const saleOrders = await odooClient.searchRead<any>(
      "sale.order",
      [["id", "=", saleOrderId]],
      ["name", "partner_id", "amount_total", "state", "client_order_ref"]
    );
    
    if (saleOrders && saleOrders.length > 0) {
      logSuccess("Sale Order verified in Odoo:");
      logInfo(`  Order: ${saleOrders[0].name}`);
      logInfo(`  Partner: ${Array.isArray(saleOrders[0].partner_id) ? saleOrders[0].partner_id[1] : saleOrders[0].partner_id}`);
      logInfo(`  Amount: ${saleOrders[0].amount_total}`);
      logInfo(`  State: ${saleOrders[0].state}`);
      logInfo(`  Client Ref: ${saleOrders[0].client_order_ref}`);
      
      // Check order lines
      logTest("Verifying order lines");
      const orderLines = await odooClient.searchRead<any>(
        "sale.order.line",
        [["order_id", "=", saleOrderId]],
        ["product_id", "name", "product_uom_qty", "price_unit"]
      );
      
      if (orderLines && orderLines.length > 0) {
        logSuccess(`Found ${orderLines.length} order lines:`);
        orderLines.forEach((line: any, idx: number) => {
          logInfo(`  ${idx + 1}. ${line.name} - Qty: ${line.product_uom_qty}, Price: ${line.price_unit}`);
        });
      }
      
      return true;
    } else {
      logError("Sale Order not found in Odoo");
      return false;
    }
  } catch (error) {
    logError(`Test failed: ${error}`);
    console.error(error);
    return false;
  }
}

/**
 * Test 4: Order Status Update and Loyalty Points
 */
async function testLoyaltyPoints() {
  logSection("TEST 4: Order Status Update & Loyalty Points");
  
  try {
    if (!testOrderId || !testUserId) {
      logError("Prerequisites not met - run previous tests first");
      return false;
    }
    
    // Update order status to DELIVERED
    logTest("Updating order status to DELIVERED");
    const updatedOrder = await prisma.order.update({
      where: { id: testOrderId },
      data: {
        status: "DELIVERED",
        paymentStatus: "PAID",
      },
    });
    logSuccess(`Order status updated: ${updatedOrder.status}`);
    
    // Award loyalty points
    logTest("Awarding loyalty points");
    const result = await awardOrderPoints(testOrderId, testUserId);
    
    if (!result) {
      logError("Failed to award points");
      return false;
    }
    
    logSuccess(`Points awarded: ${result.pointsAwarded}`);
    logInfo(`New tier: ${result.newLevel}`);
    
    // Verify loyalty account
    logTest("Verifying loyalty account");
    const loyaltyAccount = await prisma.loyaltyAccount.findUnique({
      where: { userId: testUserId },
    });
    
    if (!loyaltyAccount) {
      logError("Loyalty account not found");
      return false;
    }
    
    logSuccess("Loyalty account updated:");
    logInfo(`  Points: ${loyaltyAccount.points}`);
    logInfo(`  Total Spent: ${loyaltyAccount.totalSpent} EGP`);
    logInfo(`  Tier: ${loyaltyAccount.level}`);
    
    // Verify ledger entry
    logTest("Verifying loyalty ledger");
    const ledgerEntries = await prisma.loyaltyLedger.findMany({
      where: { userId: testUserId },
      orderBy: { createdAt: "desc" },
    });
    
    if (ledgerEntries.length === 0) {
      logError("No ledger entries found");
      return false;
    }
    
    logSuccess(`Found ${ledgerEntries.length} ledger entries:`);
    ledgerEntries.forEach((entry: any, idx: number) => {
      logInfo(`  ${idx + 1}. ${entry.deltaPoints > 0 ? '+' : ''}${entry.deltaPoints} pts - ${entry.reason}`);
    });
    
    return true;
  } catch (error) {
    logError(`Test failed: ${error}`);
    console.error(error);
    return false;
  }
}

/**
 * Test 5: Profile Update and Odoo Sync
 */
async function testProfileUpdate() {
  logSection("TEST 5: Profile Update & Odoo Sync");
  
  try {
    if (!testUserId) {
      logError("No test user - run testUserSignup first");
      return false;
    }
    
    // Update user profile
    logTest("Updating user profile");
    const updatedUser = await prisma.user.update({
      where: { id: testUserId },
      data: {
        name: "Elite Test User - Updated",
        phone: "+201234567899",
      },
    });
    logSuccess(`Profile updated`);
    logInfo(`New name: ${updatedUser.name}`);
    logInfo(`New phone: ${updatedUser.phone}`);
    
    // Sync to Odoo
    logTest("Syncing profile update to Odoo");
    const odooClient = createOdooClient();
    if (!odooClient) {
      logError("Odoo client not configured");
      return false;
    }
    
    const partnerId = await odooClient.findOrCreatePartner({
      name: updatedUser.name || updatedUser.email?.split('@')[0] || "Guest",
      email: updatedUser.email || undefined,
      phone: updatedUser.phone || undefined,
    });
    
    logSuccess(`Profile synced to partner ID: ${partnerId}`);
    
    // Verify in Odoo
    logTest("Verifying profile in Odoo");
    const partners = await odooClient.searchRead<any>(
      "res.partner",
      [["id", "=", partnerId]],
      ["name", "email", "phone"]
    );
    
    if (partners && partners.length > 0) {
      logSuccess("Profile verified in Odoo:");
      logInfo(`  Name: ${partners[0].name}`);
      logInfo(`  Email: ${partners[0].email}`);
      logInfo(`  Phone: ${partners[0].phone || "Not set"}`);
      return true;
    } else {
      logError("Profile not found in Odoo");
      return false;
    }
  } catch (error) {
    logError(`Test failed: ${error}`);
    return false;
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  logSection("🚀 STARTING COMPREHENSIVE ODOO SYNC TESTS");
  
  const results = {
    userSignup: false,
    addressSync: false,
    orderSync: false,
    loyaltyPoints: false,
    profileUpdate: false,
  };
  
  try {
    // Check Odoo configuration
    const odooClient = createOdooClient();
    if (!odooClient) {
      logError("⚠️  Odoo is not configured. Set the following environment variables:");
      logError("   - ODOO_HOST");
      logError("   - ODOO_DB");
      logError("   - ODOO_USERNAME");
      logError("   - ODOO_API_KEY or ODOO_PASSWORD");
      return;
    }
    
    logSuccess("Odoo client configured successfully");
    
    // Test Odoo connection
    logTest("Testing Odoo connection");
    const pingResult = await odooClient.ping();
    logSuccess(`Connected to Odoo - User ID: ${pingResult.uid}, Partners: ${pingResult.partnerCount}`);
    
    // Run tests in sequence
    results.userSignup = await testUserSignup();
    if (results.userSignup) {
      results.addressSync = await testAddressSync();
      results.orderSync = await testOrderSync();
      results.loyaltyPoints = await testLoyaltyPoints();
      results.profileUpdate = await testProfileUpdate();
    }
    
  } catch (error) {
    logError(`Fatal error: ${error}`);
    console.error(error);
  } finally {
    // Print summary
    logSection("📊 TEST SUMMARY");
    
    const tests = [
      { name: "User Signup & Partner Creation", passed: results.userSignup },
      { name: "Address Creation & Sync", passed: results.addressSync },
      { name: "Order Placement & Sync", passed: results.orderSync },
      { name: "Loyalty Points Award", passed: results.loyaltyPoints },
      { name: "Profile Update & Sync", passed: results.profileUpdate },
    ];
    
    tests.forEach((test, idx) => {
      if (test.passed) {
        logSuccess(`${idx + 1}. ${test.name}`);
      } else {
        logError(`${idx + 1}. ${test.name}`);
      }
    });
    
    const passedCount = tests.filter(t => t.passed).length;
    const totalCount = tests.length;
    
    console.log("\n" + "=".repeat(60));
    if (passedCount === totalCount) {
      log(`🎉 ALL TESTS PASSED (${passedCount}/${totalCount})`, "green");
    } else {
      log(`⚠️  SOME TESTS FAILED (${passedCount}/${totalCount})`, "yellow");
    }
    console.log("=".repeat(60));
    
    // Cleanup
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('\n🧹 Clean up test data? (y/n): ', async (answer: string) => {
      if (answer.toLowerCase() === 'y') {
        await cleanup();
      } else {
        logInfo("Test data preserved:");
        logInfo(`  User ID: ${testUserId}`);
        logInfo(`  Order ID: ${testOrderId}`);
        logInfo(`  Odoo Partner ID: ${odooPartnerId}`);
      }
      readline.close();
      process.exit(0);
    });
  }
}

// Run tests
runAllTests().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

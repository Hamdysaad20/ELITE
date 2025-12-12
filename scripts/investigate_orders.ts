import { prisma } from "../src/server/db/client";
import { isOdooConfigured, createOdooClient } from "../src/server/utils/odooClient";
import { enqueueOrderSync } from "../src/server/services/odooSync";

const orderRefs = [
  "dcc3b677-6681-46fd-b030-13baea889927",
  "bf418f16-d134-47f7-aa88-541979996414",
];

async function investigateOrders() {
  console.log("🔍 Investigating orders and Odoo sync status...\n");

  // Check Odoo configuration
  console.log("📋 Configuration Check:");
  console.log(`  Odoo Configured: ${isOdooConfigured() ? "✅ Yes" : "❌ No"}`);
  console.log(`  REDIS_URL: ${process.env.REDIS_URL ? "✅ Set" : "❌ Not Set"}`);
  console.log(`  ODOO_HOST: ${process.env.ODOO_HOST || "❌ Not Set"}`);
  console.log(`  ODOO_DB: ${process.env.ODOO_DB || "❌ Not Set"}`);
  console.log(`  ODOO_USERNAME: ${process.env.ODOO_USERNAME || "❌ Not Set"}`);
  console.log("");

  // Check all recent orders
  console.log("📦 Recent Orders (last 10):");
  const recentOrders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { items: true },
  });

  if (recentOrders.length === 0) {
    console.log("  No orders found in database.");
    return;
  }

  recentOrders.forEach((order, idx) => {
    console.log(`\n  Order ${idx + 1}:`);
    console.log(`    ID: ${order.id}`);
    console.log(`    Client Ref: ${order.clientOrderRef}`);
    console.log(`    Created: ${order.createdAt}`);
    console.log(`    Total: ${order.total} EGP`);
    console.log(`    Status: ${order.status}`);
    console.log(`    Payment Status: ${order.paymentStatus}`);
    console.log(`    Sale Order ID: ${order.saleOrderId || "❌ None"}`);
    console.log(`    POS Order ID: ${order.posOrderId || "❌ None"}`);
    console.log(`    Odoo Sale Status: ${order.odooStatusSale || "❌ Not Set"}`);
    console.log(`    Odoo POS Status: ${order.odooStatusPos || "❌ Not Set"}`);
    console.log(`    Odoo Web URL: ${order.odooWebUrl || "❌ None"}`);
    console.log(`    Items: ${order.items.length}`);
  });

  // Check specific orders if provided
  if (orderRefs.length > 0) {
    console.log("\n\n🎯 Checking Specific Orders:");
    const specificOrders = await prisma.order.findMany({
      where: {
        clientOrderRef: {
          in: orderRefs,
        },
      },
      include: { items: true, address: true },
    });

    if (specificOrders.length === 0) {
      console.log("  No orders found with the given references.");
    } else {
      specificOrders.forEach((order) => {
        console.log("\n  ====================================");
        console.log(`  Order clientOrderRef: ${order.clientOrderRef}`);
        console.log(`  Created At: ${order.createdAt}`);
        console.log(`  Total: ${order.total}`);
        console.log(`  Status: ${order.status}`);
        console.log(`  Payment Status: ${order.paymentStatus}`);
        console.log(`  Sale Order ID: ${order.saleOrderId || "❌ None"}`);
        console.log(`  POS Order ID: ${order.posOrderId || "❌ None"}`);
        console.log(`  Odoo Web URL: ${order.odooWebUrl || "❌ None"}`);
        console.log(`  Odoo Sale Status: ${order.odooStatusSale || "❌ Not Set"}`);
        console.log(`  Odoo POS Status: ${order.odooStatusPos || "❌ Not Set"}`);
        console.log(`  Items Count: ${order.items.length}`);
        if (order.address) {
          console.log(`  Address: ${order.address.street}, ${order.address.city}`);
        }
        console.log("  ====================================");
      });
    }
  }

  // Summary statistics
  console.log("\n\n📊 Sync Status Summary:");
  const allOrders = await prisma.order.findMany({
    select: {
      odooStatusSale: true,
      odooStatusPos: true,
      saleOrderId: true,
      posOrderId: true,
    },
  });

  const stats = {
    total: allOrders.length,
    syncedSale: allOrders.filter((o) => o.odooStatusSale === "synced").length,
    failedSale: allOrders.filter((o) => o.odooStatusSale === "failed").length,
    skippedSale: allOrders.filter((o) => o.odooStatusSale === "skipped").length,
    noStatusSale: allOrders.filter((o) => !o.odooStatusSale).length,
    hasSaleOrderId: allOrders.filter((o) => o.saleOrderId).length,
    syncedPos: allOrders.filter((o) => o.odooStatusPos === "synced").length,
    hasPosOrderId: allOrders.filter((o) => o.posOrderId).length,
  };

  console.log(`  Total Orders: ${stats.total}`);
  console.log(`  Sale Orders - Synced: ${stats.syncedSale}, Failed: ${stats.failedSale}, Skipped: ${stats.skippedSale}, No Status: ${stats.noStatusSale}`);
  console.log(`  Sale Orders with Odoo ID: ${stats.hasSaleOrderId}`);
  console.log(`  POS Orders - Synced: ${stats.syncedPos}`);
  console.log(`  POS Orders with Odoo ID: ${stats.hasPosOrderId}`);
}

investigateOrders()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { config } from "dotenv";
import { prisma } from "../src/server/db/client";
import { enqueueOrderSync } from "../src/server/services/odooSync";
import { isOdooConfigured } from "../src/server/utils/odooClient";

// Load environment variables
config();

async function syncUnsyncedOrders() {
  console.log("🔄 Syncing unsynced orders to Odoo...\n");

  // Check Odoo configuration
  if (!isOdooConfigured()) {
    console.error("❌ Odoo is not configured. Please set the following environment variables:");
    console.error("   - ODOO_HOST");
    console.error("   - ODOO_DB");
    console.error("   - ODOO_USERNAME");
    console.error("   - ODOO_API_KEY or ODOO_PASSWORD");
    process.exit(1);
  }

  console.log("✅ Odoo is configured\n");

  // Find orders that haven't been synced
  // Note: odooStatusSale has a default value, so we check for pending/failed or missing saleOrderId
  const unsyncedOrders = await prisma.order.findMany({
    where: {
      OR: [
        { odooStatusSale: "failed" },
        { odooStatusSale: "pending" },
        { saleOrderId: null },
      ],
    },
    include: {
      items: true,
      address: true,
      user: true,
    },
    orderBy: { createdAt: "desc" },
  });

  console.log(`Found ${unsyncedOrders.length} unsynced orders\n`);

  if (unsyncedOrders.length === 0) {
    console.log("✅ All orders are synced!");
    return;
  }

  let successCount = 0;
  let failCount = 0;

  for (const order of unsyncedOrders) {
    try {
      console.log(`\n📦 Processing order: ${order.id}`);
      console.log(`   Client Ref: ${order.clientOrderRef}`);
      console.log(`   Total: ${order.total} EGP`);
      console.log(`   Items: ${order.items.length}`);
      console.log(`   Current Status: ${order.odooStatusSale || "Not Set"}`);

      // Get user info
      const user = order.user;
      const address = order.address;

      // Build partner info
      const partner = {
        name: user?.name || user?.email?.split("@")[0] || "Website Customer",
        email: user?.email,
        phone: address?.phone || user?.phone,
        street: address?.street,
        city: address?.city,
        zip: address?.zipCode,
      };

      // Enqueue sync (default: enable sale, disable POS)
      await enqueueOrderSync({
        orderId: order.id,
        clientOrderRef: order.clientOrderRef,
        partner,
        enableSale: true,
        autoConfirm: false, // Don't auto-confirm when manually syncing
        enablePos: false,
      });

      console.log(`   ✅ Sync queued successfully`);

      // Wait a bit to avoid overwhelming the system
      await new Promise((resolve) => setTimeout(resolve, 500));

      successCount++;
    } catch (error) {
      console.error(`   ❌ Failed to queue sync: ${error}`);
      failCount++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 Sync Summary:");
  console.log(`   Total: ${unsyncedOrders.length}`);
  console.log(`   ✅ Queued: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log("=".repeat(60));

  if (successCount > 0) {
    console.log("\n💡 Note: Orders have been queued for sync.");
    console.log("   If using Redis queue, make sure the worker is running:");
    console.log("   npm run worker:odoo");
    console.log("\n   If not using Redis, sync will happen inline (check logs for errors).");
  }
}

syncUnsyncedOrders()
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


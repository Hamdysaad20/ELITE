import { config } from "dotenv";
import { createOdooClient } from "@/server/utils/odooClient";

// Load environment variables
config();

/**
 * Script to remove/deactivate the "30% discount" pricelist
 * 
 * This script:
 * 1. Finds the "30% discount" pricelist
 * 2. Deactivates it (or deletes it if preferred)
 * 
 * Run: npx tsx scripts/remove-30-percent-discount.ts
 */

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

const PRICELIST_NAME = "30% discount";

async function main() {
  logSection("🗑️  REMOVING 30% DISCOUNT PRICELIST");
  
  try {
    const client = createOdooClient();
    if (!client) {
      log("❌ Odoo client not configured", "red");
      process.exit(1);
    }
    
    log("Testing Odoo connection...", "blue");
    const pingResult = await client.ping();
    log(`✅ Connected to Odoo (User ID: ${pingResult.uid})`, "green");
    
    // Find the pricelist
    logSection("Finding Pricelist");
    const pricelists = await client.searchRead<any>(
      "product.pricelist",
      [["name", "=", PRICELIST_NAME]],
      ["id", "name", "active"]
    );
    
    if (!pricelists || pricelists.length === 0) {
      log(`❌ Pricelist "${PRICELIST_NAME}" not found`, "red");
      log("   It may have already been removed or doesn't exist.", "yellow");
      process.exit(0);
    }
    
    const pricelist = pricelists[0];
    log(`✅ Found pricelist: ${pricelist.name} (ID: ${pricelist.id})`, "green");
    log(`   Status: ${pricelist.active ? "Active" : "Inactive"}`, "blue");
    
    // Deactivate the pricelist (safer than deleting - can be reactivated if needed)
    logSection("Deactivating Pricelist");
    await client.rpc("product.pricelist", "write", [[pricelist.id], { active: false }]);
    log(`✅ Deactivated pricelist: ${pricelist.name} (ID: ${pricelist.id})`, "green");
    
    // Optionally delete pricelist items (uncomment if you want to remove items too)
    // logSection("Removing Pricelist Items");
    // const items = await client.searchRead<any>(
    //   "product.pricelist.item",
    //   [["pricelist_id", "=", pricelist.id]],
    //   ["id"]
    // );
    // if (items && items.length > 0) {
    //   const itemIds = items.map((item: any) => item.id);
    //   await client.rpc("product.pricelist.item", "unlink", [itemIds]);
    //   log(`✅ Removed ${itemIds.length} pricelist item(s)`, "green");
    // }
    
    logSection("✅ REMOVAL COMPLETE");
    log(`Pricelist "${PRICELIST_NAME}" has been deactivated.`, "green");
    log(`It will no longer appear in deals.`, "green");
    log(`\n💡 Note: The pricelist is deactivated, not deleted.`, "yellow");
    log(`   You can reactivate it in Odoo if needed.`, "yellow");
    
  } catch (error) {
    log(`❌ Error: ${error}`, "red");
    console.error(error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});


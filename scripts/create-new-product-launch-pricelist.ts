import { config } from "dotenv";
import { createOdooClient } from "@/server/utils/odooClient";

// Load environment variables
config();

/**
 * Script to create/update New Product Launch pricelist in Odoo
 * 
 * This script:
 * 1. Finds products created within the last 7 days
 * 2. Adds them to "New Product Launch" pricelist with 20% discount
 * 3. Removes products older than 7 days
 * 
 * Should be run daily (via cron) to automatically update the pricelist
 * 
 * Run: npx tsx scripts/create-new-product-launch-pricelist.ts
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

const PRICELIST_NAME = "New Product Launch";
const DISCOUNT_PERCENT = 20;
const DAYS_NEW = 7; // Products created within last 7 days
const ALLOWED_CATEGORIES = ['Coffee', 'Food', 'Frappe', 'Iced', 'Milkshake', 'Smoothie', 'Soda', 'Tea'];

async function createOrFindPricelist(client: any): Promise<number> {
  const existing = await client.searchRead<any>(
    "product.pricelist",
    [["name", "=", PRICELIST_NAME]],
    ["id", "name", "active"]
  );
  
  if (existing && existing.length > 0) {
    const pricelist = existing[0];
    log(`✅ Found existing pricelist: ${pricelist.name} (ID: ${pricelist.id})`, "green");
    
    if (!pricelist.active) {
      await client.rpc("product.pricelist", "write", [[pricelist.id], { active: true }]);
      log(`✅ Activated pricelist`, "green");
    }
    
    return pricelist.id;
  }
  
  log(`Creating new pricelist: ${PRICELIST_NAME}`, "blue");
  
  const pricelistId = await client.rpc<number>("product.pricelist", "create", [{
    name: PRICELIST_NAME,
    active: true,
  }]);
  
  log(`✅ Created pricelist: ${PRICELIST_NAME} (ID: ${pricelistId})`, "green");
  
  return pricelistId;
}

async function findNewProducts(client: any): Promise<Array<{ id: number; name: string; create_date: string }>> {
  // Calculate date 7 days ago
  const now = new Date();
  const daysAgo = new Date(now);
  daysAgo.setDate(daysAgo.getDate() - DAYS_NEW);
  const dateFrom = daysAgo.toISOString().split('T')[0]; // YYYY-MM-DD
  
  log(`Finding products created since ${dateFrom}...`, "blue");
  
  // Get all categories first
  const categories = await client.searchRead<any>(
    "product.category",
    [["name", "in", ALLOWED_CATEGORIES]],
    ["id", "name"]
  );
  
  const categoryIds = categories.map((c: any) => c.id);
  
  // Find products created in last 7 days in allowed categories
  const products = await client.searchRead<any>(
    "product.product",
    [
      ["create_date", ">=", dateFrom],
      ["categ_id", "in", categoryIds],
      ["active", "=", true],
      ["sale_ok", "=", true],
    ],
    ["id", "name", "create_date", "categ_id"]
  );
  
  if (!products || products.length === 0) {
    log(`⚠️  No new products found in the last ${DAYS_NEW} days`, "yellow");
    return [];
  }
  
  log(`✅ Found ${products.length} new product(s)`, "green");
  
  return products.map((p: any) => ({
    id: p.id,
    name: p.name,
    create_date: p.create_date,
  }));
}

async function updatePricelistItems(
  client: any,
  pricelistId: number,
  newProductIds: number[]
): Promise<void> {
  // Get existing pricelist items
  const existingItems = await client.searchRead<any>(
    "product.pricelist.item",
    [["pricelist_id", "=", pricelistId]],
    ["id", "product_id"]
  );
  
  const existingProductIds = new Set<number>();
  if (existingItems) {
    for (const item of existingItems) {
      if (item.product_id && item.product_id !== false) {
        const productId = Array.isArray(item.product_id) ? item.product_id[0] : item.product_id;
        existingProductIds.add(productId);
      }
    }
  }
  
  // Remove products that are no longer new (older than 7 days)
  const productsToRemove: number[] = [];
  for (const productId of existingProductIds) {
    if (!newProductIds.includes(productId)) {
      productsToRemove.push(productId);
    }
  }
  
  if (productsToRemove.length > 0) {
    const itemsToDelete = existingItems.filter((item: any) => {
      if (!item.product_id || item.product_id === false) return false;
      const productId = Array.isArray(item.product_id) ? item.product_id[0] : item.product_id;
      return productsToRemove.includes(productId);
    });
    
    if (itemsToDelete.length > 0) {
      const itemIds = itemsToDelete.map((item: any) => item.id);
      await client.rpc("product.pricelist.item", "unlink", [itemIds]);
      log(`✅ Removed ${itemIds.length} product(s) that are no longer new`, "green");
    }
  }
  
  // Add new products
  const productsToAdd = newProductIds.filter(id => !existingProductIds.has(id));
  
  if (productsToAdd.length > 0) {
    for (const productId of productsToAdd) {
      await client.rpc("product.pricelist.item", "create", [{
        pricelist_id: pricelistId,
        product_id: productId,
        compute_price: "percentage",
        percent_price: -DISCOUNT_PERCENT, // Negative for discount
      }]);
    }
    
    log(`✅ Added ${productsToAdd.length} new product(s) to pricelist`, "green");
  } else {
    log(`ℹ️  No new products to add (all already in pricelist)`, "blue");
  }
}

async function main() {
  logSection("🆕 NEW PRODUCT LAUNCH PRICELIST SETUP");
  
  try {
    const client = createOdooClient();
    if (!client) {
      log("❌ Odoo client not configured", "red");
      process.exit(1);
    }
    
    log("Testing Odoo connection...", "blue");
    const pingResult = await client.ping();
    log(`✅ Connected to Odoo (User ID: ${pingResult.uid})`, "green");
    
    const pricelistId = await createOrFindPricelist(client);
    
    logSection("Finding New Products");
    const newProducts = await findNewProducts(client);
    
    if (newProducts.length > 0) {
      log("\nNew Products Found:", "blue");
      newProducts.forEach(p => {
        log(`  • ${p.name} (ID: ${p.id}, Created: ${p.create_date})`, "blue");
      });
    }
    
    logSection("Updating Pricelist");
    const newProductIds = newProducts.map(p => p.id);
    await updatePricelistItems(client, pricelistId, newProductIds);
    
    logSection("✅ SETUP COMPLETE");
    log(`Pricelist ID: ${pricelistId}`, "green");
    log(`Products in pricelist: ${newProductIds.length}`, "green");
    log(`Discount: ${DISCOUNT_PERCENT}%`, "green");
    log(`\n💡 Run this script daily (via cron) to automatically update the pricelist`, "yellow");
    log(`   Products older than ${DAYS_NEW} days will be automatically removed.`, "yellow");
    
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


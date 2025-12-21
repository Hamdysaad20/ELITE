import { config } from "dotenv";
import { createOdooClient } from "@/server/utils/odooClient";

// Load environment variables
config();

/**
 * Script to create Late Night Deals pricelist in Odoo
 * 
 * This script:
 * 1. Creates or finds a pricelist named "Late Night Deals"
 * 2. Creates category-based percentage rules (15% off)
 * 3. Applies to selected categories: Coffee, Iced, Tea
 * 
 * Time validation (Monday & Thursday, 10 PM - 12 AM) is handled in the application layer
 * 
 * Run: npx tsx scripts/create-late-night-pricelist.ts
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

// Configuration
const PRICELIST_NAME = "Late Night Deals";
const DISCOUNT_PERCENTAGE = 15; // 15% off

// Categories to include in Late Night Deals
// You can modify this list based on your preferences
const TARGET_CATEGORIES = ['Coffee', 'Iced', 'Tea'];

async function findCategories(client: any, categoryNames: string[]): Promise<Map<string, number>> {
  logSection("Finding Categories in Odoo");
  
  const categoryMap = new Map<string, number>();
  
  for (const categoryName of categoryNames) {
    log(`Searching for category: ${categoryName}`, "blue");
    
    const categories = await client.searchRead<any>(
      "product.category",
      [["name", "=", categoryName]],
      ["id", "name"]
    );
    
    if (categories && categories.length > 0) {
      const category = categories[0];
      categoryMap.set(categoryName, category.id);
      log(`✅ Found: ${category.name} (ID: ${category.id})`, "green");
    } else {
      log(`❌ Category not found: ${categoryName}`, "red");
    }
  }
  
  return categoryMap;
}

async function createOrFindPricelist(client: any): Promise<number> {
  logSection("Creating/Finding Pricelist");
  
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

async function createOrUpdatePricelistItem(
  client: any,
  pricelistId: number,
  categoryId: number,
  categoryName: string
): Promise<void> {
  // Check if item exists
  const existing = await client.searchRead<any>(
    "product.pricelist.item",
    [
      ["pricelist_id", "=", pricelistId],
      ["categ_id", "=", categoryId],
    ],
    ["id", "percent_price", "compute_price"]
  );
  
  if (existing && existing.length > 0) {
    // Update existing item
    const itemId = existing[0].id;
    await client.rpc("product.pricelist.item", "write", [[itemId], {
      compute_price: "percentage",
      percent_price: DISCOUNT_PERCENTAGE,
    }]);
    log(`✅ Updated: ${categoryName} category → ${DISCOUNT_PERCENTAGE}% off`, "green");
  } else {
    // Create new item
    await client.rpc("product.pricelist.item", "create", [{
      pricelist_id: pricelistId,
      categ_id: categoryId,
      compute_price: "percentage",
      percent_price: DISCOUNT_PERCENTAGE,
    }]);
    log(`✅ Created: ${categoryName} category → ${DISCOUNT_PERCENTAGE}% off`, "green");
  }
}

async function main() {
  logSection("🚀 LATE NIGHT DEALS PRICELIST SETUP");
  
  try {
    const client = createOdooClient();
    if (!client) {
      log("❌ Odoo client not configured", "red");
      process.exit(1);
    }
    
    log("Testing Odoo connection...", "blue");
    const pingResult = await client.ping();
    log(`✅ Connected to Odoo (User ID: ${pingResult.uid})`, "green");
    
    // Find categories
    const categoryMap = await findCategories(client, TARGET_CATEGORIES);
    
    if (categoryMap.size === 0) {
      log("❌ No categories found. Please ensure categories exist in Odoo.", "red");
      process.exit(1);
    }
    
    // Create or find pricelist
    const pricelistId = await createOrFindPricelist(client);
    
    // Create pricelist items for each category
    logSection("Creating Pricelist Items");
    let createdCount = 0;
    let updatedCount = 0;
    
    for (const [categoryName, categoryId] of categoryMap) {
      await createOrUpdatePricelistItem(client, pricelistId, categoryId, categoryName);
      if (await client.searchRead("product.pricelist.item", [
        ["pricelist_id", "=", pricelistId],
        ["categ_id", "=", categoryId],
      ], ["id"]).then((items: any[]) => items && items.length > 0)) {
        updatedCount++;
      } else {
        createdCount++;
      }
    }
    
    log(`\n📊 Summary: ${createdCount} created, ${updatedCount} updated`, "blue");
    
    logSection("✅ SETUP COMPLETE");
    log(`Pricelist ID: ${pricelistId}`, "green");
    log(`Categories: ${Array.from(categoryMap.keys()).join(", ")}`, "green");
    log(`Discount: ${DISCOUNT_PERCENTAGE}%`, "green");
    log("Time: Monday & Thursday, 10:00 PM - 12:00 AM (validated server-side)", "green");
    
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


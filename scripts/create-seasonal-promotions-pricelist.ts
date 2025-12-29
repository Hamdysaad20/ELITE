import { config } from "dotenv";
import { createOdooClient } from "@/server/utils/odooClient";

// Load environment variables
config();

/**
 * Script to create Seasonal Promotions pricelist in Odoo
 * 
 * Creates pricelists for different seasons:
 * - Summer Promotions (June-August)
 * - Winter Promotions (December-February)
 * - Spring Promotions (March-May)
 * - Fall Promotions (September-November)
 * 
 * Run: npx tsx scripts/create-seasonal-promotions-pricelist.ts
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

interface SeasonalConfig {
  name: string;
  dateFrom: string; // Format: YYYY-MM-DD
  dateTo: string;
  discount: number; // Percentage
  categories: string[];
  description: string;
}

const SEASONAL_PROMOTIONS: SeasonalConfig[] = [
  {
    name: "Summer Promotions",
    dateFrom: "2025-06-01",
    dateTo: "2025-08-31",
    discount: 20,
    categories: ["Iced", "Smoothie", "Soda", "Frappe"],
    description: "Cool down with refreshing summer drinks!",
  },
  {
    name: "Winter Promotions",
    dateFrom: "2025-12-01",
    dateTo: "2026-02-28",
    discount: 15,
    categories: ["Coffee", "Tea"],
    description: "Warm up with hot beverages this winter!",
  },
  {
    name: "Spring Promotions",
    dateFrom: "2025-03-01",
    dateTo: "2025-05-31",
    discount: 18,
    categories: ["Coffee", "Tea", "Iced"],
    description: "Spring into freshness!",
  },
  {
    name: "Fall Promotions",
    dateFrom: "2025-09-01",
    dateTo: "2025-11-30",
    discount: 15,
    categories: ["Coffee", "Tea", "Food"],
    description: "Cozy fall flavors!",
  },
];

async function createOrFindPricelist(client: any, config: SeasonalConfig): Promise<number> {
  const existing = await client.searchRead<any>(
    "product.pricelist",
    [["name", "=", config.name]],
    ["id", "name", "active"]
  );
  
  if (existing && existing.length > 0) {
    const pricelist = existing[0];
    log(`✅ Found existing pricelist: ${pricelist.name} (ID: ${pricelist.id})`, "green");
    
    // Update date range
    await client.rpc("product.pricelist", "write", [[pricelist.id], {
      active: true,
    }]);
    
    return pricelist.id;
  }
  
  log(`Creating new pricelist: ${config.name}`, "blue");
  
  const pricelistId = await client.rpc<number>("product.pricelist", "create", [{
    name: config.name,
    active: true,
  }]);
  
  log(`✅ Created pricelist: ${config.name} (ID: ${pricelistId})`, "green");
  
  return pricelistId;
}

async function createCategoryRules(
  client: any,
  pricelistId: number,
  categoryNames: string[],
  discount: number,
  dateFrom: string,
  dateTo: string
): Promise<void> {
  // Get category IDs
  const categories = await client.searchRead<any>(
    "product.category",
    [["name", "in", categoryNames]],
    ["id", "name"]
  );
  
  if (!categories || categories.length === 0) {
    log(`⚠️  No categories found: ${categoryNames.join(", ")}`, "yellow");
    return;
  }
  
  // Delete existing rules for this pricelist
  const existingRules = await client.searchRead<any>(
    "product.pricelist.item",
    [["pricelist_id", "=", pricelistId]],
    ["id"]
  );
  
  if (existingRules && existingRules.length > 0) {
    const ruleIds = existingRules.map((r: any) => r.id);
    await client.rpc("product.pricelist.item", "unlink", [ruleIds]);
    log(`✅ Removed ${ruleIds.length} existing rule(s)`, "blue");
  }
  
  // Create category-based percentage rules with date ranges
  for (const category of categories) {
    await client.rpc("product.pricelist.item", "create", [{
      pricelist_id: pricelistId,
      categ_id: category.id,
      compute_price: "percentage",
      percent_price: -discount, // Negative for discount
      date_start: dateFrom, // Set date range on pricelist item
      date_end: dateTo,
    }]);
    
    log(`✅ Created rule: ${category.name} → ${discount}% discount (${dateFrom} to ${dateTo})`, "green");
  }
}

async function main() {
  logSection("🌍 SEASONAL PROMOTIONS PRICELIST SETUP");
  
  try {
    const client = createOdooClient();
    if (!client) {
      log("❌ Odoo client not configured", "red");
      process.exit(1);
    }
    
    log("Testing Odoo connection...", "blue");
    const pingResult = await client.ping();
    log(`✅ Connected to Odoo (User ID: ${pingResult.uid})`, "green");
    
    for (const config of SEASONAL_PROMOTIONS) {
      logSection(`Creating ${config.name}`);
      log(`Period: ${config.dateFrom} to ${config.dateTo}`, "blue");
      log(`Discount: ${config.discount}%`, "blue");
      log(`Categories: ${config.categories.join(", ")}`, "blue");
      
      const pricelistId = await createOrFindPricelist(client, config);
      
      await createCategoryRules(
        client, 
        pricelistId, 
        config.categories, 
        config.discount,
        config.dateFrom,
        config.dateTo
      );
      
      log(`✅ ${config.name} setup complete!`, "green");
    }
    
    logSection("✅ SETUP COMPLETE");
    log("All seasonal promotions pricelists created!", "green");
    log("\n💡 Note: Date validation is handled by Odoo's date_from/date_to fields", "yellow");
    log("   Update date ranges annually or as needed.", "yellow");
    
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


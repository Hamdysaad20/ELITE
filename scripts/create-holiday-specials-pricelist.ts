import { config } from "dotenv";
import { createOdooClient } from "@/server/utils/odooClient";

// Load environment variables
config();

/**
 * Script to create Holiday Specials pricelist in Odoo
 * 
 * Creates pricelists for specific holidays with product-specific deals
 * Examples: Christmas, New Year, Eid, etc.
 * 
 * Run: npx tsx scripts/create-holiday-specials-pricelist.ts
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

interface HolidayConfig {
  name: string;
  dateFrom: string; // Format: YYYY-MM-DD
  dateTo: string;
  discount: number; // Percentage or fixed price
  productNames?: string[]; // Specific products
  categoryNames?: string[]; // Or categories
  description: string;
}

const HOLIDAY_SPECIALS: HolidayConfig[] = [
  {
    name: "Christmas Specials",
    dateFrom: "2025-12-20",
    dateTo: "2025-12-27",
    discount: 25,
    categoryNames: ["Coffee", "Food"],
    description: "Merry Christmas! Special holiday treats",
  },
  {
    name: "New Year Specials",
    dateFrom: "2025-12-31",
    dateTo: "2026-01-02",
    discount: 20,
    categoryNames: ["Coffee", "Tea", "Food"],
    description: "Ring in the New Year with special deals!",
  },
  // Add more holidays as needed
];

async function createOrFindPricelist(client: any, config: HolidayConfig): Promise<number> {
  const pricelistName = `Holiday Specials ${config.name}`;
  
  const existing = await client.searchRead<any>(
    "product.pricelist",
    [["name", "=", pricelistName]],
    ["id", "name", "active"]
  );
  
  if (existing && existing.length > 0) {
    const pricelist = existing[0];
    log(`✅ Found existing pricelist: ${pricelist.name} (ID: ${pricelist.id})`, "green");
    
    await client.rpc("product.pricelist", "write", [[pricelist.id], {
      active: true,
    }]);
    
    return pricelist.id;
  }
  
  log(`Creating new pricelist: ${pricelistName}`, "blue");
  
  const pricelistId = await client.rpc<number>("product.pricelist", "create", [{
    name: pricelistName,
    active: true,
  }]);
  
  log(`✅ Created pricelist: ${pricelistName} (ID: ${pricelistId})`, "green");
  
  return pricelistId;
}

async function createHolidayRules(
  client: any,
  pricelistId: number,
  config: HolidayConfig
): Promise<void> {
  // Delete existing rules
  const existingRules = await client.searchRead<any>(
    "product.pricelist.item",
    [["pricelist_id", "=", pricelistId]],
    ["id"]
  );
  
  if (existingRules && existingRules.length > 0) {
    const ruleIds = existingRules.map((r: any) => r.id);
    await client.rpc("product.pricelist.item", "unlink", [ruleIds]);
  }
  
  // Create product-specific rules if products specified
  if (config.productNames && config.productNames.length > 0) {
    for (const productName of config.productNames) {
      const products = await client.searchRead<any>(
        "product.product",
        [["name", "=", productName]],
        ["id", "name"]
      );
      
      if (products && products.length > 0) {
        const product = products[0];
        await client.rpc("product.pricelist.item", "create", [{
          pricelist_id: pricelistId,
          product_id: product.id,
          compute_price: "percentage",
          percent_price: -config.discount,
          date_start: config.dateFrom,
          date_end: config.dateTo,
        }]);
        
        log(`✅ Created rule: ${product.name} → ${config.discount}% discount`, "green");
      }
    }
  }
  
  // Create category-based rules if categories specified
  if (config.categoryNames && config.categoryNames.length > 0) {
    const categories = await client.searchRead<any>(
      "product.category",
      [["name", "in", config.categoryNames]],
      ["id", "name"]
    );
    
    if (categories && categories.length > 0) {
      for (const category of categories) {
        await client.rpc("product.pricelist.item", "create", [{
          pricelist_id: pricelistId,
          categ_id: category.id,
          compute_price: "percentage",
          percent_price: -config.discount,
          date_start: config.dateFrom,
          date_end: config.dateTo,
        }]);
        
        log(`✅ Created rule: ${category.name} → ${config.discount}% discount`, "green");
      }
    }
  }
}

async function main() {
  logSection("🎄 HOLIDAY SPECIALS PRICELIST SETUP");
  
  try {
    const client = createOdooClient();
    if (!client) {
      log("❌ Odoo client not configured", "red");
      process.exit(1);
    }
    
    log("Testing Odoo connection...", "blue");
    const pingResult = await client.ping();
    log(`✅ Connected to Odoo (User ID: ${pingResult.uid})`, "green");
    
    for (const config of HOLIDAY_SPECIALS) {
      logSection(`Creating ${config.name}`);
      log(`Period: ${config.dateFrom} to ${config.dateTo}`, "blue");
      log(`Discount: ${config.discount}%`, "blue");
      
      const pricelistId = await createOrFindPricelist(client, config);
      
      await createHolidayRules(client, pricelistId, config);
      
      log(`✅ ${config.name} setup complete!`, "green");
    }
    
    logSection("✅ SETUP COMPLETE");
    log("All holiday specials pricelists created!", "green");
    log("\n💡 Note: Date validation is handled by Odoo's date_from/date_to fields", "yellow");
    log("   Update date ranges for each holiday annually.", "yellow");
    
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


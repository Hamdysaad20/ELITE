import { config } from "dotenv";
import { createOdooClient } from "@/server/utils/odooClient";

// Load environment variables
config();

/**
 * Script to create Monday Morning Deals pricelist in Odoo
 * 
 * This script:
 * 1. Creates or finds a pricelist named "Monday Morning Deals"
 * 2. Creates pricelist items for:
 *    - Iced Latte, Hot Latte, Iced Cappuccino, Hot Cappuccino → 40 EGP
 *    - Espresso, Turkish Coffee → 25 EGP
 * 3. Configures time-based rules (Monday 8:00 AM - 1:00 PM)
 * 
 * Note: Odoo's pricelist system doesn't natively support time-based rules.
 * We'll use a combination of:
 * - Pricelist with fixed prices
 * - Application logic in the frontend/API to check time validity
 * - Odoo will enforce the price when orders are placed
 * 
 * Run: npx tsx scripts/create-monday-deals-pricelist.ts
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

// Deal products configuration
const DEAL_PRODUCTS = {
  "40_EGP": [
    "Iced Latte",
    "Hot Latte",
    "Iced Cappuccino",
    "Hot Cappuccino",
  ],
  "25_EGP": [
    "Espresso",
    "Turkish Coffee",
  ],
};

async function findProductsByName(client: any, productNames: string[]): Promise<Map<string, number>> {
  logSection("Finding Products in Odoo");
  
  const productMap = new Map<string, number>();
  
  for (const productName of productNames) {
    log(`Searching for: ${productName}`, "blue");
    
    // Try exact match first
    let products = await client.searchRead<any>(
      "product.product",
      [["name", "=", productName]],
      ["id", "name", "list_price"]
    );
    
    // If not found, try case variations
    if (!products || products.length === 0) {
      // Try with first letter capitalized
      products = await client.searchRead<any>(
        "product.product",
        [["name", "=", productName.charAt(0).toUpperCase() + productName.slice(1).toLowerCase()]],
        ["id", "name", "list_price"]
      );
    }
    
    // If still not found, try all uppercase
    if (!products || products.length === 0) {
      products = await client.searchRead<any>(
        "product.product",
        [["name", "=", productName.toUpperCase()]],
        ["id", "name", "list_price"]
      );
    }
    
    // If still not found, search all products and filter client-side
    if (!products || products.length === 0) {
      const allProducts = await client.searchRead<any>(
        "product.product",
        [["sale_ok", "=", true]],
        ["id", "name", "list_price"]
      );
      if (allProducts) {
        products = allProducts.filter((p: any) => 
          p.name && p.name.toLowerCase().includes(productName.toLowerCase())
        );
      }
    }
    
    if (products && products.length > 0) {
      const product = products[0];
      productMap.set(productName, product.id);
      log(`✅ Found: ${product.name} (ID: ${product.id}, Price: ${product.list_price} EGP)`, "green");
    } else {
      log(`❌ Not found: ${productName}`, "red");
    }
  }
  
  return productMap;
}

async function createOrFindPricelist(client: any): Promise<number> {
  logSection("Creating/Finding Pricelist");
  
  const pricelistName = "Monday Morning Deals";
  
  // Search for existing pricelist
  const existing = await client.searchRead<any>(
    "product.pricelist",
    [["name", "=", pricelistName]],
    ["id", "name", "active"]
  );
  
  if (existing && existing.length > 0) {
    const pricelist = existing[0];
    log(`✅ Found existing pricelist: ${pricelist.name} (ID: ${pricelist.id})`, "green");
    
    // Activate if inactive
    if (!pricelist.active) {
      await client.rpc("product.pricelist", "write", [[pricelist.id], { active: true }]);
      log(`✅ Activated pricelist`, "green");
    }
    
    return pricelist.id;
  }
  
  // Create new pricelist
  log(`Creating new pricelist: ${pricelistName}`, "blue");
  
  const pricelistId = await client.rpc<number>("product.pricelist", "create", [{
    name: pricelistName,
    active: true,
    // Note: In Odoo, pricelists are typically assigned to partners or used in sales
  }]);
  
  log(`✅ Created pricelist: ${pricelistName} (ID: ${pricelistId})`, "green");
  
  return pricelistId;
}

async function createPricelistItems(
  client: any,
  pricelistId: number,
  productMap: Map<string, number>
): Promise<void> {
  logSection("Creating Pricelist Items");
  
  let createdCount = 0;
  let updatedCount = 0;
  
  // Create items for 40 EGP products
  for (const productName of DEAL_PRODUCTS["40_EGP"]) {
    const productId = productMap.get(productName);
    if (!productId) {
      log(`⚠️  Skipping ${productName} - product not found`, "yellow");
      continue;
    }
    
    // Check if pricelist item already exists
    const existing = await client.searchRead<any>(
      "product.pricelist.item",
      [
        ["pricelist_id", "=", pricelistId],
        ["product_id", "=", productId],
      ],
      ["id", "fixed_price"]
    );
    
    if (existing && existing.length > 0) {
      // Update existing item
      const itemId = existing[0].id;
      await client.rpc("product.pricelist.item", "write", [[itemId], {
        fixed_price: 40.0,
        compute_price: "fixed", // Fixed price
      }]);
      log(`✅ Updated: ${productName} → 40 EGP`, "green");
      updatedCount++;
    } else {
      // Create new item
      await client.rpc<number>("product.pricelist.item", "create", [{
        pricelist_id: pricelistId,
        product_id: productId,
        fixed_price: 40.0,
        compute_price: "fixed",
        // Note: Odoo doesn't have native time-based rules in pricelist items
        // We'll handle time validation in the application layer
      }]);
      log(`✅ Created: ${productName} → 40 EGP`, "green");
      createdCount++;
    }
  }
  
  // Create items for 25 EGP products
  for (const productName of DEAL_PRODUCTS["25_EGP"]) {
    const productId = productMap.get(productName);
    if (!productId) {
      log(`⚠️  Skipping ${productName} - product not found`, "yellow");
      continue;
    }
    
    // Check if pricelist item already exists
    const existing = await client.searchRead<any>(
      "product.pricelist.item",
      [
        ["pricelist_id", "=", pricelistId],
        ["product_id", "=", productId],
      ],
      ["id", "fixed_price"]
    );
    
    if (existing && existing.length > 0) {
      // Update existing item
      const itemId = existing[0].id;
      await client.rpc("product.pricelist.item", "write", [[itemId], {
        fixed_price: 25.0,
        compute_price: "fixed",
      }]);
      log(`✅ Updated: ${productName} → 25 EGP`, "green");
      updatedCount++;
    } else {
      // Create new item
      await client.rpc<number>("product.pricelist.item", "create", [{
        pricelist_id: pricelistId,
        product_id: productId,
        fixed_price: 25.0,
        compute_price: "fixed",
      }]);
      log(`✅ Created: ${productName} → 25 EGP`, "green");
      createdCount++;
    }
  }
  
  log(`\n📊 Summary: ${createdCount} created, ${updatedCount} updated`, "blue");
}

async function main() {
  logSection("🚀 MONDAY MORNING DEALS PRICELIST SETUP");
  
  try {
    // Check Odoo configuration
    const client = createOdooClient();
    if (!client) {
      log("❌ Odoo client not configured. Please set environment variables:", "red");
      log("   - ODOO_HOST", "red");
      log("   - ODOO_DB", "red");
      log("   - ODOO_USERNAME", "red");
      log("   - ODOO_API_KEY or ODOO_PASSWORD", "red");
      process.exit(1);
    }
    
    // Test connection
    log("Testing Odoo connection...", "blue");
    const pingResult = await client.ping();
    log(`✅ Connected to Odoo (User ID: ${pingResult.uid})`, "green");
    
    // Step 1: Find all products
    const allProductNames = [
      ...DEAL_PRODUCTS["40_EGP"],
      ...DEAL_PRODUCTS["25_EGP"],
    ];
    const productMap = await findProductsByName(client, allProductNames);
    
    if (productMap.size === 0) {
      log("❌ No products found. Please ensure products exist in Odoo.", "red");
      process.exit(1);
    }
    
    // Step 2: Create or find pricelist
    const pricelistId = await createOrFindPricelist(client);
    
    // Step 3: Create pricelist items
    await createPricelistItems(client, pricelistId, productMap);
    
    // Final summary
    logSection("✅ SETUP COMPLETE");
    log(`Pricelist ID: ${pricelistId}`, "green");
    log(`Products configured: ${productMap.size}`, "green");
    log("\n📝 Important Notes:", "yellow");
    log("1. This pricelist uses fixed prices (40 EGP / 25 EGP)", "yellow");
    log("2. Time validation (Monday 8:00 AM - 1:00 PM) is handled in the application layer", "yellow");
    log("3. Odoo will enforce these prices when orders are placed", "yellow");
    log("4. To use this pricelist, pass pricelist_id in the context when fetching products", "yellow");
    
  } catch (error) {
    log(`❌ Error: ${error}`, "red");
    console.error(error);
    process.exit(1);
  }
}

// Run script
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});


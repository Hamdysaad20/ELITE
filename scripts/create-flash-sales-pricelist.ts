import { config } from "dotenv";
import { createOdooClient } from "@/server/utils/odooClient";

// Load environment variables
config();

/**
 * Script to create Flash Sales pricelist in Odoo
 * 
 * This script:
 * 1. Creates or finds a pricelist named "Flash Sales"
 * 2. Creates pricelist items with percentage discount (max 40%, >30% only for large items)
 * 3. Product selection: Can be manually specified
 * 
 * Note: Product rotation should be handled separately (daily script)
 * Time validation (1-hour window daily, e.g., 2 PM - 3 PM) is handled in the application layer
 * 
 * Run: npx tsx scripts/create-flash-sales-pricelist.ts [product-name] [discount-percentage]
 * Example: npx tsx scripts/create-flash-sales-pricelist.ts "Iced Latte" 40
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
const PRICELIST_NAME = "Flash Sales";
const DEFAULT_DISCOUNT = 40; // Default 40% off (max 40%, business rule)
const LARGE_ITEM_MIN_PRICE = 100; // Products >= 100 EGP are considered "large items"

async function findProductByName(client: any, productName: string): Promise<number | null> {
  log(`Searching for product: ${productName}`, "blue");
  
  let products = await client.searchRead<any>(
    "product.product",
    [["name", "=", productName]],
    ["id", "name", "list_price"]
  );
  
  if (!products || products.length === 0) {
    products = await client.searchRead<any>(
      "product.product",
      [["name", "ilike", productName]],
      ["id", "name", "list_price"]
    );
  }
  
  if (products && products.length > 0) {
    const product = products[0];
    log(`✅ Found: ${product.name} (ID: ${product.id}, Price: ${product.list_price} EGP)`, "green");
    return product.id;
  }
  
  log(`❌ Product not found: ${productName}`, "red");
  return null;
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
  productId: number,
  productName: string,
  originalPrice: number,
  discountPercentage: number
): Promise<void> {
  // Check if item exists
  const existing = await client.searchRead<any>(
    "product.pricelist.item",
    [
      ["pricelist_id", "=", pricelistId],
      ["product_id", "=", productId],
    ],
    ["id", "percent_price", "compute_price"]
  );
  
  const dealPrice = originalPrice * (1 - discountPercentage / 100);
  
  if (existing && existing.length > 0) {
    // Update existing item
    const itemId = existing[0].id;
    await client.rpc("product.pricelist.item", "write", [[itemId], {
      compute_price: "percentage",
      percent_price: discountPercentage,
    }]);
    log(`✅ Updated: ${productName} → ${discountPercentage}% off (${originalPrice} EGP → ${dealPrice.toFixed(2)} EGP)`, "green");
  } else {
    // Create new item
    await client.rpc("product.pricelist.item", "create", [{
      pricelist_id: pricelistId,
      product_id: productId,
      compute_price: "percentage",
      percent_price: discountPercentage,
    }]);
    log(`✅ Created: ${productName} → ${discountPercentage}% off (${originalPrice} EGP → ${dealPrice.toFixed(2)} EGP)`, "green");
  }
}

async function main() {
  logSection("🚀 FLASH SALES PRICELIST SETUP");
  
  try {
    const client = createOdooClient();
    if (!client) {
      log("❌ Odoo client not configured", "red");
      process.exit(1);
    }
    
    log("Testing Odoo connection...", "blue");
    const pingResult = await client.ping();
    log(`✅ Connected to Odoo (User ID: ${pingResult.uid})`, "green");
    
    // Get product name and discount from command line
    const productName = process.argv[2];
    const discountArg = process.argv[3];
    const discountPercentage = discountArg ? parseInt(discountArg, 10) : DEFAULT_DISCOUNT;
    
    if (!productName) {
      log("❌ Product name required", "red");
      log("Usage: npx tsx scripts/create-flash-sales-pricelist.ts \"Product Name\" [discount-percentage]", "yellow");
      log("Example: npx tsx scripts/create-flash-sales-pricelist.ts \"Iced Latte\" 40", "yellow");
      process.exit(1);
    }
    
    // Validate discount range
    if (discountPercentage < 0 || discountPercentage > 40) {
      log("⚠️  Discount must be between 0-40% (business rule: no discount over 40%).", "yellow");
      log(`   Using clamped value: ${Math.min(40, Math.max(0, discountPercentage))}%`, "yellow");
    }
    
    const pricelistId = await createOrFindPricelist(client);
    
    // Find product
    logSection("Finding Product");
    const productId = await findProductByName(client, productName);
    if (!productId) {
      log("❌ Product not found. Exiting.", "red");
      process.exit(1);
    }
    
    // Get product details
    const products = await client.searchRead<any>(
      "product.product",
      [["id", "=", productId]],
      ["id", "name", "list_price"]
    );
    
    if (products && products.length > 0) {
      const product = products[0];
      const productPrice = product.list_price || 0;
      const isLargeItem = productPrice >= LARGE_ITEM_MIN_PRICE;
      
      // Validate discount according to business rules
      let finalDiscount = Math.min(40, Math.max(0, discountPercentage)); // Clamp to 0-40%
      
      // Rule: Discounts > 30% only for large items
      if (finalDiscount > 30 && !isLargeItem) {
        log(`⚠️  WARNING: Discount > 30% only allowed for large items (price >= ${LARGE_ITEM_MIN_PRICE} EGP)`, "yellow");
        log(`   Product price: ${productPrice} EGP (${isLargeItem ? "Large" : "Regular"} item)`, "yellow");
        log(`   Clamping discount from ${finalDiscount}% to 30%`, "yellow");
        finalDiscount = 30;
      }
      
      logSection("Discount Validation");
      log(`Product: ${product.name}`, "blue");
      log(`Price: ${productPrice} EGP`, "blue");
      log(`Item Type: ${isLargeItem ? "Large Item" : "Regular Item"}`, isLargeItem ? "green" : "yellow");
      log(`Final Discount: ${finalDiscount}%`, "green");
      
      await createOrUpdatePricelistItem(
        client,
        pricelistId,
        productId,
        product.name,
        productPrice,
        finalDiscount
      );
    }
    
    logSection("✅ SETUP COMPLETE");
    log(`Pricelist ID: ${pricelistId}`, "green");
    log(`Product: ${productName}`, "green");
    log(`Discount: ${discountPercentage}%`, "green");
    log("Time: Daily 2:00 PM - 3:00 PM (1-hour window, validated server-side)", "green");
    log("\n💡 Tip: Create a daily script to rotate products automatically", "yellow");
    
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


import { config } from "dotenv";
import { createOdooClient } from "@/server/utils/odooClient";
import { calculateDiscountPercentage } from "@/server/utils/deals/priceConversion";

// Load environment variables
config();

/**
 * Script to create Happy Hour Deals pricelist in Odoo
 * 
 * This script:
 * 1. Creates or finds a pricelist named "Happy Hour Deals"
 * 2. Creates pricelist items with 20% discount
 * 3. Product selection: Can be manually specified or will select from eligible products
 * 
 * Note: Product rotation should be handled separately (daily script or manual update)
 * Time validation (3 PM - 6 PM daily) is handled in the application layer
 * 
 * Run: npx tsx scripts/create-happy-hour-pricelist.ts [product-name]
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
const PRICELIST_NAME = "Happy Hour Deals";
const DISCOUNT_PERCENTAGE = 20; // 20% off

// Allowed categories (from requirements)
const ALLOWED_CATEGORIES = ['Coffee', 'Food', 'Frappe', 'Iced', 'Milkshake', 'Smoothie', 'Soda', 'Tea'];

async function findProductByName(client: any, productName: string): Promise<number | null> {
  log(`Searching for product: ${productName}`, "blue");
  
  // Try exact match first
  let products = await client.searchRead<any>(
    "product.product",
    [["name", "=", productName]],
    ["id", "name", "list_price", "categ_id"]
  );
  
  // Try case variations
  if (!products || products.length === 0) {
    products = await client.searchRead<any>(
      "product.product",
      [["name", "ilike", productName]],
      ["id", "name", "list_price", "categ_id"]
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

async function getEligibleProducts(client: any): Promise<Array<{ id: number; name: string; price: number }>> {
  log("Finding eligible products from allowed categories...", "blue");
  
  // Get category IDs
  const categories = await client.searchRead<any>(
    "product.category",
    [["name", "in", ALLOWED_CATEGORIES]],
    ["id", "name"]
  );
  
  if (!categories || categories.length === 0) {
    log("⚠️  No categories found. Will search all products.", "yellow");
  }
  
  const categoryIds = categories.map((c: any) => c.id);
  
  // Get products from allowed categories
  const domain: any[] = [["sale_ok", "=", true], ["active", "=", true]];
  if (categoryIds.length > 0) {
    domain.push(["categ_id", "in", categoryIds]);
  }
  
  const products = await client.searchRead<any>(
    "product.product",
    domain,
    ["id", "name", "list_price", "categ_id"]
  );
  
  if (products && products.length > 0) {
    log(`✅ Found ${products.length} eligible products`, "green");
    return products.map((p: any) => ({
      id: p.id,
      name: p.name,
      price: p.list_price || 0,
    }));
  }
  
  return [];
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
  originalPrice: number
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
  
  if (existing && existing.length > 0) {
    // Update existing item
    const itemId = existing[0].id;
    await client.rpc("product.pricelist.item", "write", [[itemId], {
      compute_price: "percentage",
      percent_price: DISCOUNT_PERCENTAGE,
    }]);
    log(`✅ Updated: ${productName} → ${DISCOUNT_PERCENTAGE}% off (${originalPrice} EGP → ${originalPrice * (1 - DISCOUNT_PERCENTAGE / 100)} EGP)`, "green");
  } else {
    // Create new item
    await client.rpc("product.pricelist.item", "create", [{
      pricelist_id: pricelistId,
      product_id: productId,
      compute_price: "percentage",
      percent_price: DISCOUNT_PERCENTAGE,
    }]);
    log(`✅ Created: ${productName} → ${DISCOUNT_PERCENTAGE}% off (${originalPrice} EGP → ${originalPrice * (1 - DISCOUNT_PERCENTAGE / 100)} EGP)`, "green");
  }
}

async function main() {
  logSection("🚀 HAPPY HOUR DEALS PRICELIST SETUP");
  
  try {
    const client = createOdooClient();
    if (!client) {
      log("❌ Odoo client not configured", "red");
      process.exit(1);
    }
    
    log("Testing Odoo connection...", "blue");
    const pingResult = await client.ping();
    log(`✅ Connected to Odoo (User ID: ${pingResult.uid})`, "green");
    
    // Get product name from command line or use eligible products
    const productName = process.argv[2];
    
    const pricelistId = await createOrFindPricelist(client);
    
    if (productName) {
      // Use specified product
      logSection("Using Specified Product");
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
        await createOrUpdatePricelistItem(
          client,
          pricelistId,
          productId,
          product.name,
          product.list_price || 0
        );
      }
    } else {
      // Show eligible products and let user know they need to specify
      logSection("Eligible Products");
      const eligibleProducts = await getEligibleProducts(client);
      
      if (eligibleProducts.length === 0) {
        log("❌ No eligible products found", "red");
        process.exit(1);
      }
      
      log(`\nFound ${eligibleProducts.length} eligible products:`, "blue");
      eligibleProducts.slice(0, 10).forEach((p, idx) => {
        log(`  ${idx + 1}. ${p.name} (ID: ${p.id}, Price: ${p.price} EGP)`, "blue");
      });
      if (eligibleProducts.length > 10) {
        log(`  ... and ${eligibleProducts.length - 10} more`, "blue");
      }
      
      log("\n📝 To set a product for Happy Hour:", "yellow");
      log(`   npx tsx scripts/create-happy-hour-pricelist.ts "Product Name"`, "yellow");
      log("\n💡 Tip: Create a daily script to rotate products automatically", "yellow");
    }
    
    logSection("✅ SETUP COMPLETE");
    log(`Pricelist ID: ${pricelistId}`, "green");
    log(`Discount: ${DISCOUNT_PERCENTAGE}%`, "green");
    log("Time: Daily 3:00 PM - 6:00 PM (validated server-side)", "green");
    
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


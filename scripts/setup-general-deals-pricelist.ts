import { config } from "dotenv";
import { createOdooClient } from "@/server/utils/odooClient";
import { clampDiscount, isLargeItem } from "@/server/utils/deals/discountValidation";

// Load environment variables
config();

/**
 * Script to create a general deals pricelist with 30% discount
 * 
 * This script:
 * 1. Creates or finds a pricelist named "General Deals"
 * 2. Applies 30% discount to eligible products from allowed categories
 * 3. Respects business rules:
 *    - Regular items (< 100 EGP): Max 30% discount
 *    - Large items (>= 100 EGP): Can go up to 40% (but we'll use 30% for now)
 * 4. Excludes unwanted categories and products
 * 
 * Run: npx tsx scripts/setup-general-deals-pricelist.ts
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

const PRICELIST_NAME = "General Deals";
const DISCOUNT_PERCENTAGE = 30; // 30% discount

// Allowed categories for deals
const ALLOWED_CATEGORIES = [
  'Coffee',
  'Food',
  'Frappe',
  'Iced',
  'Milkshake',
  'Smoothie',
  'Soda',
  'Tea',
];

// Excluded categories
const EXCLUDED_CATEGORIES = [
  'Extras',
  'EXTRA',
  'Services',
  'Offers',
  'Expenses',
  'Toppings',
  'Sauces',
  'Elite Essentials',
];

// Excluded product names (case-insensitive partial match)
const EXCLUDED_PRODUCT_NAMES = [
  'deposit',
  'water',
  'morning bird',
  'chai latte',
];

async function getEligibleProducts(client: any) {
  logSection("Finding Eligible Products");
  
  // Get allowed category IDs
  const allowedCategories = await client.searchRead<any>(
    "product.category",
    [["name", "in", ALLOWED_CATEGORIES]],
    ["id", "name"]
  );
  
  if (!allowedCategories || allowedCategories.length === 0) {
    log("⚠️  No allowed categories found", "yellow");
    return [];
  }
  
  log(`✅ Found ${allowedCategories.length} allowed categories`, "green");
  const allowedCategoryIds = allowedCategories.map((c: any) => c.id);
  
  // Get excluded category IDs
  const excludedCategories = await client.searchRead<any>(
    "product.category",
    [["name", "in", EXCLUDED_CATEGORIES]],
    ["id", "name"]
  );
  const excludedCategoryIds = excludedCategories?.map((c: any) => c.id) || [];
  
  // Get all products from allowed categories
  const products = await client.searchRead<any>(
    "product.product",
    [
      ["sale_ok", "=", true],
      ["active", "=", true],
      ["categ_id", "in", allowedCategoryIds],
    ],
    ["id", "name", "list_price", "categ_id"]
  );
  
  if (!products || products.length === 0) {
    log("⚠️  No products found in allowed categories", "yellow");
    return [];
  }
  
  log(`✅ Found ${products.length} products in allowed categories`, "green");
  
  // Filter out excluded products
  const eligibleProducts = products.filter((p: any) => {
    // Check if category is excluded
    const categoryId = Array.isArray(p.categ_id) ? p.categ_id[0] : p.categ_id;
    if (excludedCategoryIds.includes(categoryId)) {
      return false;
    }
    
    // Check if product name matches excluded names
    const productName = (p.name || "").toLowerCase();
    if (EXCLUDED_PRODUCT_NAMES.some(excluded => productName.includes(excluded.toLowerCase()))) {
      return false;
    }
    
    return true;
  });
  
  log(`✅ ${eligibleProducts.length} products after filtering exclusions`, "green");
  
  return eligibleProducts.map((p: any) => ({
    id: p.id,
    name: p.name,
    price: p.list_price || 0,
    categoryId: Array.isArray(p.categ_id) ? p.categ_id[0] : p.categ_id,
  }));
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
  // Validate and clamp discount based on business rules
  const product = {
    price: originalPrice,
    name: productName,
  };
  
  const clampedDiscount = clampDiscount(DISCOUNT_PERCENTAGE, product);
  
  // Check if item already exists
  const existing = await client.searchRead<any>(
    "product.pricelist.item",
    [
      ["pricelist_id", "=", pricelistId],
      ["product_id", "=", productId],
    ],
    ["id", "percent_price", "compute_price"]
  );
  
  if (existing && existing.length > 0) {
    const item = existing[0];
    // Update existing item
    await client.rpc("product.pricelist.item", "write", [[item.id], {
      compute_price: "percentage",
      percent_price: clampedDiscount,
    }]);
    log(`  ✅ Updated: ${productName} - ${clampedDiscount}% discount (was ${item.percent_price || 'N/A'}%)`, "green");
  } else {
    // Create new item
    await client.rpc("product.pricelist.item", "create", [{
      pricelist_id: pricelistId,
      product_id: productId,
      compute_price: "percentage",
      percent_price: clampedDiscount,
    }]);
    log(`  ✅ Created: ${productName} - ${clampedDiscount}% discount`, "green");
  }
  
  if (clampedDiscount !== DISCOUNT_PERCENTAGE) {
    log(`  ⚠️  Discount clamped from ${DISCOUNT_PERCENTAGE}% to ${clampedDiscount}% (business rules)`, "yellow");
  }
}

async function main() {
  logSection("General Deals Pricelist Setup");
  
  const client = createOdooClient();
  if (!client) {
    log("❌ Failed to create Odoo client. Check your environment variables.", "red");
    process.exit(1);
  }
  
  try {
    // Get eligible products
    const products = await getEligibleProducts(client);
    
    if (products.length === 0) {
      log("❌ No eligible products found. Cannot create pricelist items.", "red");
      process.exit(1);
    }
    
    // Create or find pricelist
    const pricelistId = await createOrFindPricelist(client);
    
    // Create pricelist items
    logSection("Creating/Updating Pricelist Items");
    log(`Setting up ${products.length} products with ${DISCOUNT_PERCENTAGE}% discount...`, "blue");
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const product of products) {
      try {
        await createOrUpdatePricelistItem(
          client,
          pricelistId,
          product.id,
          product.name,
          product.price
        );
        successCount++;
      } catch (error) {
        log(`  ❌ Error processing ${product.name}: ${error instanceof Error ? error.message : String(error)}`, "red");
        errorCount++;
      }
    }
    
    logSection("Summary");
    log(`✅ Successfully processed: ${successCount} products`, "green");
    if (errorCount > 0) {
      log(`⚠️  Errors: ${errorCount} products`, "yellow");
    }
    log(`\n📋 Pricelist "${PRICELIST_NAME}" is ready!`, "blue");
    log(`   - ${successCount} products with ${DISCOUNT_PERCENTAGE}% discount`, "blue");
    log(`   - Discounts respect business rules (max 30% for regular items, max 40% for large items)`, "blue");
    
  } catch (error) {
    log(`❌ Error: ${error instanceof Error ? error.message : String(error)}`, "red");
    console.error(error);
    process.exit(1);
  }
}

main().catch(console.error);


import { config } from "dotenv";
import { createOdooClient } from "@/server/utils/odooClient";

// Load environment variables
config();

/**
 * Script to rotate Happy Hour product daily
 * 
 * This script:
 * 1. Gets all eligible products from allowed categories
 * 2. Selects a random product
 * 3. Updates the Happy Hour Deals pricelist with the new product
 * 
 * Run daily via cron or scheduled task:
 * 0 14 * * * cd /path/to/ELITE && npx tsx scripts/rotate-happy-hour-product.ts
 * (Runs at 2 PM daily, before Happy Hour starts at 3 PM)
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

const PRICELIST_NAME = "Happy Hour Deals";
const DISCOUNT_PERCENTAGE = 20;
const ALLOWED_CATEGORIES = ['Coffee', 'Food', 'Frappe', 'Iced', 'Milkshake', 'Smoothie', 'Soda', 'Tea'];

// Categories that should NEVER appear in deals
const EXCLUDED_CATEGORIES = [
  'Extras', 'EXTRA', 'Services', 'Offers', 'Expenses', 
  'Toppings', 'Sauces', 'Elite Essentials'
];

// Product names that should NEVER appear in deals (case-insensitive partial match)
const EXCLUDED_PRODUCT_NAMES = [
  'deposit', 'water', 'morning bird', 'chai latte'
];

async function getEligibleProducts(client: any): Promise<Array<{ id: number; name: string; price: number }>> {
  log("Finding eligible products from allowed categories...", "blue");
  
  // Get category IDs
  const categories = await client.searchRead<any>(
    "product.category",
    [["name", "in", ALLOWED_CATEGORIES]],
    ["id", "name"]
  );
  
  const categoryIds = categories?.map((c: any) => c.id) || [];
  
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
  
  if (!products || products.length === 0) {
    return [];
  }
  
  // Get category names for exclusion check
  const productCategoryIds = new Set(products.map((p: any) => {
    if (Array.isArray(p.categ_id)) return p.categ_id[0];
    return p.categ_id;
  }).filter(Boolean));
  
  const categoryMap = new Map<number, string>();
  if (productCategoryIds.size > 0) {
    const categoryData = await client.searchRead<any>(
      "product.category",
      [["id", "in", Array.from(productCategoryIds)]],
      ["id", "name"]
    );
    categoryData?.forEach((cat: any) => {
      categoryMap.set(cat.id, cat.name);
    });
  }
  
  // Filter out excluded products
  const filteredProducts = products.filter((p: any) => {
    const productName = (p.name || "").toLowerCase();
    const categoryId = Array.isArray(p.categ_id) ? p.categ_id[0] : p.categ_id;
    const categoryName = categoryId ? categoryMap.get(categoryId) : null;
    
    // Check excluded product names
    if (EXCLUDED_PRODUCT_NAMES.some(excluded => productName.includes(excluded.toLowerCase()))) {
      return false;
    }
    
    // Check excluded categories
    if (categoryName && EXCLUDED_CATEGORIES.some(excluded => 
      categoryName.toLowerCase() === excluded.toLowerCase()
    )) {
      return false;
    }
    
    return true;
  });
  
  if (filteredProducts.length > 0) {
    log(`✅ Found ${filteredProducts.length} eligible products (${products.length - filteredProducts.length} excluded)`, "green");
    return filteredProducts.map((p: any) => ({
      id: p.id,
      name: p.name,
      price: p.list_price || 0,
    }));
  }
  
  return [];
}

async function getPricelistId(client: any): Promise<number | null> {
  const pricelists = await client.searchRead<any>(
    "product.pricelist",
    [["name", "=", PRICELIST_NAME]],
    ["id", "name", "active"]
  );
  
  if (pricelists && pricelists.length > 0) {
    return pricelists[0].id;
  }
  
  return null;
}

async function getCurrentProduct(client: any, pricelistId: number): Promise<number | null> {
  const items = await client.searchRead<any>(
    "product.pricelist.item",
    [
      ["pricelist_id", "=", pricelistId],
      ["product_id", "!=", false],
    ],
    ["id", "product_id"]
  );
  
  if (items && items.length > 0) {
    const productId = Array.isArray(items[0].product_id) 
      ? items[0].product_id[0] 
      : items[0].product_id;
    return productId;
  }
  
  return null;
}

async function updatePricelistItem(
  client: any,
  pricelistId: number,
  productId: number,
  productName: string,
  originalPrice: number
): Promise<void> {
  // Remove all existing items
  const existingItems = await client.searchRead<any>(
    "product.pricelist.item",
    [["pricelist_id", "=", pricelistId]],
    ["id"]
  );
  
  if (existingItems && existingItems.length > 0) {
    const itemIds = existingItems.map((item: any) => item.id);
    await client.rpc("product.pricelist.item", "unlink", [itemIds]);
    log(`Removed ${itemIds.length} old item(s)`, "blue");
  }
  
  // Create new item with selected product
  await client.rpc("product.pricelist.item", "create", [{
    pricelist_id: pricelistId,
    product_id: productId,
    compute_price: "percentage",
    percent_price: DISCOUNT_PERCENTAGE,
  }]);
  
  const dealPrice = originalPrice * (1 - DISCOUNT_PERCENTAGE / 100);
  log(`✅ Updated Happy Hour: ${productName} → ${DISCOUNT_PERCENTAGE}% off (${originalPrice} EGP → ${dealPrice.toFixed(2)} EGP)`, "green");
}

function selectRandomProduct(products: Array<{ id: number; name: string; price: number }>): { id: number; name: string; price: number } {
  if (products.length === 0) {
    throw new Error("No products available");
  }
  
  const randomIndex = Math.floor(Math.random() * products.length);
  return products[randomIndex];
}

async function main() {
  logSection("🔄 ROTATING HAPPY HOUR PRODUCT");
  
  try {
    const client = createOdooClient();
    if (!client) {
      log("❌ Odoo client not configured", "red");
      process.exit(1);
    }
    
    log("Testing Odoo connection...", "blue");
    const pingResult = await client.ping();
    log(`✅ Connected to Odoo (User ID: ${pingResult.uid})`, "green");
    
    // Get pricelist
    const pricelistId = await getPricelistId(client);
    if (!pricelistId) {
      log(`❌ Pricelist "${PRICELIST_NAME}" not found. Create it first.`, "red");
      log(`   Run: npx tsx scripts/create-happy-hour-pricelist.ts`, "yellow");
      process.exit(1);
    }
    
    // Get current product
    const currentProductId = await getCurrentProduct(client, pricelistId);
    
    // Get eligible products
    const eligibleProducts = await getEligibleProducts(client);
    
    if (eligibleProducts.length === 0) {
      log("❌ No eligible products found", "red");
      process.exit(1);
    }
    
    // Filter out current product to avoid selecting the same one
    const availableProducts = currentProductId
      ? eligibleProducts.filter(p => p.id !== currentProductId)
      : eligibleProducts;
    
    if (availableProducts.length === 0) {
      log("⚠️  Only one product available, using it anyway", "yellow");
      availableProducts.push(...eligibleProducts);
    }
    
    // Select random product
    logSection("Selecting Random Product");
    const selectedProduct = selectRandomProduct(availableProducts);
    log(`Selected: ${selectedProduct.name} (ID: ${selectedProduct.id})`, "green");
    
    // Update pricelist
    logSection("Updating Pricelist");
    await updatePricelistItem(
      client,
      pricelistId,
      selectedProduct.id,
      selectedProduct.name,
      selectedProduct.price
    );
    
    logSection("✅ ROTATION COMPLETE");
    log(`Product: ${selectedProduct.name}`, "green");
    log(`Discount: ${DISCOUNT_PERCENTAGE}%`, "green");
    log(`Time: Daily 3:00 PM - 6:00 PM`, "green");
    
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


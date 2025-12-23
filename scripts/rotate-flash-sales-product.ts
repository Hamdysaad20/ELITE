import { config } from "dotenv";
import { createOdooClient } from "@/server/utils/odooClient";

// Load environment variables
config();

/**
 * Script to rotate Flash Sales product daily
 * 
 * This script:
 * 1. Gets all eligible products from allowed categories
 * 2. Selects a random product
 * 3. Selects a random discount (30-50%)
 * 4. Updates the Flash Sales pricelist with the new product and discount
 * 
 * Run daily via cron or scheduled task:
 * 0 13 * * * cd /path/to/ELITE && npx tsx scripts/rotate-flash-sales-product.ts
 * (Runs at 1 PM daily, before Flash Sales starts at 2 PM)
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

const PRICELIST_NAME = "Flash Sales";
const MIN_DISCOUNT = 30; // Minimum 30%
const MAX_DISCOUNT = 40; // Maximum 40% (business rule: no discount over 40%)
const LARGE_ITEM_MIN_PRICE = 100; // Products >= 100 EGP are considered "large items"
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
  originalPrice: number,
  discountPercentage: number
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
  
  // Create new item with selected product and discount
  await client.rpc("product.pricelist.item", "create", [{
    pricelist_id: pricelistId,
    product_id: productId,
    compute_price: "percentage",
    percent_price: discountPercentage,
  }]);
  
  const dealPrice = originalPrice * (1 - discountPercentage / 100);
  log(`✅ Updated Flash Sales: ${productName} → ${discountPercentage}% off (${originalPrice} EGP → ${dealPrice.toFixed(2)} EGP)`, "green");
}

function selectRandomProduct(products: Array<{ id: number; name: string; price: number }>): { id: number; name: string; price: number } {
  if (products.length === 0) {
    throw new Error("No products available");
  }
  
  const randomIndex = Math.floor(Math.random() * products.length);
  return products[randomIndex];
}

function selectRandomDiscount(productPrice: number): number {
  // Business rules:
  // 1. No discount can exceed 40%
  // 2. Discounts > 30% are only for large items (price >= 100 EGP)
  
  const isLargeItem = productPrice >= LARGE_ITEM_MIN_PRICE;
  
  if (isLargeItem) {
    // Large items can have 30-40% discount
    return Math.floor(Math.random() * (MAX_DISCOUNT - MIN_DISCOUNT + 1)) + MIN_DISCOUNT;
  } else {
    // Small items can only have up to 30% discount
    const maxForSmall = 30;
    return Math.floor(Math.random() * (maxForSmall - MIN_DISCOUNT + 1)) + MIN_DISCOUNT;
  }
}

async function main() {
  logSection("🔄 ROTATING FLASH SALES PRODUCT");
  
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
      log(`   Run: npx tsx scripts/create-flash-sales-pricelist.ts "Product Name" 40`, "yellow");
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
    
    // Select random product and discount
    logSection("Selecting Random Product & Discount");
    const selectedProduct = selectRandomProduct(availableProducts);
    let selectedDiscount = selectRandomDiscount(selectedProduct.price);
    
    const isLargeItem = selectedProduct.price >= LARGE_ITEM_MIN_PRICE;
    log(`Selected Product: ${selectedProduct.name} (ID: ${selectedProduct.id}, Price: ${selectedProduct.price} EGP)`, "green");
    log(`Item Type: ${isLargeItem ? "Large Item" : "Regular Item"}`, isLargeItem ? "blue" : "yellow");
    
    // Validate discount rules (double-check, should already be handled by selectRandomDiscount)
    if (selectedDiscount > 40) {
      log(`⚠️  WARNING: Discount exceeds 40% limit! Clamping to 40%`, "yellow");
      selectedDiscount = 40;
    }
    if (selectedDiscount > 30 && !isLargeItem) {
      log(`⚠️  WARNING: Discount > 30% only allowed for large items! Clamping to 30%`, "yellow");
      selectedDiscount = 30;
    }
    
    log(`Selected Discount: ${selectedDiscount}%`, "green");
    
    // Update pricelist
    logSection("Updating Pricelist");
    await updatePricelistItem(
      client,
      pricelistId,
      selectedProduct.id,
      selectedProduct.name,
      selectedProduct.price,
      selectedDiscount
    );
    
    logSection("✅ ROTATION COMPLETE");
    log(`Product: ${selectedProduct.name}`, "green");
    log(`Discount: ${selectedDiscount}%`, "green");
    log(`Time: Daily 2:00 PM - 3:00 PM (1-hour window)`, "green");
    
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


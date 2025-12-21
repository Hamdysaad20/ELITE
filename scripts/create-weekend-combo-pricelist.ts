import { config } from "dotenv";
import { createOdooClient } from "@/server/utils/odooClient";

// Load environment variables
config();

/**
 * Script to create Weekend Specials (Combo Deals) pricelist in Odoo
 * 
 * This script:
 * 1. Creates or finds a pricelist named "Weekend Specials"
 * 2. Creates combo deals with fixed bundle prices (max 30% discount)
 * 3. Example: Latte + Cheese Sandwich = 120 EGP
 * 
 * Note: Combo deals are created as fixed-price pricelist items
 * Time validation (Sat & Sun all day) is handled in the application layer
 * 
 * Run: npx tsx scripts/create-weekend-combo-pricelist.ts
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

const PRICELIST_NAME = "Weekend Specials";
const MAX_COMBO_DISCOUNT = 30; // Max 30% for combos
const ALLOWED_CATEGORIES = ['Coffee', 'Food', 'Frappe', 'Iced', 'Milkshake', 'Smoothie', 'Soda', 'Tea'];

async function findProductsByName(client: any, productNames: string[]): Promise<Array<{ id: number; name: string; price: number }>> {
  const products: Array<{ id: number; name: string; price: number }> = [];
  
  for (const productName of productNames) {
    log(`Searching for product: ${productName}`, "blue");
    
    let found = await client.searchRead<any>(
      "product.product",
      [["name", "=", productName]],
      ["id", "name", "list_price"]
    );
    
    if (!found || found.length === 0) {
      found = await client.searchRead<any>(
        "product.product",
        [["name", "ilike", productName]],
        ["id", "name", "list_price"]
      );
    }
    
    if (found && found.length > 0) {
      const product = found[0];
      log(`✅ Found: ${product.name} (ID: ${product.id}, Price: ${product.list_price} EGP)`, "green");
      products.push({
        id: product.id,
        name: product.name,
        price: product.list_price || 0,
      });
    } else {
      log(`❌ Product not found: ${productName}`, "red");
    }
  }
  
  return products;
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

async function createComboDeal(
  client: any,
  pricelistId: number,
  comboName: string,
  productIds: number[],
  comboPrice: number
): Promise<void> {
  if (productIds.length < 2) {
    log(`❌ Combo must have at least 2 products`, "red");
    return;
  }
  
  // Get product prices to calculate original total
  const products = await client.searchRead<any>(
    "product.product",
    [["id", "in", productIds]],
    ["id", "name", "list_price"]
  );
  
  if (!products || products.length !== productIds.length) {
    log(`❌ Could not find all products for combo`, "red");
    return;
  }
  
  const originalTotal = products.reduce((sum: number, p: any) => sum + (p.list_price || 0), 0);
  const discountPercent = originalTotal > 0
    ? ((originalTotal - comboPrice) / originalTotal) * 100
    : 0;
  
  // Validate discount (max 30% for combos)
  if (discountPercent > MAX_COMBO_DISCOUNT) {
    log(`⚠️  Discount ${discountPercent.toFixed(1)}% exceeds max ${MAX_COMBO_DISCOUNT}% for combos. Clamping...`, "yellow");
    const clampedPrice = originalTotal * (1 - MAX_COMBO_DISCOUNT / 100);
    comboPrice = Math.round(clampedPrice * 100) / 100;
  }
  
  // Create pricelist items for each product in the combo
  // Each product gets the same fixed price (comboPrice / number of items)
  const pricePerItem = comboPrice / productIds.length;
  
  for (const productId of productIds) {
    await client.rpc("product.pricelist.item", "create", [{
      pricelist_id: pricelistId,
      product_id: productId,
      compute_price: "fixed",
      fixed_price: pricePerItem,
    }]);
  }
  
  log(`✅ Created combo: ${comboName}`, "green");
  log(`   Products: ${products.map((p: any) => p.name).join(" + ")}`, "blue");
  log(`   Original: ${originalTotal.toFixed(2)} EGP → Combo: ${comboPrice.toFixed(2)} EGP`, "blue");
  log(`   Discount: ${((originalTotal - comboPrice) / originalTotal * 100).toFixed(1)}%`, "blue");
}

async function main() {
  logSection("🚀 WEEKEND SPECIALS (COMBO DEALS) PRICELIST SETUP");
  
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
    
    // Example combos - modify product names to match your actual products
    logSection("Creating Combo Deals");
    log("Creating example combos. Modify product names to match your inventory.", "yellow");
    
    // Example 1: Coffee + Food combo
    const combo1Products = await findProductsByName(client, ["Latte", "Croissant"]);
    if (combo1Products.length >= 2) {
      const comboPrice1 = 100; // Adjust based on actual prices
      await createComboDeal(
        client,
        pricelistId,
        "Latte + Croissant Combo",
        combo1Products.map(p => p.id),
        comboPrice1
      );
    } else {
      log("⚠️  Skipping combo 1: Products not found", "yellow");
    }
    
    // Example 2: Another combo (uncomment and modify as needed)
    // const combo2Products = await findProductsByName(client, ["Cappuccino", "Sandwich"]);
    // if (combo2Products.length >= 2) {
    //   const comboPrice2 = 120;
    //   await createComboDeal(
    //     client,
    //     pricelistId,
    //     "Cappuccino + Sandwich Combo",
    //     combo2Products.map(p => p.id),
    //     comboPrice2
    //   );
    // }
    
    log("\n💡 To add more combos:", "yellow");
    log("   1. Find product names in Odoo → Products", "yellow");
    log("   2. Update this script with actual product names", "yellow");
    log("   3. Set appropriate combo prices (max 30% discount)", "yellow");
    
    logSection("✅ SETUP COMPLETE");
    log(`Pricelist ID: ${pricelistId}`, "green");
    log(`Time: Saturday & Sunday, all day (validated server-side)`, "green");
    log(`Max Discount: ${MAX_COMBO_DISCOUNT}%`, "green");
    log(`\n💡 To add more combos, modify this script or create them manually in Odoo.`, "yellow");
    
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


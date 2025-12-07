import { createOdooClient, OdooClient } from "../src/server/utils/odooClient";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Phase 1.2: Categorize uncategorized products
 * 
 * This script:
 * 1. Lists all uncategorized products
 * 2. Archives "Extra X" products that should be attributes
 * 3. Assigns proper categories to remaining products
 */

interface OdooClientWithRpc extends OdooClient {
  rpc<T = any>(model: string, method: string, args?: any[], kwargs?: Record<string, unknown>): Promise<T>;
}

// Category IDs from investigation
const CATEGORIES = {
  HOT_COFFEE: 13,      // Hot Drinks/Coffee
  HOT_TEA: 14,         // Hot Drinks/Tea
  ICED_DRINKS: 18,     // Iced Drinks
  FRAPPE: 19,          // Specialty Drinks/Frappe
  MILKSHAKE: 20,       // Specialty Drinks/Milkshakes
  SMOOTHIE: 21,        // Specialty Drinks/Smoothies
  FOOD: 26,            // Food
  GOODS: 23,           // Goods
  ALL: 1,              // All (uncategorized)
};

// Products that should be archived (they're extras/add-ons, not products)
const PRODUCTS_TO_ARCHIVE = [
  "Extra whip cream",
  "Extra Shot",
  "Coconut Milk",
  "Oat Milk",
  "Almond Milk",
  "Soy Milk",
  "[EXTRA]Coconut Milk",
  "EXTRA Flavor",
  "Extra Honey",
  "Extra Ice Cream Scoop",
  "Premium topping",
  "extra Marshmello",
  "EXTRA BOBA",
  "OPEN REGESTER",
  "Discount",
  "Discount 30%",
  // Add more as discovered
];

// Categorization rules based on product name
const CATEGORIZATION_RULES: Array<{ pattern: RegExp | string; category: number; }> = [
  // Sodas -> Goods (Specialty Drinks category would be better but keeping with existing)
  { pattern: /soda/i, category: CATEGORIES.GOODS },
  { pattern: "Boba", category: CATEGORIES.ICED_DRINKS },
  { pattern: "Hibiscus", category: CATEGORIES.HOT_TEA },
  { pattern: "Black Cat", category: CATEGORIES.ICED_DRINKS }, // Assuming specialty drink
  { pattern: "ice Flavours", category: CATEGORIES.ICED_DRINKS },
  { pattern: "Golden Peach Sunrise", category: CATEGORIES.ICED_DRINKS },
  { pattern: "Raspberry & Pineapple", category: CATEGORIES.ICED_DRINKS },
  
  // Smoothies
  { pattern: /smoothie/i, category: CATEGORIES.SMOOTHIE },
  
  // Frappes
  { pattern: /frapp[eé]/i, category: CATEGORIES.FRAPPE },
  
  // Milkshakes
  { pattern: /milkshake/i, category: CATEGORIES.MILKSHAKE },
  { pattern: /shake/i, category: CATEGORIES.MILKSHAKE },
  
  // Iced drinks
  { pattern: /^iced/i, category: CATEGORIES.ICED_DRINKS },
  { pattern: /cold brew/i, category: CATEGORIES.ICED_DRINKS },
  
  // Hot tea
  { pattern: /tea/i, category: CATEGORIES.HOT_TEA },
  { pattern: /chai/i, category: CATEGORIES.HOT_TEA },
  { pattern: /matcha.*hot/i, category: CATEGORIES.HOT_TEA },
  
  // Hot coffee - default for espresso based
  { pattern: /espresso/i, category: CATEGORIES.HOT_COFFEE },
  { pattern: /latte/i, category: CATEGORIES.HOT_COFFEE },
  { pattern: /cappuccino/i, category: CATEGORIES.HOT_COFFEE },
  { pattern: /mocha/i, category: CATEGORIES.HOT_COFFEE },
  { pattern: /americano/i, category: CATEGORIES.HOT_COFFEE },
  { pattern: /macchiato/i, category: CATEGORIES.HOT_COFFEE },
  { pattern: /cortado/i, category: CATEGORIES.HOT_COFFEE },
  { pattern: /flat white/i, category: CATEGORIES.HOT_COFFEE },
  { pattern: /turkish/i, category: CATEGORIES.HOT_COFFEE },
  
  // Food
  { pattern: /sandwich/i, category: CATEGORIES.FOOD },
  { pattern: /croissant/i, category: CATEGORIES.FOOD },
  { pattern: /cookie/i, category: CATEGORIES.FOOD },
  { pattern: /cake/i, category: CATEGORIES.FOOD },
  { pattern: /waffle/i, category: CATEGORIES.FOOD },
  { pattern: /pancake/i, category: CATEGORIES.FOOD },
  { pattern: /pastry/i, category: CATEGORIES.FOOD },
  
  // Morning Bird offers -> categorize by content
  { pattern: /Morning Bird.*Amricano/i, category: CATEGORIES.HOT_COFFEE },
];

function matchCategory(productName: string): number | null {
  const name = productName.toLowerCase();
  
  for (const rule of CATEGORIZATION_RULES) {
    if (typeof rule.pattern === "string") {
      if (name.includes(rule.pattern.toLowerCase())) {
        return rule.category;
      }
    } else {
      if (rule.pattern.test(productName)) {
        return rule.category;
      }
    }
  }
  return null;
}

async function main() {
  const odoo = createOdooClient() as OdooClientWithRpc | null;
  if (!odoo) {
    console.error("Odoo not configured");
    process.exit(1);
  }

  console.log("🔍 Scanning for uncategorized products...\n");

  // Get all products with All/uncategorized (category_id is "All" which might be different)
  // Let's check for products that don't have a specific category
  const allProducts = await odoo.searchRead(
    "product.template",
    [["active", "=", true], ["sale_ok", "=", true]],
    ["id", "name", "categ_id", "list_price"]
  );
  
  // Filter to only those without a specific category or in root "All" category
  const uncategorizedProducts = allProducts.filter(p => {
    if (!p.categ_id) return true;
    const catName = p.categ_id[1];
    return catName === "All" || catName === "No Category" || !catName.includes("/");
  });

  console.log(`Found ${uncategorizedProducts.length} uncategorized products:\n`);

  const toArchive: any[] = [];
  const toCategorize: Array<{ product: any; newCategory: number }> = [];
  const unresolved: any[] = [];

  for (const product of uncategorizedProducts) {
    // Check if it should be archived
    const shouldArchive = PRODUCTS_TO_ARCHIVE.some(
      p => product.name.toLowerCase().includes(p.toLowerCase())
    );

    if (shouldArchive) {
      toArchive.push(product);
      console.log(`🗄️  Archive: "${product.name}" (ID: ${product.id}) - Should be an attribute`);
    } else {
      // Try to categorize
      const category = matchCategory(product.name);
      if (category) {
        toCategorize.push({ product, newCategory: category });
        console.log(`📁 Categorize: "${product.name}" (ID: ${product.id}) -> Category ${category}`);
      } else {
        unresolved.push(product);
        console.log(`❓ Unknown: "${product.name}" (ID: ${product.id}) - Manual review needed`);
      }
    }
  }

  console.log("\n--- Summary ---");
  console.log(`To Archive: ${toArchive.length}`);
  console.log(`To Categorize: ${toCategorize.length}`);
  console.log(`Unresolved: ${unresolved.length}`);

  if (toArchive.length === 0 && toCategorize.length === 0) {
    console.log("\n✅ Nothing to do!");
    return;
  }

  console.log("\n⚠️  Will apply changes in 5 seconds. Press Ctrl+C to cancel...\n");
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Archive products
  let archived = 0;
  for (const product of toArchive) {
    try {
      await odoo.rpc("product.template", "write", [[product.id], { active: false }]);
      console.log(`   ✅ Archived: "${product.name}"`);
      archived++;
    } catch (err: any) {
      console.error(`   ❌ Failed to archive "${product.name}": ${err.message}`);
    }
  }

  // Categorize products
  let categorized = 0;
  for (const { product, newCategory } of toCategorize) {
    try {
      await odoo.rpc("product.template", "write", [[product.id], { categ_id: newCategory }]);
      console.log(`   ✅ Categorized: "${product.name}" -> Category ${newCategory}`);
      categorized++;
    } catch (err: any) {
      console.error(`   ❌ Failed to categorize "${product.name}": ${err.message}`);
    }
  }

  console.log(`\n✅ Done! Archived: ${archived}, Categorized: ${categorized}`);
  
  if (unresolved.length > 0) {
    console.log(`\n⚠️  ${unresolved.length} products need manual review:`);
    for (const p of unresolved) {
      console.log(`   - "${p.name}" (ID: ${p.id})`);
    }
  }
}

main().catch(console.error);

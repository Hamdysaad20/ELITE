import { createOdooClient, OdooClient } from "../src/server/utils/odooClient";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Phase 2.2: Recategorize products and cleanup
 */

interface OdooClientWithRpc extends OdooClient {
  rpc<T = any>(model: string, method: string, args?: any[], kwargs?: Record<string, unknown>): Promise<T>;
}

// Category moves
const CATEGORY_MOVES: Array<{
  productPattern: string;
  newCategoryId: number;
}> = [
  // Move Frappes from Coffee to Frappe category
  { productPattern: "coffee frappé", newCategoryId: 19 },
  { productPattern: "mocha frappé", newCategoryId: 19 },
  // Move Iced variants to Iced category
  { productPattern: "matcha latte (iced)", newCategoryId: 18 },
  { productPattern: "spanish latte (iced)", newCategoryId: 18 },
];

// Products to archive (POS items that aren't drinks)
const PRODUCTS_TO_ARCHIVE = [
  "cup", // POS item
];

async function main() {
  const odoo = createOdooClient() as OdooClientWithRpc | null;
  if (!odoo) {
    console.error("Odoo not configured");
    process.exit(1);
  }

  console.log("🔧 Phase 2.2: Recategorizing products...\n");

  // Get all products
  const products = await odoo.searchRead(
    "product.template",
    [["active", "=", true], ["sale_ok", "=", true]],
    ["id", "name", "categ_id"]
  );

  // 1. Move products to correct categories
  console.log("1️⃣ Moving products to correct categories...\n");

  for (const move of CATEGORY_MOVES) {
    const matchingProducts = products.filter(p => 
      p.name.toLowerCase().includes(move.productPattern.toLowerCase())
    );

    for (const product of matchingProducts) {
      const currentCat = product.categ_id?.[1] || "None";
      
      // Get new category name
      const newCat = await odoo.searchRead(
        "product.category",
        [["id", "=", move.newCategoryId]],
        ["name"]
      );
      const newCatName = newCat[0]?.name || "Unknown";

      if (product.categ_id?.[0] !== move.newCategoryId) {
        try {
          await odoo.rpc("product.template", "write", [[product.id], { categ_id: move.newCategoryId }]);
          console.log(`   ✅ "${product.name}": ${currentCat} → ${newCatName}`);
        } catch (err: any) {
          console.error(`   ❌ "${product.name}": ${err.message}`);
        }
      } else {
        console.log(`   ⏭️ "${product.name}": Already in ${newCatName}`);
      }
    }
  }

  // 2. Archive POS items
  console.log("\n2️⃣ Archiving POS-only items...\n");

  for (const pattern of PRODUCTS_TO_ARCHIVE) {
    const matchingProducts = products.filter(p => 
      p.name.toLowerCase() === pattern.toLowerCase()
    );

    for (const product of matchingProducts) {
      try {
        await odoo.rpc("product.template", "write", [[product.id], { active: false }]);
        console.log(`   🗄️ Archived: "${product.name}"`);
      } catch (err: any) {
        console.error(`   ❌ "${product.name}": ${err.message}`);
      }
    }
  }

  // 3. Verify final state
  console.log("\n3️⃣ Final category distribution:\n");
  
  const finalProducts = await odoo.searchRead(
    "product.template",
    [["active", "=", true], ["sale_ok", "=", true]],
    ["id", "name", "categ_id"]
  );

  const byCategory: Record<string, number> = {};
  for (const p of finalProducts) {
    const cat = p.categ_id?.[1] || "No Category";
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  }

  for (const [cat, count] of Object.entries(byCategory).sort()) {
    console.log(`   📁 ${cat}: ${count} products`);
  }

  console.log(`\n✅ Total active products: ${finalProducts.length}`);
}

main().catch(console.error);

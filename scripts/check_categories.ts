import { createOdooClient } from "../src/server/utils/odooClient";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const odoo = createOdooClient();
  if (!odoo) {
    console.error("Odoo not configured");
    process.exit(1);
  }

  // Get all active products with their categories
  const products = await odoo.searchRead(
    "product.template",
    [["active", "=", true], ["sale_ok", "=", true]],
    ["id", "name", "categ_id"]
  );

  // Group by category
  const byCategory: Record<string, string[]> = {};
  for (const p of products) {
    const catName = p.categ_id ? p.categ_id[1] : "No Category";
    if (!byCategory[catName]) byCategory[catName] = [];
    byCategory[catName].push(p.name);
  }

  console.log("Products by Category:\n");
  for (const [cat, prods] of Object.entries(byCategory)) {
    console.log(`📁 ${cat} (${prods.length} products):`);
    for (const p of prods) {
      console.log(`   - ${p}`);
    }
    console.log();
  }
  
  console.log(`\nTotal: ${products.length} active products`);
}

main().catch(console.error);

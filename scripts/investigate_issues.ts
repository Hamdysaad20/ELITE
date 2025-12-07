import { createOdooClient, OdooClient } from "../src/server/utils/odooClient";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Investigate current product state and identify issues
 */

interface OdooClientWithRpc extends OdooClient {
  rpc<T = any>(model: string, method: string, args?: any[], kwargs?: Record<string, unknown>): Promise<T>;
}

async function main() {
  const odoo = createOdooClient() as OdooClientWithRpc | null;
  if (!odoo) {
    console.error("Odoo not configured");
    process.exit(1);
  }

  console.log("🔍 Investigating current product state...\n");

  // 1. Check for duplicate product names
  console.log("=" .repeat(60));
  console.log("1️⃣ DUPLICATE PRODUCT NAMES");
  console.log("=" .repeat(60));
  
  const allProducts = await odoo.searchRead(
    "product.template",
    [["active", "=", true], ["sale_ok", "=", true]],
    ["id", "name", "categ_id"]
  );

  const nameCount: Record<string, any[]> = {};
  for (const p of allProducts) {
    const key = p.name.toLowerCase().trim();
    if (!nameCount[key]) nameCount[key] = [];
    nameCount[key].push(p);
  }

  const duplicates = Object.entries(nameCount).filter(([_, items]) => items.length > 1);
  if (duplicates.length > 0) {
    console.log(`\n⚠️ Found ${duplicates.length} duplicate names:\n`);
    for (const [name, items] of duplicates) {
      console.log(`   "${items[0].name}":`);
      for (const p of items) {
        console.log(`      - ID ${p.id} in ${p.categ_id?.[1] || 'No Category'}`);
      }
    }
  } else {
    console.log("\n✅ No duplicate product names found");
  }

  // 2. Get all categories
  console.log("\n" + "=" .repeat(60));
  console.log("2️⃣ CURRENT CATEGORIES");
  console.log("=" .repeat(60));
  
  const categories = await odoo.searchRead(
    "product.category",
    [],
    ["id", "name", "parent_id"]
  );
  
  console.log("\nAll categories:");
  for (const cat of categories) {
    const parent = cat.parent_id ? ` (parent: ${cat.parent_id[1]})` : "";
    console.log(`   ${cat.id}: "${cat.name}"${parent}`);
  }

  // 3. Check product attributes - find mismatches
  console.log("\n" + "=" .repeat(60));
  console.log("3️⃣ PRODUCT ATTRIBUTE ANALYSIS");
  console.log("=" .repeat(60));

  // Products that shouldn't have certain attributes
  const ATTRIBUTE_RULES: Record<string, { exclude: string[]; include: string[] }> = {
    // Turkish coffee - no milk, no espresso shots, no foam
    "turkish": { exclude: ["milk", "espresso shots", "foam", "flavor"], include: ["size", "sugar level"] },
    // Tea - no espresso, no milk (except chai/matcha)
    "classic tea": { exclude: ["milk", "espresso shots", "foam", "flavor"], include: ["size", "sugar level"] },
    "hibiscus": { exclude: ["milk", "espresso shots", "foam", "flavor"], include: ["size", "sugar level"] },
    // Smoothies - no espresso, no milk type choice
    "smoothie": { exclude: ["espresso shots", "milk", "foam"], include: ["size"] },
    // Sodas/Refreshers - minimal attributes
    "soda": { exclude: ["milk", "espresso shots", "foam", "flavor", "sugar level"], include: ["size"] },
    "water": { exclude: ["milk", "espresso shots", "foam", "flavor", "sugar level", "size"], include: [] },
  };

  // Get all attribute lines
  const attrLines = await odoo.searchRead(
    "product.template.attribute.line",
    [],
    ["id", "product_tmpl_id", "attribute_id"]
  );

  // Get attributes
  const attributes = await odoo.searchRead("product.attribute", [], ["id", "name"]);
  const attrById: Record<number, string> = {};
  for (const a of attributes) {
    attrById[a.id] = a.name.toLowerCase();
  }

  // Group by product
  const attrsByProduct: Record<number, Set<string>> = {};
  for (const line of attrLines) {
    const tmplId = line.product_tmpl_id[0];
    if (!attrsByProduct[tmplId]) attrsByProduct[tmplId] = new Set();
    attrsByProduct[tmplId].add(attrById[line.attribute_id[0]] || "unknown");
  }

  console.log("\n⚠️ Products with potentially wrong attributes:\n");

  const issues: Array<{product: any; wrongAttrs: string[]; missingAttrs: string[]}> = [];

  for (const product of allProducts) {
    const productName = product.name.toLowerCase();
    const productAttrs = attrsByProduct[product.id] || new Set();

    for (const [pattern, rules] of Object.entries(ATTRIBUTE_RULES)) {
      if (productName.includes(pattern)) {
        const wrongAttrs = rules.exclude.filter(attr => productAttrs.has(attr));
        const missingAttrs = rules.include.filter(attr => !productAttrs.has(attr));
        
        if (wrongAttrs.length > 0 || missingAttrs.length > 0) {
          issues.push({ product, wrongAttrs, missingAttrs });
          console.log(`   📦 "${product.name}" (${product.categ_id?.[1]})`);
          console.log(`      Current attrs: ${[...productAttrs].join(", ") || "none"}`);
          if (wrongAttrs.length > 0) {
            console.log(`      ❌ Should NOT have: ${wrongAttrs.join(", ")}`);
          }
          if (missingAttrs.length > 0) {
            console.log(`      ⚠️ Should have: ${missingAttrs.join(", ")}`);
          }
          console.log();
        }
        break;
      }
    }
  }

  // 4. Products by category with their attributes
  console.log("\n" + "=" .repeat(60));
  console.log("4️⃣ ALL PRODUCTS WITH ATTRIBUTES BY CATEGORY");
  console.log("=" .repeat(60));

  const byCategory: Record<string, any[]> = {};
  for (const p of allProducts) {
    const cat = p.categ_id?.[1] || "No Category";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push({
      ...p,
      attrs: [...(attrsByProduct[p.id] || [])].sort()
    });
  }

  for (const [cat, products] of Object.entries(byCategory).sort()) {
    console.log(`\n📁 ${cat} (${products.length} products)`);
    for (const p of products) {
      const attrStr = p.attrs.length > 0 ? p.attrs.join(", ") : "NO ATTRS";
      console.log(`   - ${p.name}`);
      console.log(`     [${attrStr}]`);
    }
  }

  // 5. Summary
  console.log("\n" + "=" .repeat(60));
  console.log("📊 SUMMARY");
  console.log("=" .repeat(60));
  console.log(`\nTotal active products: ${allProducts.length}`);
  console.log(`Products with duplicate names: ${duplicates.reduce((sum, [_, items]) => sum + items.length, 0)}`);
  console.log(`Products with attribute issues: ${issues.length}`);
  console.log(`Categories: ${categories.length}`);
}

main().catch(console.error);

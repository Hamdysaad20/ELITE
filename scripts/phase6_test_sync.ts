import { createOdooClient, OdooClient } from "../src/server/utils/odooClient";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Phase 6: Frontend Sync Test
 * 
 * Verifies that product data can be synced correctly for the frontend
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

  console.log("🔍 Testing frontend sync data...\n");

  // 1. Get products with attributes
  const products = await odoo.searchRead(
    "product.product",
    [["active", "=", true], ["sale_ok", "=", true]],
    ["id", "name", "list_price", "categ_id", "product_tmpl_id"]
  );

  console.log(`✅ Found ${products.length} active products\n`);

  // 2. Get template attribute values (for pricing)
  const templateIds = [...new Set(products.map(p => p.product_tmpl_id?.[0]).filter(Boolean))];
  
  const attrValues = await odoo.searchRead(
    "product.template.attribute.value",
    [["product_tmpl_id", "in", templateIds]],
    ["id", "name", "price_extra", "product_tmpl_id", "attribute_id", "product_attribute_value_id"]
  );

  console.log(`✅ Found ${attrValues.length} attribute values across templates\n`);

  // 3. Group by template and show sample
  const byTemplate: Record<number, any[]> = {};
  for (const av of attrValues) {
    const tmplId = av.product_tmpl_id[0];
    if (!byTemplate[tmplId]) byTemplate[tmplId] = [];
    byTemplate[tmplId].push(av);
  }

  // Show sample of 5 products with their attributes
  console.log("📋 Sample products with attributes:\n");
  
  let shown = 0;
  for (const p of products) {
    if (shown >= 5) break;
    
    const tmplId = p.product_tmpl_id?.[0];
    const attrs = byTemplate[tmplId] || [];
    
    if (attrs.length > 0) {
      console.log(`📦 ${p.name} (${p.list_price} EGP)`);
      console.log(`   Category: ${p.categ_id?.[1]}`);
      console.log(`   Attributes:`);
      
      // Group by attribute name
      const byAttr: Record<string, any[]> = {};
      for (const a of attrs) {
        const attrName = a.attribute_id[1];
        if (!byAttr[attrName]) byAttr[attrName] = [];
        byAttr[attrName].push(a);
      }
      
      for (const [attrName, values] of Object.entries(byAttr)) {
        const valueStrs = values.map(v => {
          const price = v.price_extra > 0 ? ` (+${v.price_extra})` : "";
          return `${v.product_attribute_value_id[1]}${price}`;
        }).join(", ");
        console.log(`      ${attrName}: ${valueStrs}`);
      }
      
      console.log();
      shown++;
    }
  }

  // 4. Categories summary
  const categories = await odoo.searchRead(
    "product.category",
    [["active", "=", true]],
    ["id", "name", "parent_id"]
  );

  console.log(`\n📁 Categories (${categories.length} total):`);
  for (const cat of categories) {
    const parentName = cat.parent_id ? ` (parent: ${cat.parent_id[1]})` : "";
    console.log(`   ${cat.id}: ${cat.name}${parentName}`);
  }

  console.log("\n✅ Phase 6 complete! Data is ready for frontend sync.");
}

main().catch(console.error);

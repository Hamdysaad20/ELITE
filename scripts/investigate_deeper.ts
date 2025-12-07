import { createOdooClient } from '../src/server/utils/odooClient';
import dotenv from 'dotenv';

dotenv.config();

const CATEGORY_MAPPING = {
  13: "Coffee",
  14: "Tea",
  18: "Iced",
  19: "Frappe",
  20: "Milkshake",
  21: "Smoothie",
  23: "Refreshers",
  26: "Food",
  25: "Services"
};

const ATTRIBUTES = {
  WHIPPED_CREAM: 33,
  DRIZZLE: 34,
  FOAM: 35,
  TEMPERATURE: 32
};

async function investigateDeeper() {
  const odoo = createOdooClient();
  // await odoo.connect();
  console.log("🕵️  Deep Investigation Started...\n");

  // 1. Fetch all active products
  const products = await (odoo as any).searchRead('product.template', 
    [['active', '=', true]], 
    ['id', 'name', 'categ_id', 'attribute_line_ids']
  );

  // 2. Fetch attribute lines to know what attributes they have
  const productIds = products.map((p: any) => p.id);
  const attributeLines = await (odoo as any).searchRead('product.template.attribute.line',
    [['product_tmpl_id', 'in', productIds]],
    ['product_tmpl_id', 'attribute_id', 'value_ids']
  );

  // Map attributes to products
  const productAttributes = {};
  attributeLines.forEach((line: any) => {
    const pId = line.product_tmpl_id[0];
    if (!productAttributes[pId]) productAttributes[pId] = [];
    productAttributes[pId].push({
      id: line.attribute_id[0],
      name: line.attribute_id[1]
    });
  });

  const issues: string[] = [];
  const warnings: string[] = [];

  // 3. Analyze
  for (const p of products) {
    const catId = p.categ_id[0];
    const catName = CATEGORY_MAPPING[catId] || p.categ_id[1];
    const attrs = productAttributes[p.id] || [];
    const attrIds = attrs.map((a: any) => a.id);

    // --- Naming Typos & Inconsistencies ---
    if (p.name.match(/Macchiat$/i)) {
      issues.push(`❌ Typo in name: "${p.name}" (ends with 'Macchiat')`);
    }
    if (p.name.match(/Icee/i)) {
      issues.push(`❌ Typo in name: "${p.name}" (contains 'Icee')`);
    }
    if (p.name.match(/Amricano/i)) {
      issues.push(`❌ Typo in name: "${p.name}" (contains 'Amricano')`);
    }
    if (p.name.match(/Flavours/i)) { // British spelling vs American? Or just generic name?
      warnings.push(`⚠️ Generic name: "${p.name}" (contains 'Flavours')`);
    }

    // --- Category Logic Checks ---
    
    // Frappe Consistency
    if (catName === 'Frappe') {
      if (!attrIds.includes(ATTRIBUTES.WHIPPED_CREAM)) {
        issues.push(`❌ Frappe missing Whipped Cream: "${p.name}"`);
      }
      if (!attrIds.includes(ATTRIBUTES.DRIZZLE)) {
        issues.push(`❌ Frappe missing Drizzle: "${p.name}"`);
      }
      if (attrIds.includes(ATTRIBUTES.FOAM)) {
        issues.push(`❓ Frappe has Foam (unusual): "${p.name}"`);
      }
    }

    // Tea Category Oddities
    if (catName === 'Tea') {
      if (p.name.toLowerCase().includes('steak')) {
        issues.push(`❌ Food item in Tea category: "${p.name}"`);
      }
    }

    // Iced Category Consistency
    if (catName === 'Iced') {
      // Check for Boba candidates
      if (p.name.toLowerCase().includes('boba') || p.name.toLowerCase().includes('bubble')) {
        warnings.push(`ℹ️ Boba candidate in Iced: "${p.name}" (Should move to Boba category?)`);
      }
    }
  }

  console.log("=== 🚨 DETECTED ISSUES ===");
  if (issues.length === 0) console.log("No critical issues found.");
  issues.forEach(i => console.log(i));

  console.log("\n=== ⚠️ WARNINGS / SUGGESTIONS ===");
  if (warnings.length === 0) console.log("No warnings found.");
  warnings.forEach(w => console.log(w));

}

investigateDeeper().catch(console.error);

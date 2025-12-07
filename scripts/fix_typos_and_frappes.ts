import { createOdooClient } from '../src/server/utils/odooClient';
import dotenv from 'dotenv';

dotenv.config();

const ATTRIBUTES = {
  WHIPPED_CREAM: 33,
  DRIZZLE: 34,
  FOAM: 35
};

const CATEGORIES = {
  FOOD: 26
};

async function fixTyposAndFrappes() {
  const odoo = createOdooClient();
  console.log("🔧 Starting Fixes for Typos and Frappe Attributes...\n");

  // 1. Fix Typos
  const typoFixes = [
    { search: "Morning Bird Offer Amricano", replace: "Morning Bird Offer Americano" },
    { search: "Iced Macchiat", replace: "Iced Macchiato" },
    { search: "Icee Chocolate", replace: "Iced Chocolate" }
  ];

  for (const fix of typoFixes) {
    const products = await (odoo as any).searchRead('product.template', [['name', '=', fix.search]], ['id', 'name']);
    if (products.length > 0) {
      const p = products[0];
      console.log(`📝 Renaming "${p.name}" -> "${fix.replace}"`);
      await (odoo as any).rpc('product.template', 'write', [[p.id], { name: fix.replace }]);
    } else {
      console.log(`⚠️ Product "${fix.search}" not found (maybe already fixed?)`);
    }
  }

  // 1.5 Fetch Attribute Values
  const whippedCreamValues = await (odoo as any).searchRead('product.attribute.value', [['attribute_id', '=', ATTRIBUTES.WHIPPED_CREAM]], ['id', 'name']);
  const drizzleValues = await (odoo as any).searchRead('product.attribute.value', [['attribute_id', '=', ATTRIBUTES.DRIZZLE]], ['id', 'name']);
  
  const whippedCreamValueIds = whippedCreamValues.map((v: any) => v.id);
  const drizzleValueIds = drizzleValues.map((v: any) => v.id);

  console.log(`   Found ${whippedCreamValueIds.length} Whipped Cream values and ${drizzleValueIds.length} Drizzle values.`);

  // 2. Fix Frappe Attributes (Coffee Frappé, Mocha Frappé)
  const frappesToFix = ["Coffee Frappé", "Mocha Frappé"];
  for (const name of frappesToFix) {
    const products = await (odoo as any).searchRead('product.template', [['name', '=', name]], ['id', 'name', 'attribute_line_ids']);
    if (products.length > 0) {
      const p = products[0];
      console.log(`🥤 Fixing attributes for "${p.name}"...`);
      
      // Get current attribute lines
      const lines = await (odoo as any).searchRead('product.template.attribute.line', 
        [['product_tmpl_id', '=', p.id]], 
        ['attribute_id']
      );
      
      const currentAttrIds = lines.map((l: any) => l.attribute_id[0]);
      const lineIdsToRemove: number[] = [];

      // Identify Foam line to remove
      const foamLine = lines.find((l: any) => l.attribute_id[0] === ATTRIBUTES.FOAM);
      if (foamLine) {
        console.log(`   - Removing Foam`);
        lineIdsToRemove.push(foamLine.id);
      }

      if (lineIdsToRemove.length > 0) {
        await (odoo as any).rpc('product.template.attribute.line', 'unlink', [lineIdsToRemove]);
      }

      // Add Whipped Cream if missing
      if (!currentAttrIds.includes(ATTRIBUTES.WHIPPED_CREAM)) {
        console.log(`   - Adding Whipped Cream`);
        await (odoo as any).rpc('product.template.attribute.line', 'create', [{
          product_tmpl_id: p.id,
          attribute_id: ATTRIBUTES.WHIPPED_CREAM,
          value_ids: [[6, 0, whippedCreamValueIds]]
        }]);
      }

      // Add Drizzle if missing
      if (!currentAttrIds.includes(ATTRIBUTES.DRIZZLE)) {
        console.log(`   - Adding Drizzle`);
        await (odoo as any).rpc('product.template.attribute.line', 'create', [{
          product_tmpl_id: p.id,
          attribute_id: ATTRIBUTES.DRIZZLE,
          value_ids: [[6, 0, drizzleValueIds]]
        }]);
      }
    }
  }

  // 3. Move KINDER STEAK to Food
  const kinderSteak = await (odoo as any).searchRead('product.template', [['name', 'ilike', 'KINDER STEAK']], ['id', 'name', 'categ_id']);
  if (kinderSteak.length > 0) {
    const p = kinderSteak[0];
    if (p.categ_id[0] !== CATEGORIES.FOOD) {
      console.log(`🍔 Moving "${p.name}" to Food category`);
      await (odoo as any).rpc('product.template', 'write', [[p.id], { categ_id: CATEGORIES.FOOD }]);
    }
  }

  console.log("\n✅ Fixes Completed.");
}

fixTyposAndFrappes().catch(console.error);

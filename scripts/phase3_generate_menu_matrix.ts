import { createOdooClient } from "../src/server/utils/odooClient";
import dotenv from "dotenv";

dotenv.config();

async function generateMenuMatrix() {
  const odoo = createOdooClient();
  if (!odoo) {
    console.error("Odoo not configured");
    process.exit(1);
  }

  console.log("📋 Generating Menu Matrix for Cashier Training...\n");

  // Get all active products with their categories and attributes
  const products = await (odoo as any).searchRead(
    'product.template',
    [['active', '=', true]],
    ['id', 'name', 'categ_id', 'attribute_line_ids']
  );

  // Get all categories
  const categories = await (odoo as any).searchRead(
    'product.category',
    [],
    ['id', 'name']
  );
  const categoryMap = Object.fromEntries(categories.map((c: any) => [c.id, c.name]));

  // Get all attributes
  const attributes = await (odoo as any).searchRead(
    'product.attribute',
    [],
    ['id', 'name']
  );
  const attributeMap = Object.fromEntries(attributes.map((a: any) => [a.id, a.name]));

  console.log("| Product | Category | Milk Options | Flavor Options | Shot Options | Special Notes |");
  console.log("|---------|----------|--------------|----------------|--------------|---------------|");

  const categoryOrder = ['Coffee', 'Iced', 'Frappe', 'Milkshake', 'Smoothie', 'Boba', 'Tea', 'Food', 'Refreshers'];

  for (const catName of categoryOrder) {
    const categoryProducts = products.filter((p: any) => categoryMap[p.categ_id[0]] === catName);
    
    if (categoryProducts.length === 0) continue;

    for (const product of categoryProducts) {
      const lines = await (odoo as any).searchRead(
        'product.template.attribute.line',
        [['product_tmpl_id', '=', product.id]],
        ['attribute_id', 'value_ids']
      );

      // Get attribute values for this product
      const productAttrs: Record<string, string[]> = {};
      for (const line of lines) {
        const attrName = attributeMap[line.attribute_id[0]];
        const values = await (odoo as any).searchRead(
          'product.attribute.value',
          [['id', 'in', line.value_ids]],
          ['name']
        );
        productAttrs[attrName] = values.map((v: any) => v.name).slice(0, 3); // Limit to first 3 for readability
      }

      const milkOptions = productAttrs['milk'] || ['N/A'];
      const flavorOptions = productAttrs['Flavor'] || ['N/A'];
      const shotOptions = productAttrs['Espresso Shots'] || ['N/A'];

      // Special notes based on product
      let notes = '';
      if (product.name.includes('Turkish')) notes = 'Traditional recipe';
      if (product.name.includes('Spanish Latte')) notes = 'Condensed milk base';
      if (product.name.includes('Frappe')) notes = 'Whip + drizzle included';
      if (product.name.includes('BOBA')) notes = 'Toppings available';
      if (shotOptions.length === 1 && shotOptions[0] === 'No Shot') notes = 'No caffeine';
      if (milkOptions.length === 1 && milkOptions[0] === 'No Milk') notes = 'Black coffee';

      console.log(`| ${product.name} | ${catName} | ${milkOptions.join(', ')} | ${flavorOptions.join(', ')} | ${shotOptions.join(', ')} | ${notes} |`);
    }
  }

  console.log("\n✨ Menu matrix generated. Copy this table for cashier training materials.");
}

generateMenuMatrix().catch((err) => {
  console.error(err);
  process.exit(1);
});
/**
 * Verify POS setup and mark more products as available
 */

import { createOdooClient } from '../src/server/utils/odooClient';

async function main() {
  const odoo = createOdooClient();
  
  console.log('[INFO] Checking current POS product distribution...\n');
  
  const templates = await odoo.searchRead(
    'product.template',
    [['available_in_pos', '=', true]],
    ['id', 'name', 'categ_id', 'pos_categ_ids'],
    { limit: 1000 }
  );
  
  console.log(`Total products available in POS: ${templates.length}\n`);
  
  // Group by POS category
  const byPosCategory = new Map<string, number>();
  let withoutPosCategory = 0;
  
  templates.forEach((t: any) => {
    if (!t.pos_categ_ids || t.pos_categ_ids.length === 0) {
      withoutPosCategory++;
    } else {
      // Get the POS category name (we'll fetch it)
      const categId = t.pos_categ_ids[0];
      byPosCategory.set(String(categId), (byPosCategory.get(String(categId)) || 0) + 1);
    }
  });
  
  console.log('Products by POS category ID:');
  Array.from(byPosCategory.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([id, count]) => {
      console.log(`  Category ${id}: ${count} products`);
    });
  
  if (withoutPosCategory > 0) {
    console.log(`  NO CATEGORY: ${withoutPosCategory} products ⚠️`);
  }
  
  console.log('\n[INFO] Checking all saleable products...\n');
  
  const allSaleable = await odoo.searchRead(
    'product.template',
    [
      ['sale_ok', '=', true],
      ['active', '=', true],
      ['type', '!=', 'service'] // Exclude pure services
    ],
    ['id', 'name', 'categ_id', 'available_in_pos'],
    { limit: 1000, order: 'categ_id,name' }
  );
  
  console.log(`Total active saleable products: ${allSaleable.length}`);
  
  const notInPos = allSaleable.filter((p: any) => !p.available_in_pos);
  console.log(`Products NOT in POS: ${notInPos.length}\n`);
  
  if (notInPos.length > 0) {
    // Group by category
    const byCategory = new Map<string, any[]>();
    notInPos.forEach((p: any) => {
      const categName = p.categ_id ? p.categ_id[1] : 'NO CATEGORY';
      if (!byCategory.has(categName)) {
        byCategory.set(categName, []);
      }
      byCategory.get(categName)!.push(p);
    });
    
    console.log('Products not in POS by category:');
    Array.from(byCategory.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .forEach(([categ, products]) => {
        console.log(`\n  ${categ} (${products.length} products):`);
        products.slice(0, 5).forEach((p: any) => {
          console.log(`    - [${p.id}] ${p.name}`);
        });
        if (products.length > 5) {
          console.log(`    ... and ${products.length - 5} more`);
        }
      });
    
    // Ask if we should add them
    console.log('\n[INFO] Would you like to add these products to POS?');
    console.log('Products in our short categories that are NOT in POS:\n');
    
    const categoryNames = ['Coffee', 'Tea', 'Iced', 'Frappe', 'Milkshake', 'Smoothie', 'Soda', 'Food', 'Extras', 'Services', 'Offers'];
    const toAdd = notInPos.filter((p: any) => {
      const categName = p.categ_id ? p.categ_id[1] : '';
      return categoryNames.includes(categName);
    });
    
    console.log(`Found ${toAdd.length} products in our categories that should be in POS:`);
    toAdd.forEach((p: any) => {
      const categName = p.categ_id ? p.categ_id[1] : 'NO CATEGORY';
      console.log(`  - [${p.id}] ${p.name} (${categName})`);
    });
  }
}

main().catch(console.error);

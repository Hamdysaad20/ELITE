/**
 * Link products to correct pos.category based on their product.category
 */

import { createOdooClient } from '../src/server/utils/odooClient';

// Map product.category names to pos.category names
const CATEGORY_MAP: Record<string, string> = {
  'Coffee': 'Coffee',
  'Tea': 'Tea',
  'Iced': 'Iced',
  'Frappe': 'Frappe',
  'Milkshake': 'Milkshake',
  'Smoothie': 'Smoothie',
  'Soda': 'Soda',
  'Food': 'Food',
  'Extras': 'Extras',
  'Services': 'Services',
  'Offers': 'Offers',
};

async function main() {
  const odoo = createOdooClient();
  
  console.log('[INFO] Step 1: Getting all pos.category IDs...\n');
  
  const posCategories = await odoo.searchRead(
    'pos.category',
    [],
    ['id', 'name']
  );
  
  const posCategoryMap = new Map(posCategories.map((c: any) => [c.name, c.id]));
  console.log(`Found ${posCategories.length} pos.category records`);
  
  console.log('\n[INFO] Step 2: Getting all product.category IDs...\n');
  
  const productCategories = await odoo.searchRead(
    'product.category',
    [],
    ['id', 'name']
  );
  
  const productCategoryMap = new Map(productCategories.map((c: any) => [c.name, c.id]));
  console.log(`Found ${productCategories.length} product.category records`);
  
  console.log('\n[INFO] Step 3: Getting products available in POS...\n');
  
  const templates = await odoo.searchRead(
    'product.template',
    [['available_in_pos', '=', true]],
    ['id', 'name', 'categ_id', 'pos_categ_ids'],
    { limit: 1000 }
  );
  
  console.log(`Found ${templates.length} templates in POS\n`);
  
  console.log('[INFO] Step 4: Linking products to pos.category...\n');
  
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const template of templates) {
    const productCategName = template.categ_id ? template.categ_id[1] : null;
    
    if (!productCategName) {
      console.log(`  ⚠ [${template.id}] ${template.name} -> No product.category, skipping`);
      skipped++;
      continue;
    }
    
    // Find matching pos.category
    const posCategName = CATEGORY_MAP[productCategName];
    if (!posCategName) {
      console.log(`  ⚠ [${template.id}] ${template.name} -> No mapping for "${productCategName}", skipping`);
      skipped++;
      continue;
    }
    
    const posCategId = posCategoryMap.get(posCategName);
    if (!posCategId) {
      console.log(`  ✗ [${template.id}] ${template.name} -> POS category "${posCategName}" not found!`);
      errors++;
      continue;
    }
    
    // Check if already set
    const currentPosCategs = template.pos_categ_ids || [];
    if (currentPosCategs.includes(posCategId)) {
      // Already has the correct category
      continue;
    }
    
    try {
      // Set pos_categ_ids to this category (many2many replace)
      await odoo.rpc(
        'product.template',
        'write',
        [[template.id], { pos_categ_ids: [[6, 0, [posCategId]]] }]
      );
      
      console.log(`  ✓ [${template.id}] ${template.name} -> ${posCategName} (ID: ${posCategId})`);
      updated++;
    } catch (err: any) {
      console.log(`  ✗ [${template.id}] ${template.name} -> ERROR: ${err.message.split('\n')[0]}`);
      errors++;
    }
  }
  
  console.log('\n[SUMMARY]');
  console.log(`Total products: ${templates.length}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);
  
  if (updated > 0) {
    console.log('\n✅ Products linked to POS categories!');
    console.log('💡 Refresh your POS session to see products appear.');
  }
}

main().catch(console.error);

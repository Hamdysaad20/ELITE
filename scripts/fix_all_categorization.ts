/**
 * Fix categorization for all 36 products and prepare for POS
 */

import { createOdooClient } from '../src/server/utils/odooClient';

async function main() {
  const odoo = createOdooClient();
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  FIX PRODUCT CATEGORIZATION & SETUP POS');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  // Get all categories
  const allCategories = await odoo.searchRead(
    'product.category',
    [],
    ['id', 'name']
  );
  
  const categoryMap = new Map(allCategories.map((c: any) => [c.name, c.id]));
  
  console.log('[INFO] Available categories:');
  allCategories.forEach((c: any) => console.log(`  - ${c.name} (ID: ${c.id})`));
  console.log();
  
  // Define fixes needed
  const fixes = [
    // Smoothie
    { id: 641, name: 'Raspberry & Pineapple', newCategory: 'Smoothie', reason: 'Smoothie product' },
    
    // Food
    { id: 724, name: 'Cookie', newCategory: 'Food', reason: 'Food item' },
    
    // Tea
    { id: 775, name: 'Chai Flavours ', newCategory: 'Tea', reason: 'Tea flavoring' },
    
    // Iced
    { id: 776, name: 'Ice Flavors', newCategory: 'Iced', reason: 'Iced drink flavoring' },
    
    // Offers
    { id: 759, name: '20% on your order', newCategory: 'Offers', reason: 'Discount offer' },
    { id: 785, name: 'Morning Bird Offer "Turkish/Espresso" D', newCategory: 'Offers', reason: 'Morning offer' },
    { id: 782, name: 'Morning Bird Offer L/C', newCategory: 'Offers', reason: 'Morning offer' },
    { id: 780, name: '✨ Bestie Offer ✨ BOBA CHOCOLATE', newCategory: 'Offers', reason: 'Promotional offer' },
    { id: 774, name: '✨ Bestie Offer ✨ BOBA SPANISH LATTE', newCategory: 'Offers', reason: 'Promotional offer' },
    
    // Extras
    { id: 791, name: 'KINDER STEAK Single', newCategory: 'Extras', reason: 'Topping/extra' },
  ];
  
  console.log(`[INFO] Fixing ${fixes.length} categorization issues...\n`);
  
  let fixed = 0;
  let failed = 0;
  
  for (const fix of fixes) {
    const categoryId = categoryMap.get(fix.newCategory);
    
    if (!categoryId) {
      console.log(`  ✗ [${fix.id}] ${fix.name} -> Category "${fix.newCategory}" not found!`);
      failed++;
      continue;
    }
    
    try {
      await odoo.rpc(
        'product.template',
        'write',
        [[fix.id], { categ_id: categoryId }]
      );
      
      console.log(`  ✓ [${fix.id}] ${fix.name} -> ${fix.newCategory} (${fix.reason})`);
      fixed++;
    } catch (err: any) {
      console.log(`  ✗ [${fix.id}] ${fix.name} -> ERROR: ${err.message.split('\n')[0]}`);
      failed++;
    }
  }
  
  console.log(`\n[STEP 1 COMPLETE] Fixed: ${fixed}, Failed: ${failed}\n`);
  
  // Step 2: Mark ALL products as available in POS
  console.log('[STEP 2] Marking all products as available in POS...\n');
  
  const allProducts = await odoo.searchRead(
    'product.template',
    [['active', '=', true]],
    ['id', 'name', 'available_in_pos']
  );
  
  const notInPos = allProducts.filter((p: any) => !p.available_in_pos);
  
  if (notInPos.length > 0) {
    console.log(`Found ${notInPos.length} products not available in POS\n`);
    
    const ids = notInPos.map((p: any) => p.id);
    
    try {
      await odoo.rpc(
        'product.template',
        'write',
        [ids, { available_in_pos: true }]
      );
      
      console.log(`✓ Marked ${ids.length} products as available_in_pos\n`);
    } catch (err: any) {
      console.log(`✗ Failed to update: ${err.message.split('\n')[0]}\n`);
    }
  } else {
    console.log('✓ All products already available in POS\n');
  }
  
  // Step 3: Link products to pos.category
  console.log('[STEP 3] Linking products to POS categories...\n');
  
  const posCategories = await odoo.searchRead(
    'pos.category',
    [],
    ['id', 'name']
  );
  
  const posCategoryMap = new Map(posCategories.map((c: any) => [c.name, c.id]));
  
  const updatedProducts = await odoo.searchRead(
    'product.template',
    [['available_in_pos', '=', true]],
    ['id', 'name', 'categ_id', 'pos_categ_ids']
  );
  
  let linked = 0;
  let skipped = 0;
  
  for (const product of updatedProducts) {
    const productCategName = product.categ_id ? product.categ_id[1] : null;
    
    if (!productCategName) {
      skipped++;
      continue;
    }
    
    const posCategId = posCategoryMap.get(productCategName);
    
    if (!posCategId) {
      skipped++;
      continue;
    }
    
    // Check if already linked
    const currentPosCategs = product.pos_categ_ids || [];
    if (currentPosCategs.includes(posCategId)) {
      continue; // Already linked
    }
    
    try {
      await odoo.rpc(
        'product.template',
        'write',
        [[product.id], { pos_categ_ids: [[6, 0, [posCategId]]] }]
      );
      
      linked++;
    } catch (err: any) {
      skipped++;
    }
  }
  
  console.log(`✓ Linked ${linked} products to POS categories\n`);
  if (skipped > 0) {
    console.log(`  (${skipped} products skipped - already linked or no matching category)\n`);
  }
  
  // Final summary
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  FINAL STATUS');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const finalProducts = await odoo.searchRead(
    'product.template',
    [['available_in_pos', '=', true]],
    ['id', 'name', 'categ_id', 'pos_categ_ids']
  );
  
  const byCategory = new Map<string, number>();
  finalProducts.forEach((p: any) => {
    const categ = p.categ_id ? p.categ_id[1] : 'NO CATEGORY';
    byCategory.set(categ, (byCategory.get(categ) || 0) + 1);
  });
  
  console.log(`Total products in POS: ${finalProducts.length}\n`);
  console.log('Distribution by category:');
  Array.from(byCategory.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([categ, count]) => {
      console.log(`  ${categ}: ${count} products`);
    });
  
  console.log('\n✅ All done! Products are categorized and ready for POS.\n');
  console.log('Next step: Refresh your POS session to see the changes.\n');
}

main().catch(console.error);

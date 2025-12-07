/**
 * Archive platform defaults and ensure all old products are migrated
 */

import { createOdooClient } from '../src/server/utils/odooClient';

async function main() {
  const odoo = createOdooClient();
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  CLEANUP & FINAL MIGRATION');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  // Get all products
  const allProducts = await odoo.searchRead(
    'product.template',
    [],
    ['id', 'name', 'default_code', 'active', 'categ_id', 'list_price']
  );
  
  console.log(`[INFO] Found ${allProducts.length} total products in Odoo\n`);
  
  // STEP 1: Archive platform defaults and unwanted products
  console.log('[STEP 1] Archiving platform defaults and unwanted items...\n');
  
  const toArchive = [
    'Deposit',
    'Prepayment',
    'Down Payment',
    'Advance Payment',
    'Product',
    'Service',
    'Consumable',
    'All / Expenses',
    'All / Sales',
    'All',
    'OPEN REGESTER', // Typo in old system
  ];
  
  let archived = 0;
  
  for (const product of allProducts) {
    const shouldArchive = toArchive.some(term => 
      product.name.toLowerCase().includes(term.toLowerCase())
    ) || product.name.trim() === '' || product.name.trim().length < 2;
    
    if (shouldArchive && product.active) {
      try {
        await odoo.rpc(
          'product.template',
          'write',
          [[product.id], { active: false }]
        );
        console.log(`  🗑️  Archived: ${product.name} (ID: ${product.id})`);
        archived++;
      } catch (err: any) {
        console.log(`  ✗ Failed to archive ${product.name}: ${err.message.split('\n')[0]}`);
      }
    }
  }
  
  console.log(`\n  Total archived: ${archived} products\n`);
  
  // STEP 2: Get categories
  const allCategories = await odoo.searchRead(
    'product.category',
    [],
    ['id', 'name']
  );
  
  const categoryMap = new Map(allCategories.map((c: any) => [c.name, c.id]));
  
  const posCategories = await odoo.searchRead(
    'pos.category',
    [],
    ['id', 'name']
  );
  
  const posCategoryMap = new Map(posCategories.map((c: any) => [c.name, c.id]));
  
  // STEP 3: Add any remaining missing products from old list
  console.log('[STEP 2] Checking for remaining missing products...\n');
  
  const existingProducts = await odoo.searchRead(
    'product.template',
    [['active', '=', true]],
    ['name', 'default_code']
  );
  
  const existingNames = new Set(existingProducts.map((p: any) => p.name.toLowerCase().trim()));
  const existingSKUs = new Set(existingProducts.map((p: any) => p.default_code).filter(Boolean));
  
  // Additional products that might be missing
  const additionalProducts = [
    // Specialty drinks from old list
    { name: 'Espresso Avocado', price: 60, category: 'Coffee', sku: 'SPEC001' },
    { name: 'French Coffee', price: 50, category: 'Coffee', sku: 'SPEC002' },
    { name: 'Hazelnut Coffee', price: 55, category: 'Coffee', sku: 'SPEC003' },
    
    // More specialty items that may have been missed
    { name: 'AMERICANO - M', price: 70, category: 'Coffee', sku: 'AMER-M' },
    
    // Services that might be missing
    { name: 'Gift Card', price: 50, category: 'Services', sku: 'GIFT' },
    { name: 'Top-up eWallet', price: 50, category: 'Services', sku: 'EWALLET' },
  ];
  
  let added = 0;
  let skipped = 0;
  
  for (const product of additionalProducts) {
    const nameCheck = product.name.toLowerCase().trim();
    
    if (existingNames.has(nameCheck) || (product.sku && existingSKUs.has(product.sku))) {
      skipped++;
      continue;
    }
    
    const categoryId = categoryMap.get(product.category);
    const posCategId = posCategoryMap.get(product.category);
    
    if (!categoryId) {
      console.log(`  ✗ [SKIP] ${product.name} - Category not found`);
      continue;
    }
    
    try {
      const productData: any = {
        name: product.name,
        list_price: product.price,
        categ_id: categoryId,
        type: 'consu',
        available_in_pos: true,
        default_code: product.sku,
      };
      
      if (posCategId) {
        productData.pos_categ_ids = [[6, 0, [posCategId]]];
      }
      
      const newId = await odoo.rpc(
        'product.template',
        'create',
        [productData]
      );
      
      console.log(`  ✓ [${newId}] ${product.name} -> ${product.category}`);
      added++;
      existingNames.add(nameCheck);
      if (product.sku) existingSKUs.add(product.sku);
      
    } catch (err: any) {
      console.log(`  ✗ ${product.name} - ${err.message.split('\n')[0]}`);
    }
  }
  
  console.log(`\n  Added: ${added}, Skipped: ${skipped}\n`);
  
  // STEP 4: Final verification
  console.log('[STEP 3] Final verification...\n');
  
  const finalProducts = await odoo.searchRead(
    'product.template',
    [['available_in_pos', '=', true]],
    ['id', 'name', 'categ_id', 'list_price']
  );
  
  const byCategory = new Map<string, any[]>();
  finalProducts.forEach((p: any) => {
    const categ = p.categ_id ? p.categ_id[1] : 'NO CATEGORY';
    if (!byCategory.has(categ)) {
      byCategory.set(categ, []);
    }
    byCategory.get(categ)!.push(p);
  });
  
  console.log(`Total products in POS: ${finalProducts.length}\n`);
  console.log('Distribution by category:');
  
  const sortedCategories = Array.from(byCategory.entries())
    .sort((a, b) => b[1].length - a[1].length);
  
  for (const [categ, products] of sortedCategories) {
    console.log(`\n  ${categ}: ${products.length} products`);
    
    // Show a few examples
    const examples = products.slice(0, 3).map(p => `${p.name} (${p.list_price} EGP)`).join(', ');
    if (products.length > 3) {
      console.log(`    Examples: ${examples}, ...`);
    } else {
      console.log(`    ${examples}`);
    }
  }
  
  // Check for potential issues
  console.log('\n[QUALITY CHECK]');
  
  const noCategoryProducts = finalProducts.filter((p: any) => !p.categ_id || p.categ_id[1] === 'NO CATEGORY');
  if (noCategoryProducts.length > 0) {
    console.log(`  ⚠️  ${noCategoryProducts.length} products without proper category`);
  } else {
    console.log(`  ✓ All products properly categorized`);
  }
  
  const zeroPrice = finalProducts.filter((p: any) => p.list_price === 0 && !p.name.toLowerCase().includes('offer') && !p.name.toLowerCase().includes('discount') && !p.name.toLowerCase().includes('custom'));
  if (zeroPrice.length > 0) {
    console.log(`  ⚠️  ${zeroPrice.length} products with 0 price (excluding offers/discounts)`);
    zeroPrice.slice(0, 5).forEach((p: any) => {
      console.log(`      - ${p.name}`);
    });
  } else {
    console.log(`  ✓ All products have appropriate prices`);
  }
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  CLEANUP COMPLETE');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`  🗑️  Archived: ${archived} platform defaults`);
  console.log(`  ✓ Active in POS: ${finalProducts.length} products`);
  console.log(`  ✓ Categories: ${byCategory.size}`);
  console.log('\n✅ Your menu is ready! Refresh POS to see changes.\n');
}

main().catch(console.error);

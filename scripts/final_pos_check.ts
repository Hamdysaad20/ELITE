/**
 * Final POS verification - check if POS should be working
 */

import { createOdooClient } from '../src/server/utils/odooClient';

async function main() {
  const odoo = createOdooClient();
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  POS CONFIGURATION STATUS CHECK');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  // 1. Check POS Config
  console.log('[1/4] POS Configuration...');
  const posConfigs = await odoo.searchRead(
    'pos.config',
    [],
    ['id', 'name', 'iface_available_categ_ids'],
    { limit: 1 }
  );
  
  if (posConfigs.length === 0) {
    console.log('  ❌ No POS configuration found!\n');
    return;
  }
  
  const posConfig = posConfigs[0];
  console.log(`  ✅ POS: ${posConfig.name}`);
  console.log(`  📁 Configured categories: ${posConfig.iface_available_categ_ids?.length || 0}`);
  
  if (!posConfig.iface_available_categ_ids || posConfig.iface_available_categ_ids.length === 0) {
    console.log('  ⚠️  WARNING: All categories will be shown (unconfigured)\n');
  } else {
    console.log(`  ✅ Category filter active: ${posConfig.iface_available_categ_ids.join(', ')}\n`);
  }
  
  // 2. Check POS Categories
  console.log('[2/4] POS Categories...');
  const configuredCategoryIds = posConfig.iface_available_categ_ids || [];
  
  if (configuredCategoryIds.length > 0) {
    const posCategories = await odoo.searchRead(
      'pos.category',
      [['id', 'in', configuredCategoryIds]],
      ['id', 'name']
    );
    
    console.log(`  ✅ ${posCategories.length} categories configured:`);
    posCategories.forEach((cat: any) => {
      console.log(`     • ${cat.name} (ID: ${cat.id})`);
    });
    console.log();
  }
  
  // 3. Check Products
  console.log('[3/4] Products in POS...');
  const posProducts = await odoo.searchRead(
    'product.template',
    [['available_in_pos', '=', true]],
    ['id', 'name', 'categ_id', 'pos_categ_ids'],
    { limit: 1000 }
  );
  
  console.log(`  ✅ ${posProducts.length} products available in POS`);
  
  // Group by POS category
  const byPosCategory = new Map<number, { name: string; count: number }>();
  let withoutCategory = 0;
  
  for (const product of posProducts) {
    if (!product.pos_categ_ids || product.pos_categ_ids.length === 0) {
      withoutCategory++;
    } else {
      const categId = product.pos_categ_ids[0];
      if (!byPosCategory.has(categId)) {
        // Fetch category name
        const cats = await odoo.searchRead(
          'pos.category',
          [['id', '=', categId]],
          ['id', 'name']
        );
        byPosCategory.set(categId, { name: cats[0]?.name || 'Unknown', count: 0 });
      }
      byPosCategory.get(categId)!.count++;
    }
  }
  
  console.log('\n  Distribution by category:');
  Array.from(byPosCategory.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([id, data]) => {
      const configured = configuredCategoryIds.includes(id) ? '✓' : '✗';
      console.log(`     ${configured} ${data.name}: ${data.count} products`);
    });
  
  if (withoutCategory > 0) {
    console.log(`     ⚠️  ${withoutCategory} products without POS category`);
  }
  console.log();
  
  // 4. Final Status
  console.log('[4/4] Overall Status...');
  
  const hasConfig = posConfigs.length > 0;
  const hasCategories = configuredCategoryIds.length > 0;
  const hasProducts = posProducts.length > 0;
  const productsLinked = withoutCategory === 0;
  
  console.log(`  POS Configuration: ${hasConfig ? '✅' : '❌'}`);
  console.log(`  Categories Configured: ${hasCategories ? '✅' : '⚠️ '}`);
  console.log(`  Products Available: ${hasProducts ? '✅' : '❌'}`);
  console.log(`  All Products Categorized: ${productsLinked ? '✅' : '⚠️ '}`);
  
  console.log('\n═══════════════════════════════════════════════════════════');
  
  if (hasConfig && hasProducts) {
    console.log('  ✅ POS IS CONFIGURED AND SHOULD BE WORKING');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('Next steps:');
    console.log('  1. Open POS: https://elitecoffee.odoo.com/pos/ui');
    console.log('  2. Close any existing session');
    console.log('  3. Start a new POS session');
    console.log('  4. You should see your products organized by category\n');
    
    if (!productsLinked) {
      console.log('⚠️  Note: Some products don\'t have POS categories assigned.');
      console.log('   They may not appear in the POS interface.\n');
    }
  } else {
    console.log('  ❌ POS CONFIGURATION INCOMPLETE');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('Issues detected:');
    if (!hasConfig) console.log('  • No POS configuration found');
    if (!hasProducts) console.log('  • No products marked as available_in_pos');
    console.log();
  }
}

main().catch(console.error);

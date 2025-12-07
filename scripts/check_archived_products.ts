/**
 * Check for archived products and prepare restoration plan
 */

import { createOdooClient } from '../src/server/utils/odooClient';

async function main() {
  const odoo = createOdooClient();
  
  console.log('[INFO] Checking for archived products...\n');
  
  // Check archived products
  const archivedProducts = await odoo.searchRead(
    'product.template',
    [['active', '=', false]],
    ['id', 'name', 'categ_id', 'default_code', 'list_price'],
    { limit: 500, order: 'id' }
  );
  
  console.log(`Found ${archivedProducts.length} archived products\n`);
  
  if (archivedProducts.length > 0) {
    console.log('Sample archived products:');
    archivedProducts.slice(0, 20).forEach(p => {
      const categ = p.categ_id ? p.categ_id[1] : 'NO CATEGORY';
      console.log(`  [${p.id}] ${p.name} - ${p.list_price} SAR (${categ}) - SKU: ${p.default_code || 'N/A'}`);
    });
    
    if (archivedProducts.length > 20) {
      console.log(`  ... and ${archivedProducts.length - 20} more\n`);
    }
  }
  
  // Check all active products
  console.log('\n[INFO] Active products:\n');
  
  const activeProducts = await odoo.searchRead(
    'product.template',
    [['active', '=', true]],
    ['id', 'name', 'categ_id'],
    { limit: 100, order: 'name' }
  );
  
  console.log(`Found ${activeProducts.length} active products:`);
  activeProducts.forEach(p => {
    const categ = p.categ_id ? p.categ_id[1] : 'NO CATEGORY';
    console.log(`  [${p.id}] ${p.name} (${categ})`);
  });
  
  console.log('\n[RECOMMENDATION]');
  if (archivedProducts.length > 0) {
    console.log('The missing products were archived. Options:');
    console.log('  1. Restore archived products (set active=true)');
    console.log('  2. Recreate products from the JSON file');
    console.log('  3. Check if products were merged/consolidated\n');
  }
}

main().catch(console.error);

/**
 * Remove size-specific product variants that should be attributes instead
 */

import { createOdooClient } from '../src/server/utils/odooClient';

async function main() {
  const odoo = createOdooClient();
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  REMOVE SIZE-SPECIFIC VARIANTS');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  // Get all products
  const allProducts = await odoo.searchRead(
    'product.template',
    [['active', '=', true]],
    ['id', 'name', 'default_code']
  );
  
  console.log(`[INFO] Checking ${allProducts.length} products...\n`);
  
  // Products to remove (size variants that should be attributes)
  const toRemove = [
    'AMERICANO - M',
    'AMERICANO - L',
    'AMERICANO - S',
  ];
  
  let archived = 0;
  
  for (const product of allProducts) {
    if (toRemove.some(name => product.name.toLowerCase().includes(name.toLowerCase()))) {
      try {
        await odoo.rpc(
          'product.template',
          'write',
          [[product.id], { active: false }]
        );
        console.log(`  🗑️  Archived: ${product.name} (ID: ${product.id})`);
        console.log(`      → This should be a size attribute, not a separate product`);
        archived++;
      } catch (err: any) {
        console.log(`  ✗ Failed to archive ${product.name}: ${err.message.split('\n')[0]}`);
      }
    }
  }
  
  if (archived === 0) {
    console.log('  ℹ️  No size-specific variants found to remove\n');
  } else {
    console.log(`\n  Total archived: ${archived} size variants\n`);
  }
  
  // Verify final count
  const finalProducts = await odoo.searchRead(
    'product.template',
    [['available_in_pos', '=', true]],
    ['id', 'name']
  );
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  CLEANUP COMPLETE');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`  🗑️  Archived: ${archived} size variant(s)`);
  console.log(`  ✓ Active in POS: ${finalProducts.length} products`);
  console.log('\n💡 Note: Size should be implemented as product attributes/variants\n');
  console.log('✅ Done! Refresh POS to see changes.\n');
}

main().catch(console.error);

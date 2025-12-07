/**
 * Configure POS to show only our short categories
 */

import { createOdooClient } from '../src/server/utils/odooClient';

// Our desired short categories
const DESIRED_CATEGORIES = [
  'Coffee',
  'Tea',
  'Iced',
  'Frappe',
  'Milkshake',
  'Smoothie',
  'Soda',
  'Food',
  'Extras',
  'Services',
  'Offers',
];

async function main() {
  const odoo = createOdooClient();
  
  console.log('[INFO] Step 1: Finding our short category IDs...\n');
  
  // Get all pos.category records
  const allCategories = await odoo.searchRead(
    'pos.category',
    [],
    ['id', 'name'],
    { order: 'name' }
  );
  
  // Map our desired categories to IDs
  const categoryMap = new Map(allCategories.map((c: any) => [c.name, c.id]));
  const desiredIds: number[] = [];
  
  console.log('Mapping categories to IDs:');
  for (const catName of DESIRED_CATEGORIES) {
    const id = categoryMap.get(catName);
    if (id) {
      desiredIds.push(id);
      console.log(`  ✓ ${catName} -> ID ${id}`);
    } else {
      console.log(`  ✗ ${catName} -> NOT FOUND`);
    }
  }
  
  console.log(`\nTotal: ${desiredIds.length}/${DESIRED_CATEGORIES.length} categories found`);
  
  console.log('\n[INFO] Step 2: Updating POS configuration...\n');
  
  // Get POS config
  const posConfigs = await odoo.searchRead(
    'pos.config',
    [],
    ['id', 'name', 'iface_available_categ_ids'],
    { limit: 1 }
  );
  
  if (posConfigs.length === 0) {
    console.error('[ERROR] No POS configuration found!');
    return;
  }
  
  const posConfig = posConfigs[0];
  console.log(`POS Config: ${posConfig.name} (ID: ${posConfig.id})`);
  console.log(`Current category IDs: ${posConfig.iface_available_categ_ids || 'ALL (empty)'}`);
  console.log(`New category IDs: ${desiredIds.join(', ')}`);
  
  // Update POS config to restrict to our categories
  await odoo.rpc(
    'pos.config',
    'write',
    [[posConfig.id], { iface_available_categ_ids: [[6, 0, desiredIds]] }]
  );
  
  console.log('\n✅ POS configuration updated!');
  console.log('\n[INFO] Verifying update...\n');
  
  const updated = await odoo.searchRead(
    'pos.config',
    [['id', '=', posConfig.id]],
    ['id', 'name', 'iface_available_categ_ids']
  );
  
  console.log(`Verification: ${updated[0].iface_available_categ_ids.length} categories configured`);
  console.log(`Category IDs: ${updated[0].iface_available_categ_ids.join(', ')}`);
  
  console.log('\n🎯 Done! Only the following categories will appear in POS:');
  DESIRED_CATEGORIES.forEach(name => console.log(`  - ${name}`));
  console.log('\n💡 Please refresh your POS session to see the changes.');
}

main().catch(console.error);

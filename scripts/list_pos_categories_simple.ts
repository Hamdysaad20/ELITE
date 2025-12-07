/**
 * Simple script to list all pos.category records
 */

import { createOdooClient } from '../src/server/utils/odooClient';

async function main() {
  const odoo = createOdooClient();
  
  console.log('[INFO] Fetching all pos.category records...\n');
  
  // Get all records - no domain filter, minimal fields
  const categories = await odoo.searchRead(
    'pos.category',
    [],
    ['id', 'name', 'parent_id', 'sequence'],
    { order: 'sequence,name' }
  );
  
  console.log(`Found ${categories.length} pos.category records:\n`);
  categories.forEach((cat: any) => {
    const parent = cat.parent_id ? ` (parent: ${cat.parent_id[1]})` : '';
    console.log(`  [${cat.id}] ${cat.name}${parent} - seq: ${cat.sequence || 0}`);
  });
  
  console.log('\n[INFO] Checking POS configuration...\n');
  
  // Check POS config
  const posConfigs = await odoo.searchRead(
    'pos.config',
    [],
    ['id', 'name', 'iface_available_categ_ids'],
    { limit: 10 }
  );
  
  console.log(`Found ${posConfigs.length} POS configurations:`);
  posConfigs.forEach((cfg: any) => {
    console.log(`  - ${cfg.name} (ID: ${cfg.id})`);
    if (cfg.iface_available_categ_ids && cfg.iface_available_categ_ids.length > 0) {
      console.log(`    Category IDs configured: ${cfg.iface_available_categ_ids.join(', ')}`);
    } else {
      console.log(`    No category restrictions (all categories shown)`);
    }
  });
}

main().catch(console.error);

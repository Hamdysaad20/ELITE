/**
 * Inspect pos.category model to see available fields
 */

import { createOdooClient } from '../src/server/utils/odooClient';

async function main() {
  const odoo = createOdooClient();
  
  console.log('[INFO] Inspecting pos.category model...\n');
  
  // Get fields metadata
  const fieldsInfo = await odoo.rpc('/web/dataset/call_kw', {
    model: 'pos.category',
    method: 'fields_get',
    args: [],
    kwargs: {}
  });
  
  console.log('Available fields on pos.category:');
  console.log(JSON.stringify(fieldsInfo, null, 2));
  
  console.log('\n[INFO] Fetching all pos.category records...\n');
  
  // Get all records without active filter
  const categories = await odoo.rpc('/web/dataset/call_kw', {
    model: 'pos.category',
    method: 'search_read',
    args: [[]],
    kwargs: {
      fields: ['id', 'name', 'parent_id', 'child_id'],
      order: 'name'
    }
  });
  
  console.log(`Found ${categories.length} pos.category records:`);
  categories.forEach((cat: any) => {
    console.log(`  - [${cat.id}] ${cat.name}`);
    if (cat.parent_id) {
      console.log(`    Parent: ${cat.parent_id[1]}`);
    }
    if (cat.child_id && cat.child_id.length > 0) {
      console.log(`    Children: ${cat.child_id.length}`);
    }
  });
}

main().catch(console.error);

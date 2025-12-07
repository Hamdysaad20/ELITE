/**
 * Restore all essential products from archived state
 * This will unarchive products that we need based on the all_products_list.json
 */

import { createOdooClient } from '../src/server/utils/odooClient';
import * as fs from 'fs';
import * as path from 'path';

interface ProductFromFile {
  id: string;
  name: string;
  price: number;
  category: string;
  sku: string;
}

async function main() {
  const odoo = createOdooClient();
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  RESTORE ARCHIVED PRODUCTS');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  // Load reference file
  const filePath = path.join(process.cwd(), 'data/all_products_list.json');
  const fileProducts: ProductFromFile[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  console.log(`[INFO] Reference file has ${fileProducts.length} products\n`);
  
  // Get all products (active and archived)
  const allProducts = await odoo.searchRead(
    'product.template',
    [],
    ['id', 'name', 'active', 'categ_id', 'list_price', 'default_code'],
    { limit: 5000 }
  );
  
  console.log(`[INFO] Odoo has ${allProducts.length} total products (active + archived)\n`);
  
  const activeCount = allProducts.filter(p => p.active).length;
  const archivedCount = allProducts.filter(p => !p.active).length;
  console.log(`  Active: ${activeCount}`);
  console.log(`  Archived: ${archivedCount}\n`);
  
  // Create map of file products by name
  const fileProductNames = new Set(
    fileProducts.map(p => p.name.toLowerCase().trim())
  );
  
  // Find archived products that exist in the file
  const toRestore = allProducts.filter(p => {
    if (p.active) return false; // Skip already active
    const name = p.name.toLowerCase().trim();
    return fileProductNames.has(name);
  });
  
  console.log(`[INFO] Found ${toRestore.length} archived products to restore\n`);
  
  if (toRestore.length === 0) {
    console.log('✅ No products need to be restored\n');
    return;
  }
  
  console.log('Products to restore (sample):');
  toRestore.slice(0, 30).forEach(p => {
    const categ = p.categ_id ? p.categ_id[1] : 'NO CATEGORY';
    console.log(`  [${p.id}] ${p.name} (${categ})`);
  });
  
  if (toRestore.length > 30) {
    console.log(`  ... and ${toRestore.length - 30} more\n`);
  }
  
  console.log(`\n[ACTION] Restoring ${toRestore.length} products...\n`);
  
  let restored = 0;
  let failed = 0;
  
  // Restore in batches
  const batchSize = 50;
  for (let i = 0; i < toRestore.length; i += batchSize) {
    const batch = toRestore.slice(i, i + batchSize);
    const ids = batch.map(p => p.id);
    
    try {
      await odoo.rpc(
        'product.template',
        'write',
        [ids, { active: true }]
      );
      
      restored += ids.length;
      console.log(`  ✓ Restored batch ${Math.floor(i / batchSize) + 1}: ${ids.length} products (total: ${restored}/${toRestore.length})`);
    } catch (err: any) {
      console.log(`  ✗ Failed batch ${Math.floor(i / batchSize) + 1}: ${err.message.split('\n')[0]}`);
      failed += ids.length;
    }
  }
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  RESULTS');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log(`Total to restore: ${toRestore.length}`);
  console.log(`Restored: ${restored}`);
  console.log(`Failed: ${failed}`);
  
  if (restored > 0) {
    console.log('\n✅ Products restored successfully!');
    console.log('Next step: Run categorization fix script\n');
  }
}

main().catch(console.error);

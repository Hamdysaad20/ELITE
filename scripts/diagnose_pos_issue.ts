/**
 * Diagnose why POS shows nothing
 */

import { createOdooClient } from '../src/server/utils/odooClient';

async function main() {
  const odoo = createOdooClient();
  
  console.log('[INFO] Step 1: Checking POS configuration...\n');
  
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
  console.log(`Configured category IDs: ${posConfig.iface_available_categ_ids || 'NONE'}`);
  
  if (posConfig.iface_available_categ_ids && posConfig.iface_available_categ_ids.length > 0) {
    console.log('\n[INFO] Step 2: Checking which categories are configured...\n');
    
    const configuredCategories = await odoo.searchRead(
      'pos.category',
      [['id', 'in', posConfig.iface_available_categ_ids]],
      ['id', 'name']
    );
    
    console.log(`Found ${configuredCategories.length} configured categories:`);
    configuredCategories.forEach((cat: any) => {
      console.log(`  - [${cat.id}] ${cat.name}`);
    });
  }
  
  console.log('\n[INFO] Step 3: Checking products available in POS...\n');
  
  const posProducts = await odoo.searchRead(
    'product.product',
    [['available_in_pos', '=', true]],
    ['id', 'name', 'pos_categ_id'],
    { limit: 100 }
  );
  
  console.log(`Found ${posProducts.length} products with available_in_pos=true`);
  
  if (posProducts.length === 0) {
    console.log('\n❌ PROBLEM: No products are marked as available_in_pos!');
  } else {
    console.log('\nSample products:');
    posProducts.slice(0, 10).forEach((p: any) => {
      const categ = p.pos_categ_id ? p.pos_categ_id[1] : 'NO CATEGORY';
      console.log(`  - [${p.id}] ${p.name} -> ${categ}`);
    });
    
    // Group by category
    const byCategory = new Map<string, number>();
    posProducts.forEach((p: any) => {
      const categName = p.pos_categ_id ? p.pos_categ_id[1] : 'NO CATEGORY';
      byCategory.set(categName, (byCategory.get(categName) || 0) + 1);
    });
    
    console.log('\nProducts by POS category:');
    Array.from(byCategory.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => {
        console.log(`  ${cat}: ${count} products`);
      });
  }
  
  console.log('\n[INFO] Step 4: Checking product templates...\n');
  
  const templates = await odoo.searchRead(
    'product.template',
    [['sale_ok', '=', true], ['active', '=', true]],
    ['id', 'name', 'categ_id'],
    { limit: 50, order: 'name' }
  );
  
  console.log(`Found ${templates.length} active saleable product templates`);
  console.log('Sample:');
  templates.slice(0, 10).forEach((t: any) => {
    const categ = t.categ_id ? t.categ_id[1] : 'NO CATEGORY';
    console.log(`  - [${t.id}] ${t.name} -> ${categ}`);
  });
  
  console.log('\n[INFO] Step 5: Checking if products have pos_categ_id set...\n');
  
  const productsWithPosCateg = await odoo.searchRead(
    'product.product',
    [['pos_categ_id', '!=', false]],
    ['id', 'name', 'pos_categ_id'],
    { limit: 20 }
  );
  
  console.log(`Found ${productsWithPosCateg.length} products with pos_categ_id set`);
  if (productsWithPosCateg.length > 0) {
    console.log('Sample:');
    productsWithPosCateg.slice(0, 5).forEach((p: any) => {
      console.log(`  - [${p.id}] ${p.name} -> ${p.pos_categ_id[1]}`);
    });
  }
}

main().catch(console.error);

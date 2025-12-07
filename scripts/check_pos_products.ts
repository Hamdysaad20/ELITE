/**
 * Check how POS actually finds products to display
 */

import { createOdooClient } from '../src/server/utils/odooClient';

async function main() {
  const odoo = createOdooClient();
  
  console.log('[INFO] Checking products available in POS...\n');
  
  // Check product.product with available_in_pos
  const posProducts = await odoo.searchRead(
    'product.product',
    [['available_in_pos', '=', true]],
    ['id', 'name', 'categ_id'],
    { limit: 100 }
  );
  
  console.log(`Found ${posProducts.length} product variants with available_in_pos=true\n`);
  
  if (posProducts.length === 0) {
    console.log('❌ PROBLEM: No products marked as available_in_pos!');
    console.log('\nLet\'s check all products...\n');
    
    const allProducts = await odoo.searchRead(
      'product.product',
      [['sale_ok', '=', true]],
      ['id', 'name', 'available_in_pos'],
      { limit: 20 }
    );
    
    console.log(`Total saleable products: ${allProducts.length}`);
    console.log('Sample:');
    allProducts.slice(0, 10).forEach((p: any) => {
      console.log(`  - [${p.id}] ${p.name} -> available_in_pos: ${p.available_in_pos}`);
    });
  } else {
    console.log('Products in POS:');
    posProducts.slice(0, 15).forEach((p: any) => {
      const categ = p.categ_id ? p.categ_id[1] : 'NO CATEGORY';
      console.log(`  - [${p.id}] ${p.name} -> ${categ}`);
    });
  }
  
  console.log('\n[INFO] Checking product templates...\n');
  
  const templates = await odoo.searchRead(
    'product.template',
    [['available_in_pos', '=', true]],
    ['id', 'name', 'categ_id', 'product_variant_count'],
    { limit: 50 }
  );
  
  console.log(`Found ${templates.length} templates with available_in_pos=true\n`);
  
  if (templates.length > 0) {
    console.log('Sample templates:');
    templates.slice(0, 10).forEach((t: any) => {
      const categ = t.categ_id ? t.categ_id[1] : 'NO CATEGORY';
      console.log(`  - [${t.id}] ${t.name} (${t.product_variant_count} variants) -> ${categ}`);
    });
  } else {
    console.log('❌ PROBLEM: No product templates marked as available_in_pos!');
  }
  
  console.log('\n[INFO] Checking POS category mapping...\n');
  
  // Check how many product.category records map to our pos.category IDs
  const posCategories = await odoo.searchRead(
    'pos.category',
    [['id', 'in', [1, 18, 19, 20, 21, 22, 23, 24, 25, 26, 17]]],
    ['id', 'name']
  );
  
  console.log(`Our ${posCategories.length} POS categories:`);
  for (const posCat of posCategories) {
    // Try to find product.category with same name
    const productCats = await odoo.searchRead(
      'product.category',
      [['name', '=', posCat.name]],
      ['id', 'name']
    );
    
    if (productCats.length > 0) {
      // Count products in this category
      const productCount = await odoo.searchRead(
        'product.template',
        [['categ_id', '=', productCats[0].id], ['available_in_pos', '=', true]],
        ['id'],
        { limit: 1000 }
      );
      
      console.log(`  ✓ [${posCat.id}] ${posCat.name} -> product.category ${productCats[0].id} has ${productCount.length} POS products`);
    } else {
      console.log(`  ✗ [${posCat.id}] ${posCat.name} -> NO matching product.category`);
    }
  }
}

main().catch(console.error);

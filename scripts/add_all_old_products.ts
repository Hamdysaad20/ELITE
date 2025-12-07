/**
 * Add ALL missing products from old list to Odoo
 * Complete restoration based on old product list
 */

import { createOdooClient } from '../src/server/utils/odooClient';

async function main() {
  const odoo = createOdooClient();
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ADD ALL MISSING PRODUCTS FROM OLD SYSTEM');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  // Get all categories
  const allCategories = await odoo.searchRead(
    'product.category',
    [],
    ['id', 'name']
  );
  
  const categoryMap = new Map(allCategories.map((c: any) => [c.name, c.id]));
  
  // Get pos categories
  const posCategories = await odoo.searchRead(
    'pos.category',
    [],
    ['id', 'name']
  );
  
  const posCategoryMap = new Map(posCategories.map((c: any) => [c.name, c.id]));
  
  // Get existing products to avoid duplicates
  const existingProducts = await odoo.searchRead(
    'product.template',
    [],
    ['name', 'default_code']
  );
  
  const existingNames = new Set(existingProducts.map((p: any) => p.name.toLowerCase().trim()));
  const existingSKUs = new Set(existingProducts.map((p: any) => p.default_code).filter(Boolean));
  
  console.log(`[INFO] Found ${existingProducts.length} existing products in Odoo\n`);
  
  // Define ALL products from old list with proper categorization
  const productsToAdd = [
    // EXTRAS (Toppings, Add-ons, Customizations)
    { name: 'EXTRA BOBA', price: 30, category: 'Extras', sku: 'EX001' },
    { name: 'EXTRA Flavor', price: 10, category: 'Extras', sku: 'EX002' },
    { name: 'Extra Honey', price: 15, category: 'Extras', sku: 'EX003' },
    { name: 'Extra Ice Cream Scoop', price: 20, category: 'Extras', sku: 'EX004' },
    { name: 'Extra Shot', price: 20, category: 'Extras', sku: 'EX005' },
    { name: 'Extra Whip Cream', price: 25, category: 'Extras', sku: 'EX006' },
    { name: 'Coconut Milk', price: 20, category: 'Extras', sku: 'EX007' },
    { name: '[EXTRA] Coconut Milk', price: 25, category: 'Extras', sku: 'EX008' },
    { name: 'Premium Topping', price: 25, category: 'Extras', sku: 'EX009' },
    { name: 'Extra Marshmallow', price: 10, category: 'Extras', sku: 'EX010' },
    { name: 'Cup', price: 5, category: 'Extras', sku: 'EX011' },
    
    // SPECIALTY COFFEE
    { name: 'French Coffee', price: 50, category: 'Coffee', sku: 'CF001' },
    { name: 'Hazelnut Coffee', price: 55, category: 'Coffee', sku: 'CF002' },
    { name: 'Espresso Avocado', price: 60, category: 'Coffee', sku: 'CF003' },
    { name: 'Espresso Double', price: 45, category: 'Coffee', sku: 'CF004' },
    
    // ICED SPECIALTY
    { name: 'Iced Lemon', price: 60, category: 'Iced', sku: 'IC001' },
    { name: 'Icee Chocolate', price: 90, category: 'Iced', sku: 'IC002' },
    { name: 'Black Cat', price: 85, category: 'Iced', sku: 'IC003' },
    
    // BOBA/BUBBLE TEA
    { name: 'BOBA Chocolate', price: 80, category: 'Iced', sku: 'BOBA001' },
    { name: 'BOBA Spanish Latte', price: 110, category: 'Iced', sku: 'BOBA002' },
    { name: 'Brown Sugar BOBA/Bubble [Classic]', price: 75, category: 'Iced', sku: 'BOBA003' },
    { name: '[Taro] Boba/Bubble', price: 70, category: 'Iced', sku: 'BOBA004' },
    
    // SMOOTHIES (Custom option)
    { name: 'Custom Smoothie', price: 85, category: 'Smoothie', sku: 'SM-CUSTOM' },
    
    // SERVICES
    { name: 'Water', price: 5, category: 'Services', sku: 'SV001' },
    { name: 'Custom Sandwich', price: 0, category: 'Food', sku: 'SAND-CUSTOM' },
    
    // FOOD ITEMS
    { name: 'Cheese Burger', price: 13, category: 'Food', sku: 'BURGER001' },
    
    // OFFERS (these were in old list as Morning Bird Offer - Chai)
    { name: 'Morning Bird Offer "Chai Latte"', price: 25, category: 'Offers', sku: 'OFF001' },
    { name: 'Morning Bird Offer "Turkish/Espresso" S', price: 20, category: 'Offers', sku: 'OFF002' },
    { name: 'Morning Bird Offer Americano', price: 30, category: 'Offers', sku: 'OFF003' },
    { name: 'Discount', price: 0, category: 'Offers', sku: 'DISC' },
    { name: 'Discount 30%', price: 0, category: 'Offers', sku: 'DISC30' },
    
    // SERVICES/ADMIN
    { name: 'OPEN REGISTER', price: 0, category: 'Services', sku: 'ADMIN001' },
  ];
  
  console.log(`[INFO] Attempting to add ${productsToAdd.length} products...\n`);
  
  let added = 0;
  let skipped = 0;
  let failed = 0;
  
  for (const product of productsToAdd) {
    // Check if product already exists
    const nameCheck = product.name.toLowerCase().trim();
    if (existingNames.has(nameCheck)) {
      console.log(`  ⊘ [SKIP] ${product.name} - already exists`);
      skipped++;
      continue;
    }
    
    if (product.sku && existingSKUs.has(product.sku)) {
      console.log(`  ⊘ [SKIP] ${product.name} - SKU ${product.sku} already exists`);
      skipped++;
      continue;
    }
    
    const categoryId = categoryMap.get(product.category);
    const posCategId = posCategoryMap.get(product.category);
    
    if (!categoryId) {
      console.log(`  ✗ [FAIL] ${product.name} - Category "${product.category}" not found`);
      failed++;
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
      
      // Add POS category if exists
      if (posCategId) {
        productData.pos_categ_ids = [[6, 0, [posCategId]]];
      }
      
      const newId = await odoo.rpc(
        'product.template',
        'create',
        [productData]
      );
      
      console.log(`  ✓ [${newId}] ${product.name} -> ${product.category} (${product.price} EGP)`);
      added++;
      
      // Add to tracking sets
      existingNames.add(nameCheck);
      if (product.sku) existingSKUs.add(product.sku);
      
    } catch (err: any) {
      console.log(`  ✗ [FAIL] ${product.name} - ${err.message.split('\n')[0]}`);
      failed++;
    }
  }
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`  ✓ Added: ${added} products`);
  console.log(`  ⊘ Skipped: ${skipped} products (already exist)`);
  console.log(`  ✗ Failed: ${failed} products\n`);
  
  // Final count by category
  const allProductsNow = await odoo.searchRead(
    'product.template',
    [['available_in_pos', '=', true]],
    ['id', 'name', 'categ_id']
  );
  
  const byCategory = new Map<string, number>();
  allProductsNow.forEach((p: any) => {
    const categ = p.categ_id ? p.categ_id[1] : 'NO CATEGORY';
    byCategory.set(categ, (byCategory.get(categ) || 0) + 1);
  });
  
  console.log(`Total products in POS now: ${allProductsNow.length}\n`);
  console.log('Distribution by category:');
  Array.from(byCategory.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([categ, count]) => {
      console.log(`  ${categ}: ${count} products`);
    });
  
  console.log('\n✅ Done! Complete menu restored from old system.\n');
}

main().catch(console.error);

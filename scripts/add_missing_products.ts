/**
 * Add missing products from old list to Odoo
 * Focus on Smoothies, Frappe, Milkshake, and Soda categories
 */

import { createOdooClient } from '../src/server/utils/odooClient';

async function main() {
  const odoo = createOdooClient();
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ADD MISSING PRODUCTS FROM OLD LIST');
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
  
  // Define products to add based on old list
  const productsToAdd = [
    // SMOOTHIES (missing many!)
    { name: 'Mango Smoothie', price: 85, category: 'Smoothie', sku: 'SM001' },
    { name: 'Strawberry Smoothie', price: 85, category: 'Smoothie', sku: 'SM002' },
    { name: 'Mixed Berry Smoothie', price: 85, category: 'Smoothie', sku: 'SM003' },
    { name: 'Passion Fruit Smoothie', price: 85, category: 'Smoothie', sku: 'SM004' },
    { name: 'Golden Peach Sunrise', price: 85, category: 'Smoothie', sku: 'SM005' },
    
    // FRAPPE
    { name: 'Mocha Frappé', price: 90, category: 'Frappe', sku: 'FB001' },
    { name: 'Coffee Frappé', price: 85, category: 'Frappe', sku: 'FB002' },
    { name: 'Caramel Frappé', price: 85, category: 'Frappe', sku: 'FB003' },
    { name: 'Vanilla Frappé', price: 85, category: 'Frappe', sku: 'FB004' },
    { name: 'Pistachio Frappé', price: 95, category: 'Frappe', sku: 'FB005' },
    
    // MILKSHAKE
    { name: 'Chocolate Milkshake', price: 80, category: 'Milkshake', sku: 'MS001' },
    { name: 'Vanilla Milkshake', price: 80, category: 'Milkshake', sku: 'MS002' },
    { name: 'Strawberry Milkshake', price: 80, category: 'Milkshake', sku: 'MS003' },
    { name: 'Oreo Milkshake', price: 80, category: 'Milkshake', sku: 'MS004' },
    { name: 'Kinder Milkshake', price: 85, category: 'Milkshake', sku: 'MS005' },
    { name: 'Pistachio Milkshake', price: 100, category: 'Milkshake', sku: 'MS006' },
    { name: 'Lotus Milkshake', price: 85, category: 'Milkshake', sku: 'MS007' },
    { name: 'Mango Passion Fruit Milkshake', price: 80, category: 'Milkshake', sku: 'MS008' },
    
    // SODA
    { name: 'Custom Soda', price: 85, category: 'Soda', sku: 'SR001' },
    { name: 'Classic Lemon Soda', price: 75, category: 'Soda', sku: 'SR002' },
    { name: 'Escobar Soda Drink', price: 90, category: 'Soda', sku: 'SR003' },
    { name: 'Passion Fruit Soda', price: 75, category: 'Soda', sku: 'SR004' },
    { name: 'Power Soda +18', price: 85, category: 'Soda', sku: 'SR005' },
    { name: 'Mojito Soda', price: 55, category: 'Soda', sku: 'SR006' },
    
    // ICED (additional from old list)
    { name: 'Iced Latte', price: 80, category: 'Iced', sku: 'ES002' },
    { name: 'Iced Cappuccino', price: 75, category: 'Iced', sku: 'ES003' },
    { name: 'Iced Mocha', price: 85, category: 'Iced', sku: 'ES004' },
    { name: 'Iced Chai Latte', price: 70, category: 'Iced', sku: 'ES005' },
    { name: 'Spanish Latte (Iced)', price: 75, category: 'Iced', sku: 'ES006' },
    { name: 'Iced Chocolate', price: 85, category: 'Iced', sku: 'ES008' },
    { name: 'Matcha Latte (Iced)', price: 90, category: 'Iced', sku: 'ES009' },
    { name: 'Iced Americano', price: 70, category: 'Iced', sku: 'ES010' },
    { name: 'Iced Macchiato', price: 75, category: 'Iced', sku: 'ES011' },
    { name: 'Iced Caramel Macchiato', price: 75, category: 'Iced', sku: 'ES012' },
    { name: 'Strawberry Matcha Latte', price: 95, category: 'Iced', sku: 'ES001' },
    
    // COFFEE (hot drinks from old list)
    { name: 'Americano', price: 65, category: 'Coffee', sku: 'EE001' },
    { name: 'Espresso', price: 40, category: 'Coffee', sku: 'EE002' },
    { name: 'Espresso Macchiato', price: 50, category: 'Coffee', sku: 'EE003' },
    { name: 'Cortado', price: 65, category: 'Coffee', sku: 'EE004' },
    { name: 'Flat White', price: 70, category: 'Coffee', sku: 'EE005' },
    { name: 'Cappuccino', price: 70, category: 'Coffee', sku: 'EE006' },
    { name: 'Mocha', price: 75, category: 'Coffee', sku: 'MC001' },
    { name: 'Latte', price: 65, category: 'Coffee', sku: 'MC002' },
    { name: 'Spanish Latte (Hot)', price: 70, category: 'Coffee', sku: 'MC003' },
    { name: 'Chai Latte (Hot)', price: 55, category: 'Coffee', sku: 'MC004' },
    { name: 'Chocolate (Hot)', price: 65, category: 'Coffee', sku: 'MC005' },
    { name: 'Matcha Latte (Hot)', price: 80, category: 'Coffee', sku: 'MC006' },
    { name: 'Turkish Coffee Single', price: 40, category: 'Coffee', sku: 'EO001' },
    { name: 'Turkish Coffee Double', price: 55, category: 'Coffee', sku: 'EO001-D' },
    
    // TEA
    { name: 'Classic Teas', price: 35, category: 'Tea', sku: 'EO002' },
    { name: 'Karak Chai', price: 45, category: 'Tea', sku: 'EO003' },
    { name: 'Hibiscus Tea', price: 40, category: 'Tea', sku: 'TEA001' },
    
    // FOOD
    { name: 'Cookie', price: 25, category: 'Food', sku: 'F001' },
    { name: 'Molten Cake', price: 85, category: 'Food', sku: 'F002' },
    { name: 'Cheese Cake', price: 75, category: 'Food', sku: 'F003' },
    { name: 'Coffee Cake', price: 85, category: 'Food', sku: 'F004' },
    { name: 'Honey Cake', price: 75, category: 'Food', sku: 'F005' },
    { name: 'Brownies', price: 70, category: 'Food', sku: 'F006' },
    { name: 'Carrot Cake', price: 80, category: 'Food', sku: 'F007' },
    { name: 'Red Velvet Cake', price: 80, category: 'Food', sku: 'F008' },
    { name: 'Apple Pie Cake', price: 80, category: 'Food', sku: 'F009' },
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
  
  console.log('\n✅ Done! Refresh your POS to see all products.\n');
}

main().catch(console.error);

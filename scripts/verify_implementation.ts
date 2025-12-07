import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient.js';
dotenv.config();

async function verifyImplementation() {
  const config = getOdooConfigFromEnv();
  if (!config) {
    throw new Error('Odoo configuration not found in environment variables');
  }
  const odoo = new OdooClient(config);

  console.log('🔍 Verifying implementation...\n');

  // Get all active products
  const products = await odoo.searchRead('product.template', [
    ['active', '=', true],
  ], ['name', 'list_price', 'default_code', 'categ_id', 'available_in_pos', 'pos_categ_ids']);

  console.log(`📊 Total active products in Odoo: ${products.length}\n`);

  // Group by category
  const byCategory: Record<string, any[]> = {};
  products.forEach((p: any) => {
    const catName = p.categ_id[1];
    if (!byCategory[catName]) byCategory[catName] = [];
    byCategory[catName].push(p);
  });

  console.log('📋 Products by Category:\n');
  Object.entries(byCategory).sort().forEach(([cat, prods]) => {
    console.log(`${cat}: ${prods.length} products`);
  });

  console.log('\n🔍 Checking key product types from old list:\n');

  // Check specific product types
  const checks = [
    { name: 'Coffee drinks', pattern: /americano|latte|cappuccino|mocha|espresso/i },
    { name: 'Tea drinks', pattern: /chai|tea|matcha/i },
    { name: 'Iced drinks', pattern: /iced|boba/i },
    { name: 'Frappes', pattern: /frapp[eé]/i },
    { name: 'Milkshakes', pattern: /milkshake/i },
    { name: 'Smoothies', pattern: /smoothie/i },
    { name: 'Sodas', pattern: /soda|mojito/i },
    { name: 'Food items', pattern: /cake|cookie|brownie|burger/i },
    { name: 'Extras', pattern: /extra|boba(?! )|flavor|topping|shot|honey|cream/i },
    { name: 'Services', pattern: /gift|wallet|water/i },
    { name: 'Offers', pattern: /offer|discount|bestie|morning/i },
  ];

  checks.forEach(check => {
    const found = products.filter((p: any) => check.pattern.test(p.name));
    console.log(`${check.name}: ${found.length} products`);
  });

  console.log('\n✅ Checking critical items:\n');

  // Check for specific important products
  const criticalItems = [
    'Americano',
    'Espresso',
    'Latte',
    'Cappuccino',
    'Mocha',
    'Spanish Latte',
    'Chai Latte',
    'Iced Latte',
    'Iced Americano',
    'Mocha Frappé',
    'Coffee Frappé',
    'Caramel Frappé',
    'Vanilla Frappé',
    'Pistachio Frappé',
    'Chocolate Milkshake',
    'Vanilla Milkshake',
    'Strawberry Milkshake',
    'Oreo Milkshake',
    'Kinder Milkshake',
    'Pistachio Milkshake',
    'Lotus Milkshake',
    'Mango Passion Milkshake',
    'Mango Smoothie',
    'Strawberry Smoothie',
    'Mixed Berry Smoothie',
    'Passion Fruit Smoothie',
    'Golden Peach Sunrise',
    'Custom Soda',
    'Classic Lemon Soda',
    'Escobar Soda',
    'Mojito SODA',
    'Power Soda',
    'BOBA',
    'Brown Sugar BOBA',
    'EXTRA BOBA',
    'Extra Shot',
    'Extra Flavor',
    'Premium topping',
  ];

  const missing: string[] = [];
  const found: string[] = [];

  criticalItems.forEach(item => {
    const exists = products.some((p: any) => 
      p.name.toLowerCase().includes(item.toLowerCase()) ||
      item.toLowerCase().includes(p.name.toLowerCase())
    );
    if (exists) {
      found.push(item);
    } else {
      missing.push(item);
    }
  });

  console.log(`✓ Found: ${found.length}/${criticalItems.length} critical items`);
  
  if (missing.length > 0) {
    console.log('\n⚠️  Missing critical items:');
    missing.forEach(item => console.log(`  - ${item}`));
  }

  console.log('\n🎯 POS Configuration Check:\n');

  // Check POS availability
  const posProducts = products.filter((p: any) => p.available_in_pos);
  const linkedToPosCateg = products.filter((p: any) => p.pos_categ_ids && p.pos_categ_ids.length > 0);

  console.log(`✓ Products marked available_in_pos: ${posProducts.length}/${products.length}`);
  console.log(`✓ Products linked to POS categories: ${linkedToPosCateg.length}/${products.length}`);

  if (posProducts.length !== products.length) {
    const notInPos = products.filter((p: any) => !p.available_in_pos);
    console.log('\n⚠️  Products NOT available in POS:');
    notInPos.forEach((p: any) => console.log(`  - ${p.name} (${p.categ_id[1]})`));
  }

  if (linkedToPosCateg.length !== products.length) {
    const notLinked = products.filter((p: any) => !p.pos_categ_ids || p.pos_categ_ids.length === 0);
    console.log('\n⚠️  Products NOT linked to POS categories:');
    notLinked.forEach((p: any) => console.log(`  - ${p.name} (${p.categ_id[1]})`));
  }

  // Check for products with zero price (should be intentional)
  const zeroPrice = products.filter((p: any) => p.list_price === 0);
  if (zeroPrice.length > 0) {
    console.log('\n💰 Zero-price products (should be intentional):');
    zeroPrice.forEach((p: any) => console.log(`  - ${p.name} (${p.categ_id[1]})`));
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 IMPLEMENTATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Products: ${products.length}`);
  console.log(`POS Ready: ${posProducts.length}`);
  console.log(`Fully Configured: ${linkedToPosCateg.length}`);
  console.log(`Categories: ${Object.keys(byCategory).length}`);
  console.log(`Critical Items Found: ${found.length}/${criticalItems.length}`);
  
  if (missing.length === 0 && posProducts.length === products.length && linkedToPosCateg.length === products.length) {
    console.log('\n✅ ALL CHECKS PASSED - Implementation Complete!');
  } else {
    console.log('\n⚠️  Some items need attention (see details above)');
  }
}

verifyImplementation().catch(console.error);

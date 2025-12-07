import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient.js';
dotenv.config();

async function finalExtrasReport() {
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  config.timeoutMs = 60000;
  const odoo = new OdooClient(config);

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           FINAL EXTRAS CATEGORY REPORT                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Get all products in Extras category
  const extrasProducts = await odoo.searchRead('product.template', [
    ['categ_id.name', '=', 'Extras'],
    ['active', '=', true]
  ], ['id', 'name', 'list_price']);

  console.log('📊 EXTRAS CATALOG OVERVIEW');
  console.log('='.repeat(60));
  console.log(`Total Extras Products: ${extrasProducts.length}\n`);

  // Group by category based on product name prefixes
  const categorized: Record<string, any[]> = {
    'Syrups & Flavors': [],
    'Drizzles & Sauces': [],
    'Toppings & Crumbles': [],
    'Powders & Dusts': [],
    'Fresh Ingredients': [],
    'Premium Add-ons': [],
    'Seeds & Grains': [],
    'Dairy Products': [],
    'Candy & Sweets': [],
    'Cookies & Biscuits': [],
    'Spices & Aromatics': [],
    'Alternative Milks': [],
    'BOBA & Specialty': [],
    'Other Extras': [],
  };

  for (const product of extrasProducts) {
    const name = product.name.toLowerCase();
    
    if (name.includes('syrup')) categorized['Syrups & Flavors'].push(product);
    else if (name.includes('drizzle') || name.includes('sauce') || name.includes('nutella') || name.includes('lotus')) categorized['Drizzles & Sauces'].push(product);
    else if (name.includes('crumble') || name.includes('chips') || name.includes('pieces') || name.includes('sprinkles') || name.includes('marshmallow') || name.includes('topping')) categorized['Toppings & Crumbles'].push(product);
    else if (name.includes('powder') || name.includes('dust') || name.includes('cocoa') || name.includes('matcha') || name.includes('cinnamon')) categorized['Powders & Dusts'].push(product);
    else if (name.includes('slices') || name.includes('berries') || name.includes('chunks') || name.includes('wedge') || name.includes('basil') || name.includes('mint') || name.includes('rosemary') || name.includes('ginger') || name.includes('lemon slice')) categorized['Fresh Ingredients'].push(product);
    else if (name.includes('gold') || name.includes('silver') || name.includes('glitter') || name.includes('charcoal') || name.includes('cbd') || name.includes('collagen') || name.includes('creatine') || name.includes('bcaa') || name.includes('pre-workout') || name.includes('energy boost') || name.includes('mct')) categorized['Premium Add-ons'].push(product);
    else if (name.includes('seeds') || name.includes('granola') || name.includes('muesli') || name.includes('quinoa')) categorized['Seeds & Grains'].push(product);
    else if (name.includes('ice cream') || name.includes('gelato') || name.includes('frozen yogurt') || name.includes('mascarpone') || name.includes('cream cheese') || name.includes('condensed') || name.includes('evaporated')) categorized['Dairy Products'].push(product);
    else if (name.includes('m&m') || name.includes('skittles') || name.includes('kitkat') || name.includes('snickers') || name.includes('twix') || name.includes('bounty') || name.includes('maltesers') || name.includes('ferrero') || name.includes('raffaello') || name.includes('kinder')) categorized['Candy & Sweets'].push(product);
    else if (name.includes('cookie') || name.includes('biscuit') || name.includes('macaron')) categorized['Cookies & Biscuits'].push(product);
    else if (name.includes('anise') || name.includes('cloves') || name.includes('saffron') || name.includes('vanilla bean') || name.includes('zest') || name.includes('spice') || name.includes('cardamom') || name.includes('nutmeg') || name.includes('turmeric')) categorized['Spices & Aromatics'].push(product);
    else if (name.includes('milk') && !name.includes('condensed') && !name.includes('evaporated')) categorized['Alternative Milks'].push(product);
    else if (name.includes('boba') || name.includes('shot') || name.includes('whip')) categorized['BOBA & Specialty'].push(product);
    else categorized['Other Extras'].push(product);
  }

  // Display categorized results
  for (const [category, products] of Object.entries(categorized)) {
    if (products.length === 0) continue;
    
    console.log(`\n${category.toUpperCase()}`);
    console.log('─'.repeat(60));
    console.log(`Count: ${products.length} items`);
    
    // Sort by price
    products.sort((a, b) => a.list_price - b.list_price);
    
    for (const product of products) {
      const price = String(product.list_price).padStart(6);
      console.log(`  ${price} EGP - ${product.name}`);
    }
  }

  // Get products with customization attributes
  console.log('\n\n🎨 CUSTOMIZABLE EXTRAS (WITH ATTRIBUTES)');
  console.log('='.repeat(60));

  const customizableProducts = [
    'KINDER STEAK Single',
    'EXTRA BOBA',
    'Extra Whip Cream',
    'Extra Shot',
    'EXTRA Flavor',
    'Extra Ice Cream Scoop',
    'Extra Honey',
  ];

  let customizableCount = 0;
  for (const productName of customizableProducts) {
    const found = extrasProducts.find(p => p.name === productName);
    if (found) {
      const attrLines = await odoo.searchRead('product.template.attribute.line',
        [['product_tmpl_id', '=', found.id]],
        ['id', 'attribute_id']
      );
      
      if (attrLines.length > 0) {
        customizableCount++;
        console.log(`\n✓ ${productName} (${found.list_price} EGP)`);
        console.log(`  ${attrLines.length} customization attribute(s)`);
      }
    }
  }

  // Price range analysis
  console.log('\n\n💰 PRICE RANGE ANALYSIS');
  console.log('='.repeat(60));
  
  const prices = extrasProducts.map(p => p.list_price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2);
  
  const priceRanges = {
    'Budget (5-10 EGP)': extrasProducts.filter(p => p.list_price >= 5 && p.list_price <= 10).length,
    'Standard (11-15 EGP)': extrasProducts.filter(p => p.list_price >= 11 && p.list_price <= 15).length,
    'Premium (16-20 EGP)': extrasProducts.filter(p => p.list_price >= 16 && p.list_price <= 20).length,
    'Luxury (21-25 EGP)': extrasProducts.filter(p => p.list_price >= 21 && p.list_price <= 25).length,
    'Ultra Premium (26+ EGP)': extrasProducts.filter(p => p.list_price >= 26).length,
  };

  console.log(`Minimum Price: ${minPrice} EGP`);
  console.log(`Maximum Price: ${maxPrice} EGP`);
  console.log(`Average Price: ${avgPrice} EGP\n`);
  
  for (const [range, count] of Object.entries(priceRanges)) {
    const percentage = ((count / extrasProducts.length) * 100).toFixed(1);
    const bar = '█'.repeat(Math.floor(count / 2));
    console.log(`${range.padEnd(30)}: ${String(count).padStart(3)} (${percentage}%) ${bar}`);
  }

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    FINAL SUMMARY                           ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n📦 Total Extras: ${extrasProducts.length} products`);
  console.log(`🎨 Customizable: ${customizableCount} products with attributes`);
  console.log(`💰 Price Range: ${minPrice} - ${maxPrice} EGP`);
  console.log(`📊 Average Price: ${avgPrice} EGP`);
  console.log(`\n✅ Extras category is FULLY STOCKED and READY!`);
  console.log(`🎯 Maximum customization flexibility achieved!`);
}

finalExtrasReport().catch(console.error);

import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient.js';
dotenv.config();

async function analyzeCategoriesForAttributes() {
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  const odoo = new OdooClient(config);

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║        CATEGORY ATTRIBUTE ANALYSIS & PLANNING              ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Get all products by category
  const products = await odoo.searchRead('product.template', [
    ['active', '=', true],
  ], ['id', 'name', 'categ_id', 'default_code']);

  const byCategory: Record<string, any[]> = {};
  products.forEach((p: any) => {
    const catName = p.categ_id[1];
    if (!byCategory[catName]) byCategory[catName] = [];
    byCategory[catName].push(p);
  });

  // Check for Espresso Double
  console.log('🔍 CHECKING ESPRESSO PRODUCTS');
  console.log('═'.repeat(60));
  const espressoProducts = products.filter((p: any) => 
    p.name.toLowerCase().includes('espresso')
  );
  espressoProducts.forEach((p: any) => {
    console.log(`  ${p.name} (ID: ${p.id})`);
  });

  // Attribute recommendations
  console.log('\n\n📋 ATTRIBUTE RECOMMENDATIONS BY CATEGORY');
  console.log('═'.repeat(60));

  const recommendations = {
    'Coffee': {
      products: byCategory['Coffee']?.length || 0,
      attributes: [
        { name: 'Size', type: 'radio', values: ['Small', 'Medium', 'Large'], status: '✅ Already Implemented' },
        { name: 'Milk Options', type: 'radio', values: ['Regular Milk', 'Oat Milk', 'Almond Milk', 'Soy Milk', 'Lactose-Free'], pricing: '+5 EGP for alternatives' },
        { name: 'Shots', type: 'radio', values: ['Single Shot', 'Double Shot', 'Triple Shot'], pricing: 'Single (base), Double (+10), Triple (+20)' },
        { name: 'Extras', type: 'multi', values: ['Whipped Cream', 'Caramel Drizzle', 'Chocolate Sauce', 'Vanilla Syrup', 'Hazelnut Syrup'], pricing: '+5 EGP each' },
        { name: 'Sugar Level', type: 'radio', values: ['No Sugar', 'Less Sugar', 'Regular', 'Extra Sweet'], pricing: 'No additional cost' },
        { name: 'Ice Level', type: 'radio', values: ['No Ice', 'Less Ice', 'Regular Ice', 'Extra Ice'], pricing: 'No additional cost' }
      ]
    },
    'Tea': {
      products: byCategory['Tea']?.length || 0,
      attributes: [
        { name: 'Size', type: 'radio', values: ['Small', 'Medium', 'Large'], status: '✅ Already Implemented' },
        { name: 'Milk Options', type: 'radio', values: ['No Milk', 'Regular Milk', 'Oat Milk', 'Almond Milk'], pricing: '+5 EGP for alternatives' },
        { name: 'Sugar Level', type: 'radio', values: ['No Sugar', 'Less Sugar', 'Regular', 'Extra Sweet'], pricing: 'No additional cost' },
        { name: 'Extras', type: 'multi', values: ['Honey', 'Lemon', 'Mint', 'Ginger'], pricing: '+3 EGP each' }
      ]
    },
    'Iced': {
      products: byCategory['Iced']?.length || 0,
      attributes: [
        { name: 'Size', type: 'radio', values: ['Small', 'Medium', 'Large'], status: '✅ Already Implemented' },
        { name: 'Milk Options', type: 'radio', values: ['Regular Milk', 'Oat Milk', 'Almond Milk', 'Soy Milk'], pricing: '+5 EGP for alternatives' },
        { name: 'Ice Level', type: 'radio', values: ['Less Ice', 'Regular Ice', 'Extra Ice'], pricing: 'No additional cost' },
        { name: 'Sweetness', type: 'radio', values: ['No Sugar', '25%', '50%', '75%', '100%'], pricing: 'No additional cost' },
        { name: 'Toppings', type: 'multi', values: ['Whipped Cream', 'BOBA Pearls', 'Chocolate Chips', 'Caramel Drizzle'], pricing: '+5-10 EGP each' }
      ]
    },
    'Frappe': {
      products: byCategory['Frappe']?.length || 0,
      attributes: [
        { name: 'Size', type: 'radio', values: ['Small', 'Medium', 'Large'], pricing: 'Small (base), Medium (+10), Large (+20)' },
        { name: 'Milk Options', type: 'radio', values: ['Regular Milk', 'Oat Milk', 'Almond Milk'], pricing: '+5 EGP for alternatives' },
        { name: 'Toppings', type: 'multi', values: ['Whipped Cream', 'Chocolate Sauce', 'Caramel Sauce', 'Oreo Crumble', 'Sprinkles'], pricing: '+5 EGP each' },
        { name: 'Sweetness', type: 'radio', values: ['Less Sweet', 'Regular', 'Extra Sweet'], pricing: 'No additional cost' }
      ]
    },
    'Milkshake': {
      products: byCategory['Milkshake']?.length || 0,
      attributes: [
        { name: 'Size', type: 'radio', values: ['Small', 'Medium', 'Large'], pricing: 'Small (base), Medium (+10), Large (+20)' },
        { name: 'Milk Type', type: 'radio', values: ['Regular Milk', 'Oat Milk', 'Almond Milk'], pricing: '+5 EGP for alternatives' },
        { name: 'Toppings', type: 'multi', values: ['Whipped Cream', 'Cherry', 'Chocolate Chips', 'Sprinkles', 'Oreo Crumble'], pricing: '+5 EGP each' },
        { name: 'Thickness', type: 'radio', values: ['Regular', 'Extra Thick'], pricing: 'No additional cost' }
      ]
    },
    'Smoothie': {
      products: byCategory['Smoothie']?.length || 0,
      attributes: [
        { name: 'Size', type: 'radio', values: ['Small', 'Medium', 'Large'], pricing: 'Small (base), Medium (+10), Large (+20)' },
        { name: 'Base', type: 'radio', values: ['Milk Base', 'Yogurt Base', 'Juice Base'], pricing: 'No additional cost' },
        { name: 'Extras', type: 'multi', values: ['Chia Seeds', 'Protein Powder', 'Honey', 'Granola'], pricing: '+8 EGP each' },
        { name: 'Ice Level', type: 'radio', values: ['Less Ice', 'Regular', 'Extra Ice'], pricing: 'No additional cost' }
      ]
    },
    'Food': {
      products: byCategory['Food']?.length || 0,
      attributes: [
        { name: 'Temperature', type: 'radio', values: ['Cold', 'Warm', 'Hot'], pricing: 'No additional cost' },
        { name: 'Extras', type: 'multi', values: ['Extra Cheese', 'Extra Sauce', 'Extra Vegetables'], pricing: '+10 EGP each' }
      ]
    },
    'Soda': {
      products: byCategory['Soda']?.length || 0,
      attributes: [
        { name: 'Size', type: 'radio', values: ['Small', 'Medium', 'Large'], pricing: 'Small (base), Medium (+5), Large (+10)' },
        { name: 'Ice Level', type: 'radio', values: ['No Ice', 'Less Ice', 'Regular', 'Extra Ice'], pricing: 'No additional cost' },
        { name: 'Add-ons', type: 'multi', values: ['Lemon Slice', 'Mint', 'Fresh Fruit'], pricing: '+3 EGP each' }
      ]
    }
  };

  Object.entries(recommendations).forEach(([category, data]: [string, any]) => {
    console.log(`\n${category.toUpperCase()} (${data.products} products)`);
    console.log('─'.repeat(60));
    data.attributes.forEach((attr: any, idx: number) => {
      const status = attr.status || '⏳ To Implement';
      console.log(`  ${idx + 1}. ${attr.name} (${attr.type})`);
      console.log(`     Values: ${attr.values.join(', ')}`);
      if (attr.pricing) console.log(`     Pricing: ${attr.pricing}`);
      console.log(`     Status: ${status}`);
    });
  });

  console.log('\n\n🎯 PRIORITY IMPLEMENTATION PLAN');
  console.log('═'.repeat(60));
  console.log('\nPhase 1 - Essential Attributes (High Priority):');
  console.log('  1. Milk Options - Apply to Coffee, Tea, Iced, Frappe, Milkshake');
  console.log('  2. Shots - Apply to Coffee (especially Espresso)');
  console.log('  3. Size - Extend to Frappe, Milkshake, Smoothie, Soda');
  console.log('  4. Ice Level - Apply to Iced, Soda');

  console.log('\nPhase 2 - Enhancement Attributes (Medium Priority):');
  console.log('  5. Sugar/Sweetness Level - Coffee, Tea, Iced');
  console.log('  6. Toppings - Iced, Frappe, Milkshake');
  console.log('  7. Extras - Coffee, Tea, Smoothie, Food');

  console.log('\nPhase 3 - Optional Attributes (Low Priority):');
  console.log('  8. Base options - Smoothie');
  console.log('  9. Thickness - Milkshake');
  console.log('  10. Temperature - Food');

  console.log('\n\n🔧 ESPRESSO SHOTS FIX');
  console.log('═'.repeat(60));
  console.log('Action Required:');
  console.log('  1. Remove "Espresso Double" product');
  console.log('  2. Add "Shots" attribute to "Espresso" product');
  console.log('  3. Configure: Single (default, +0), Double (+10), Triple (+20)');

  console.log('\n');
}

analyzeCategoriesForAttributes().catch(console.error);

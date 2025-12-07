import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient.js';
dotenv.config();

async function addComprehensiveExtras() {
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  config.timeoutMs = 120000;
  const odoo = new OdooClient(config);

  console.log('🚀 Adding Comprehensive Extras Collection...\n');

  // Get Extras category ID
  const extrasCategories = await odoo.searchRead('product.category', [['name', '=', 'Extras']], ['id', 'name']);
  if (extrasCategories.length === 0) {
    console.error('❌ Extras category not found');
    return;
  }
  const extrasCategoryId = extrasCategories[0].id;
  console.log(`✅ Found Extras category (ID: ${extrasCategoryId})\n`);

  // Comprehensive extras list organized by category
  const comprehensiveExtras = [
    // Syrups & Flavors (15-20 EGP)
    { name: 'Extra Vanilla Syrup', price: 15, category: 'Syrups' },
    { name: 'Extra Caramel Syrup', price: 15, category: 'Syrups' },
    { name: 'Extra Hazelnut Syrup', price: 15, category: 'Syrups' },
    { name: 'Extra Chocolate Syrup', price: 15, category: 'Syrups' },
    { name: 'Extra Coconut Syrup', price: 15, category: 'Syrups' },
    { name: 'Extra Peppermint Syrup', price: 15, category: 'Syrups' },
    { name: 'Extra Cinnamon Syrup', price: 15, category: 'Syrups' },
    { name: 'Extra Maple Syrup', price: 18, category: 'Syrups' },
    { name: 'Extra Brown Sugar Syrup', price: 15, category: 'Syrups' },
    { name: 'Extra Toffee Syrup', price: 18, category: 'Syrups' },
    { name: 'Extra Irish Cream Syrup', price: 18, category: 'Syrups' },
    { name: 'Extra White Chocolate Syrup', price: 18, category: 'Syrups' },
    { name: 'Extra Pistachio Syrup', price: 20, category: 'Syrups' },
    { name: 'Extra Lavender Syrup', price: 20, category: 'Syrups' },
    { name: 'Extra Rose Syrup', price: 20, category: 'Syrups' },

    // Toppings & Crumbles (10-20 EGP)
    { name: 'Extra Chocolate Chips', price: 12, category: 'Toppings' },
    { name: 'Extra White Chocolate Chips', price: 12, category: 'Toppings' },
    { name: 'Extra Caramel Bits', price: 12, category: 'Toppings' },
    { name: 'Extra Graham Cracker Crumble', price: 12, category: 'Toppings' },
    { name: 'Extra Brownie Pieces', price: 15, category: 'Toppings' },
    { name: 'Extra Wafer Sticks', price: 10, category: 'Toppings' },
    { name: 'Extra Crushed Peanuts', price: 12, category: 'Toppings' },
    { name: 'Extra Crushed Almonds', price: 15, category: 'Toppings' },
    { name: 'Extra Crushed Hazelnuts', price: 15, category: 'Toppings' },
    { name: 'Extra Crushed Pistachios', price: 18, category: 'Toppings' },
    { name: 'Extra Crushed Walnuts', price: 15, category: 'Toppings' },
    { name: 'Extra Rainbow Sprinkles', price: 8, category: 'Toppings' },
    { name: 'Extra Chocolate Sprinkles', price: 8, category: 'Toppings' },
    { name: 'Extra Candy Pieces', price: 10, category: 'Toppings' },
    { name: 'Extra Mini Marshmallows', price: 10, category: 'Toppings' },

    // Drizzles & Sauces (10-15 EGP)
    { name: 'Extra Honey Drizzle', price: 12, category: 'Drizzles' },
    { name: 'Extra Nutella Drizzle', price: 15, category: 'Drizzles' },
    { name: 'Extra Lotus Biscoff Sauce', price: 15, category: 'Drizzles' },
    { name: 'Extra Salted Caramel Sauce', price: 12, category: 'Drizzles' },
    { name: 'Extra White Chocolate Sauce', price: 12, category: 'Drizzles' },
    { name: 'Extra Dark Chocolate Sauce', price: 12, category: 'Drizzles' },
    { name: 'Extra Strawberry Sauce', price: 10, category: 'Drizzles' },
    { name: 'Extra Blueberry Sauce', price: 12, category: 'Drizzles' },
    { name: 'Extra Raspberry Sauce', price: 12, category: 'Drizzles' },
    { name: 'Extra Passion Fruit Sauce', price: 12, category: 'Drizzles' },

    // Powders & Dusts (8-15 EGP)
    { name: 'Extra Vanilla Powder', price: 10, category: 'Powders' },
    { name: 'Extra Espresso Powder', price: 10, category: 'Powders' },
    { name: 'Extra Chai Spice Mix', price: 10, category: 'Powders' },
    { name: 'Extra Pumpkin Spice', price: 12, category: 'Powders' },
    { name: 'Extra Cardamom Powder', price: 10, category: 'Powders' },
    { name: 'Extra Nutmeg Powder', price: 8, category: 'Powders' },
    { name: 'Extra Turmeric Powder', price: 10, category: 'Powders' },
    { name: 'Extra Spirulina Powder', price: 15, category: 'Powders' },

    // Fresh Add-ons (5-15 EGP)
    { name: 'Extra Banana Slices', price: 8, category: 'Fresh' },
    { name: 'Extra Strawberry Slices', price: 12, category: 'Fresh' },
    { name: 'Extra Blueberries', price: 15, category: 'Fresh' },
    { name: 'Extra Mango Chunks', price: 12, category: 'Fresh' },
    { name: 'Extra Kiwi Slices', price: 10, category: 'Fresh' },
    { name: 'Extra Orange Slices', price: 8, category: 'Fresh' },
    { name: 'Extra Lime Wedge', price: 5, category: 'Fresh' },
    { name: 'Extra Cucumber Slices', price: 5, category: 'Fresh' },
    { name: 'Extra Fresh Basil', price: 8, category: 'Fresh' },
    { name: 'Extra Fresh Rosemary', price: 8, category: 'Fresh' },
    { name: 'Extra Fresh Ginger', price: 8, category: 'Fresh' },

    // Specialty & Premium (15-30 EGP)
    { name: 'Extra Edible Gold Flakes', price: 30, category: 'Premium' },
    { name: 'Extra Edible Silver Flakes', price: 25, category: 'Premium' },
    { name: 'Extra Edible Glitter', price: 20, category: 'Premium' },
    { name: 'Extra Activated Charcoal', price: 15, category: 'Premium' },
    { name: 'Extra Blue Spirulina', price: 18, category: 'Premium' },
    { name: 'Extra Beetroot Powder', price: 12, category: 'Premium' },
    { name: 'Extra Butterfly Pea Powder', price: 15, category: 'Premium' },
    { name: 'Extra MCT Oil', price: 20, category: 'Premium' },
    { name: 'Extra CBD Oil', price: 35, category: 'Premium' },
    { name: 'Extra Creatine', price: 25, category: 'Premium' },
    { name: 'Extra BCAA', price: 25, category: 'Premium' },
    { name: 'Extra Pre-Workout Boost', price: 30, category: 'Premium' },

    // Seeds & Grains (8-15 EGP)
    { name: 'Extra Flax Seeds', price: 10, category: 'Seeds' },
    { name: 'Extra Hemp Seeds', price: 15, category: 'Seeds' },
    { name: 'Extra Pumpkin Seeds', price: 12, category: 'Seeds' },
    { name: 'Extra Sunflower Seeds', price: 10, category: 'Seeds' },
    { name: 'Extra Sesame Seeds', price: 8, category: 'Seeds' },
    { name: 'Extra Quinoa Puffs', price: 12, category: 'Seeds' },
    { name: 'Extra Oat Granola', price: 10, category: 'Seeds' },
    { name: 'Extra Muesli Mix', price: 12, category: 'Seeds' },

    // Dairy & Cream (10-20 EGP)
    { name: 'Extra Ice Cream Ball', price: 20, category: 'Dairy' },
    { name: 'Extra Gelato Scoop', price: 22, category: 'Dairy' },
    { name: 'Extra Frozen Yogurt', price: 18, category: 'Dairy' },
    { name: 'Extra Mascarpone Cream', price: 20, category: 'Dairy' },
    { name: 'Extra Cream Cheese', price: 15, category: 'Dairy' },
    { name: 'Extra Condensed Milk', price: 12, category: 'Dairy' },
    { name: 'Extra Evaporated Milk', price: 10, category: 'Dairy' },

    // Candy & Sweets (8-18 EGP)
    { name: 'Extra M&Ms', price: 12, category: 'Candy' },
    { name: 'Extra Skittles', price: 12, category: 'Candy' },
    { name: 'Extra KitKat Pieces', price: 15, category: 'Candy' },
    { name: 'Extra Snickers Pieces', price: 15, category: 'Candy' },
    { name: 'Extra Twix Pieces', price: 15, category: 'Candy' },
    { name: 'Extra Bounty Pieces', price: 15, category: 'Candy' },
    { name: 'Extra Maltesers', price: 15, category: 'Candy' },
    { name: 'Extra Ferrero Rocher', price: 18, category: 'Candy' },
    { name: 'Extra Raffaello', price: 18, category: 'Candy' },

    // Biscuits & Cookies (10-15 EGP)
    { name: 'Extra Lotus Biscoff Cookie', price: 12, category: 'Cookies' },
    { name: 'Extra Digestive Biscuit', price: 8, category: 'Cookies' },
    { name: 'Extra Shortbread Cookie', price: 10, category: 'Cookies' },
    { name: 'Extra Chocolate Chip Cookie', price: 12, category: 'Cookies' },
    { name: 'Extra Macaron', price: 15, category: 'Cookies' },

    // Spices & Aromatics (8-12 EGP)
    { name: 'Extra Star Anise', price: 10, category: 'Spices' },
    { name: 'Extra Cloves', price: 8, category: 'Spices' },
    { name: 'Extra Saffron Threads', price: 25, category: 'Spices' },
    { name: 'Extra Vanilla Bean', price: 20, category: 'Spices' },
    { name: 'Extra Orange Zest', price: 8, category: 'Spices' },
    { name: 'Extra Lemon Zest', price: 8, category: 'Spices' },

    // Special Milk Alternatives (20-30 EGP)
    { name: 'Extra Macadamia Milk', price: 25, category: 'Milk' },
    { name: 'Extra Cashew Milk', price: 22, category: 'Milk' },
    { name: 'Extra Rice Milk', price: 18, category: 'Milk' },
    { name: 'Extra Hemp Milk', price: 25, category: 'Milk' },
    { name: 'Extra Pea Protein Milk', price: 22, category: 'Milk' },
  ];

  console.log('📝 Creating comprehensive extras collection...\n');
  
  let createdCount = 0;
  let skippedCount = 0;
  const categoryCounts: Record<string, number> = {};

  for (const extra of comprehensiveExtras) {
    const existing = await odoo.searchRead('product.template',
      [['name', '=', extra.name]],
      ['id']
    );

    if (existing.length > 0) {
      console.log(`  ℹ️  '${extra.name}' already exists, skipping...`);
      skippedCount++;
      continue;
    }

    const productId = await odoo.rpc('product.template', 'create', [{
      name: extra.name,
      list_price: extra.price,
      categ_id: extrasCategoryId,
      type: 'consu',
      sale_ok: true,
      purchase_ok: false,
    }]);

    console.log(`  ✓ Created: ${extra.name} (${extra.price} EGP) [${extra.category}]`);
    createdCount++;
    
    categoryCounts[extra.category] = (categoryCounts[extra.category] || 0) + 1;
  }

  console.log('\n✅ Comprehensive extras creation complete!\n');
  console.log('📊 Summary by Category:');
  console.log('='.repeat(60));
  
  for (const [category, count] of Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${category.padEnd(20)} : ${count} items`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`  Total Created        : ${createdCount} new extras`);
  console.log(`  Already Existed      : ${skippedCount} extras`);
  console.log(`  Total Attempted      : ${comprehensiveExtras.length} extras`);
  console.log('='.repeat(60));
  
  console.log('\n🎯 Your Extras category is now fully stocked!');
  console.log('🎨 Users have maximum customization flexibility!');
}

addComprehensiveExtras().catch(console.error);

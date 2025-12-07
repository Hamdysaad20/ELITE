import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient.js';
dotenv.config();

async function applyAttributesToCategories() {
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  const odoo = new OdooClient(config);

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║        APPLYING ATTRIBUTES TO PRODUCT CATEGORIES           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Get all attributes
  const allAttributes = await odoo.searchRead('product.attribute', [], ['id', 'name']);
  const attrMap: Record<string, number> = {};
  allAttributes.forEach((attr: any) => {
    attrMap[attr.name] = attr.id;
  });

  console.log('📋 Available Attributes:');
  Object.entries(attrMap).forEach(([name, id]) => {
    console.log(`  - ${name} (ID: ${id})`);
  });

  // Define attribute application plan
  const categoryPlan = [
    {
      category: 'Coffee',
      excludeProducts: ['Espresso', 'Espresso Macchiato'], // Espresso has Shots already
      attributes: [
        { name: 'Milk Options', applyPricing: true, prices: { 'Oat Milk': 5, 'Almond Milk': 5, 'Soy Milk': 5, 'Lactose-Free Milk': 5 } },
        { name: 'Shots', applyPricing: true, prices: { 'Double Shot': 10, 'Triple Shot': 20 } },
        { name: 'Extras', applyPricing: true, prices: { 'Whipped Cream': 5, 'Caramel Drizzle': 5, 'Chocolate Sauce': 5, 'Vanilla Syrup': 5, 'Hazelnut Syrup': 5 } },
        { name: 'Sugar Level', applyPricing: false }
      ]
    },
    {
      category: 'Tea',
      attributes: [
        { name: 'Milk Options', applyPricing: true, prices: { 'Oat Milk': 5, 'Almond Milk': 5 } },
        { name: 'Tea Extras', applyPricing: true, prices: { 'Honey': 3, 'Lemon': 3, 'Mint': 3, 'Ginger': 3 } },
        { name: 'Sugar Level', applyPricing: false }
      ]
    },
    {
      category: 'Iced',
      attributes: [
        { name: 'Milk Options', applyPricing: true, prices: { 'Oat Milk': 5, 'Almond Milk': 5, 'Soy Milk': 5 } },
        { name: 'Ice Level', applyPricing: false },
        { name: 'Toppings', applyPricing: true, prices: { 'Whipped Cream': 5, 'BOBA Pearls': 10, 'Chocolate Chips': 5, 'Caramel Drizzle': 5 } }
      ]
    },
    {
      category: 'Frappe',
      attributes: [
        { name: 'Milk Options', applyPricing: true, prices: { 'Oat Milk': 5, 'Almond Milk': 5 } },
        { name: 'Toppings', applyPricing: true, prices: { 'Whipped Cream': 5, 'Chocolate Sauce': 5, 'Caramel Sauce': 5, 'Oreo Crumble': 5, 'Sprinkles': 5 } }
      ]
    },
    {
      category: 'Milkshake',
      attributes: [
        { name: 'Milk Options', applyPricing: true, prices: { 'Oat Milk': 5, 'Almond Milk': 5 } },
        { name: 'Toppings', applyPricing: true, prices: { 'Whipped Cream': 5, 'Cherry': 3, 'Chocolate Chips': 5, 'Sprinkles': 5, 'Oreo Crumble': 5 } },
        { name: 'Thickness', applyPricing: false }
      ]
    },
    {
      category: 'Smoothie',
      attributes: [
        { name: 'Smoothie Base', applyPricing: false },
        { name: 'Smoothie Extras', applyPricing: true, prices: { 'Chia Seeds': 8, 'Protein Powder': 8, 'Honey': 8, 'Granola': 8 } },
        { name: 'Ice Level', applyPricing: false }
      ]
    },
    {
      category: 'Food',
      attributes: [
        { name: 'Temperature', applyPricing: false },
        { name: 'Food Extras', applyPricing: true, prices: { 'Extra Cheese': 10, 'Extra Sauce': 10, 'Extra Vegetables': 10 } }
      ]
    },
    {
      category: 'Soda',
      attributes: [
        { name: 'Ice Level', applyPricing: false },
        { name: 'Soda Add-ons', applyPricing: true, prices: { 'Lemon Slice': 3, 'Mint': 3, 'Fresh Fruit': 3 } }
      ]
    }
  ];

  let totalApplied = 0;
  let totalSkipped = 0;
  let errors = 0;

  for (const plan of categoryPlan) {
    console.log(`\n\n${'='.repeat(60)}`);
    console.log(`📦 Processing Category: ${plan.category.toUpperCase()}`);
    console.log('='.repeat(60));

    // Get products in this category
    const products = await odoo.searchRead('product.template', [
      ['categ_id.name', '=', plan.category],
      ['active', '=', true]
    ], ['id', 'name']);

    console.log(`Found ${products.length} products in ${plan.category}`);

    for (const product of products) {
      // Skip excluded products
      if (plan.excludeProducts && plan.excludeProducts.includes(product.name)) {
        console.log(`⏭️  Skipping excluded product: ${product.name}`);
        totalSkipped++;
        continue;
      }

      console.log(`\n  Processing: ${product.name} (ID: ${product.id})`);

      for (const attrConfig of plan.attributes) {
        try {
          const attrId = attrMap[attrConfig.name];
          if (!attrId) {
            console.log(`    ⚠️  Attribute not found: ${attrConfig.name}`);
            continue;
          }

          // Check if product already has this attribute
          const existing = await odoo.searchRead('product.template.attribute.line', [
            ['product_tmpl_id', '=', product.id],
            ['attribute_id', '=', attrId]
          ], ['id']);

          if (existing.length > 0) {
            console.log(`    ⏭️  Already has: ${attrConfig.name}`);
            totalSkipped++;
            continue;
          }

          // Get attribute values
          const attrValues = await odoo.searchRead('product.attribute.value', [
            ['attribute_id', '=', attrId]
          ], ['id', 'name']);

          // Create attribute line
          const attrLineId = await odoo.rpc<number>('product.template.attribute.line', 'create', [{
            product_tmpl_id: product.id,
            attribute_id: attrId,
            value_ids: [[6, 0, attrValues.map((v: any) => v.id)]]
          }]);

          console.log(`    ✅ Applied: ${attrConfig.name} (${attrValues.length} values)`);

          // Set pricing if applicable
          if (attrConfig.applyPricing && attrConfig.prices) {
            for (const attrValue of attrValues) {
              const priceExtra = attrConfig.prices[attrValue.name] || 0;
              
              await odoo.rpc('product.template.attribute.value', 'create', [{
                attribute_line_id: attrLineId,
                product_tmpl_id: product.id,
                attribute_id: attrId,
                product_attribute_value_id: attrValue.id,
                price_extra: priceExtra
              }]);
            }
            console.log(`    💰 Pricing configured`);
          }

          totalApplied++;

        } catch (error: any) {
          console.error(`    ❌ Error applying ${attrConfig.name}: ${error.message}`);
          errors++;
        }
      }
    }
  }

  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║           ATTRIBUTE APPLICATION COMPLETE                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Attributes Applied: ${totalApplied}`);
  console.log(`   ⏭️  Skipped: ${totalSkipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log('\n');
}

applyAttributesToCategories().catch(console.error);

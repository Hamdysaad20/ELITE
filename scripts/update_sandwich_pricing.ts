import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient.js';
dotenv.config();

async function updateSandwichPricing() {
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  config.timeoutMs = 120000;
  const odoo = new OdooClient(config);

  console.log('💰 Updating Sandwich Pricing and Configuration...\n');

  // Get Food category
  const foodCategory = await odoo.searchRead('product.category',
    [['name', '=', 'Food']],
    ['id', 'name']
  );

  if (foodCategory.length === 0) {
    console.log('❌ Food category not found!');
    return;
  }

  const foodCategoryId = foodCategory[0].id;

  // Sandwich pricing (reasonable prices for Egypt in EGP)
  const sandwichUpdates = [
    { name: 'Club Sandwich', price: 85, sku: 'SAND-CLUB' },
    { name: 'Chicken Curry Sandwich', price: 75, sku: 'SAND-CHICKEN' },
    { name: 'Spicy Tuna Sandwich', price: 80, sku: 'SAND-TUNA' },
    { name: 'Mozzarella Sandwich', price: 70, sku: 'SAND-MOZZ' },
    { name: 'Custom sandwich', price: 0, sku: 'SAND-CUSTOM-OLD' }, // Will be archived
  ];

  console.log('📝 Updating sandwich products...');
  console.log('='.repeat(70));

  let updatedCount = 0;
  let archivedCount = 0;

  for (const sandwich of sandwichUpdates) {
    const products = await odoo.searchRead('product.template',
      [['name', '=', sandwich.name]],
      ['id', 'name', 'list_price', 'categ_id']
    );

    if (products.length > 0) {
      const product = products[0];
      
      // Archive "Custom sandwich" (lowercase) as we have "Custom Sandwich" already
      if (sandwich.name === 'Custom sandwich') {
        await odoo.rpc('product.template', 'write', [[product.id], {
          active: false
        }]);
        console.log(`  ✓ Archived duplicate: ${sandwich.name}`);
        archivedCount++;
        continue;
      }

      await odoo.rpc('product.template', 'write', [[product.id], {
        list_price: sandwich.price,
        default_code: sandwich.sku,
        categ_id: foodCategoryId,
        available_in_pos: true,
      }]);

      console.log(`  ✓ Updated: ${sandwich.name}`);
      console.log(`    Price: ${sandwich.price} EGP`);
      console.log(`    SKU: ${sandwich.sku}`);
      console.log(`    Category: Food`);
      updatedCount++;
    }
  }

  // Sync to POS category
  console.log('\n📝 Syncing to POS category...');
  const posCategories = await odoo.searchRead('pos.category',
    [['name', '=', 'Food']],
    ['id', 'name']
  );

  let posFoodCategoryId: number;

  if (posCategories.length > 0) {
    posFoodCategoryId = posCategories[0].id;
    console.log(`  ✓ Found POS Food category (ID: ${posFoodCategoryId})`);
  } else {
    posFoodCategoryId = await odoo.rpc('pos.category', 'create', [{
      name: 'Food'
    }]);
    console.log(`  ✓ Created POS Food category (ID: ${posFoodCategoryId})`);
  }

  // Update all active sandwiches to have POS category
  const allSandwiches = await odoo.searchRead('product.template',
    [
      ['categ_id', '=', foodCategoryId],
      ['active', '=', true],
      '|',
      ['name', 'ilike', 'sandwich'],
      ['name', 'ilike', 'burger']
    ],
    ['id', 'name']
  );

  console.log(`\n📝 Ensuring ${allSandwiches.length} food items are in POS...`);
  for (const product of allSandwiches) {
    await odoo.rpc('product.template', 'write', [[product.id], {
      available_in_pos: true,
      pos_categ_ids: [[6, 0, [posFoodCategoryId]]]
    }]);
  }
  console.log(`  ✓ All food items synced to POS`);

  // Show final sandwich list
  console.log('\n✅ Sandwich Update Complete!\n');
  console.log('📊 Final Sandwich List:');
  console.log('='.repeat(70));

  const finalSandwiches = await odoo.searchRead('product.template',
    [
      ['categ_id', '=', foodCategoryId],
      ['active', '=', true],
      '|',
      ['name', 'ilike', 'sandwich'],
      ['name', 'ilike', 'burger']
    ],
    ['id', 'name', 'list_price', 'default_code', 'available_in_pos']
  );

  for (const sandwich of finalSandwiches) {
    console.log(`  ${sandwich.available_in_pos ? '✓' : '○'} ${sandwich.name}`);
    console.log(`    Price: ${sandwich.list_price} EGP`);
    console.log(`    SKU: ${sandwich.default_code || 'N/A'}`);
    console.log(`    Available in POS: ${sandwich.available_in_pos ? 'Yes' : 'No'}`);
    console.log('  ' + '-'.repeat(68));
  }

  console.log('\n📊 Summary:');
  console.log('='.repeat(70));
  console.log(`  Sandwiches Updated:        ${updatedCount}`);
  console.log(`  Duplicates Archived:       ${archivedCount}`);
  console.log(`  Total Active Food Items:   ${finalSandwiches.length}`);
  console.log(`  All in POS:                ${finalSandwiches.filter(s => s.available_in_pos).length}`);
  console.log('='.repeat(70));

  console.log('\n💡 Next Steps:');
  console.log('   1. Close and reopen POS session to see sandwiches');
  console.log('   2. Sync to website: curl -X POST http://localhost:3000/api/sync/products -H "x-admin-token: change-me"');
}

updateSandwichPricing().catch(console.error);

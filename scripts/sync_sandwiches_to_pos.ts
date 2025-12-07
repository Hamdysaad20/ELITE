import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient.js';
dotenv.config();

async function syncSandwichesToPOS() {
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  config.timeoutMs = 180000;
  const odoo = new OdooClient(config);

  console.log('🔄 Syncing Sandwiches to POS...\n');

  // Get Food category
  const foodCategory = await odoo.searchRead('product.category',
    [['name', '=', 'Food']],
    ['id']
  );

  if (foodCategory.length === 0) {
    console.log('❌ Food category not found!');
    return;
  }

  const foodCategoryId = foodCategory[0].id;

  // Get POS Food category
  let posFoodCategory = await odoo.searchRead('pos.category',
    [['name', '=', 'Food']],
    ['id']
  );

  let posFoodCategoryId: number;
  if (posFoodCategory.length === 0) {
    posFoodCategoryId = await odoo.rpc('pos.category', 'create', [{ name: 'Food' }]);
    console.log('✓ Created POS Food category');
  } else {
    posFoodCategoryId = posFoodCategory[0].id;
  }

  // Get all food products
  const allFood = await odoo.searchRead('product.template',
    [['categ_id', '=', foodCategoryId], ['active', '=', true]],
    ['id', 'name', 'list_price', 'available_in_pos']
  );

  console.log(`📦 Found ${allFood.length} food items\n`);

  let syncedCount = 0;
  let alreadySynced = 0;

  for (const item of allFood) {
    if (item.available_in_pos) {
      alreadySynced++;
      console.log(`  ✓ ${item.name} - Already in POS (${item.list_price} EGP)`);
    } else {
      await odoo.rpc('product.template', 'write', [[item.id], {
        available_in_pos: true,
        pos_categ_ids: [[6, 0, [posFoodCategoryId]]],
      }]);
      syncedCount++;
      console.log(`  ✓ Synced: ${item.name} (${item.list_price} EGP)`);
    }
  }

  console.log('\n✅ POS Sync Complete!');
  console.log('='.repeat(70));
  console.log(`  Newly Synced:       ${syncedCount}`);
  console.log(`  Already in POS:     ${alreadySynced}`);
  console.log(`  Total Food Items:   ${allFood.length}`);
  console.log('='.repeat(70));

  console.log('\n💡 Next Steps:');
  console.log('   1. Close your POS session');
  console.log('   2. Reopen POS session to see all sandwiches');
  console.log('   3. Test Custom Sandwich multi-selection');
}

syncSandwichesToPOS().catch(console.error);

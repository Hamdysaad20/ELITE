import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient.js';
dotenv.config();

async function findAndRestoreSandwiches() {
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  config.timeoutMs = 120000;
  const odoo = new OdooClient(config);

  console.log('🔍 Searching for Sandwich Products...\n');

  // Search for archived products with "sandwich" in the name
  console.log('📝 Step 1: Checking archived products...');
  const archivedSandwiches = await odoo.searchRead('product.template',
    [
      '|',
      ['name', 'ilike', 'sandwich'],
      ['name', 'ilike', 'club'],
      ['active', '=', false]
    ],
    ['id', 'name', 'list_price', 'categ_id', 'active', 'default_code']
  );

  console.log(`  Found ${archivedSandwiches.length} archived sandwich products\n`);

  if (archivedSandwiches.length > 0) {
    console.log('📋 Archived Sandwiches Found:');
    console.log('='.repeat(70));
    for (const product of archivedSandwiches) {
      const categoryName = Array.isArray(product.categ_id) ? product.categ_id[1] : 'Unknown';
      console.log(`  ID: ${product.id}`);
      console.log(`  Name: ${product.name}`);
      console.log(`  Price: ${product.list_price} EGP`);
      console.log(`  Category: ${categoryName}`);
      console.log(`  SKU: ${product.default_code || 'N/A'}`);
      console.log(`  Active: ${product.active ? 'Yes' : 'No'}`);
      console.log('  ' + '-'.repeat(68));
    }
  }

  // Also search active sandwiches
  console.log('\n📝 Step 2: Checking active sandwich products...');
  const activeSandwiches = await odoo.searchRead('product.template',
    [
      '|',
      ['name', 'ilike', 'sandwich'],
      ['name', 'ilike', 'club'],
      ['active', '=', true]
    ],
    ['id', 'name', 'list_price', 'categ_id', 'active', 'default_code']
  );

  console.log(`  Found ${activeSandwiches.length} active sandwich products\n`);

  if (activeSandwiches.length > 0) {
    console.log('📋 Active Sandwiches:');
    console.log('='.repeat(70));
    for (const product of activeSandwiches) {
      const categoryName = Array.isArray(product.categ_id) ? product.categ_id[1] : 'Unknown';
      console.log(`  ID: ${product.id}`);
      console.log(`  Name: ${product.name}`);
      console.log(`  Price: ${product.list_price} EGP`);
      console.log(`  Category: ${categoryName}`);
      console.log(`  SKU: ${product.default_code || 'N/A'}`);
      console.log('  ' + '-'.repeat(68));
    }
  }

  // Search in Food category for any sandwich-related items
  console.log('\n📝 Step 3: Checking Food category for sandwiches...');
  const foodCategory = await odoo.searchRead('product.category',
    [['name', 'ilike', 'food']],
    ['id', 'name']
  );

  if (foodCategory.length > 0) {
    const foodProducts = await odoo.searchRead('product.template',
      [['categ_id', '=', foodCategory[0].id]],
      ['id', 'name', 'list_price', 'active', 'default_code']
    );

    const sandwichLike = foodProducts.filter((p: any) => 
      p.name.toLowerCase().includes('sandwich') || 
      p.name.toLowerCase().includes('club') ||
      p.name.toLowerCase().includes('burger') ||
      p.name.toLowerCase().includes('wrap')
    );

    console.log(`  Found ${sandwichLike.length} sandwich-like items in Food category\n`);

    if (sandwichLike.length > 0) {
      console.log('📋 Food Category Items:');
      console.log('='.repeat(70));
      for (const product of sandwichLike) {
        console.log(`  ID: ${product.id}`);
        console.log(`  Name: ${product.name}`);
        console.log(`  Price: ${product.list_price} EGP`);
        console.log(`  Active: ${product.active ? 'Yes' : 'No'}`);
        console.log(`  SKU: ${product.default_code || 'N/A'}`);
        console.log('  ' + '-'.repeat(68));
      }
    }
  }

  // Restore archived sandwiches
  if (archivedSandwiches.length > 0) {
    console.log('\n📝 Step 4: Restoring archived sandwiches...');
    console.log('='.repeat(70));

    let restoredCount = 0;
    for (const product of archivedSandwiches) {
      try {
        await odoo.rpc('product.template', 'write', [[product.id], {
          active: true
        }]);
        console.log(`  ✓ Restored: ${product.name}`);
        restoredCount++;
      } catch (error) {
        console.log(`  ❌ Failed to restore ${product.name}: ${error}`);
      }
    }

    console.log(`\n  ✓ Restored ${restoredCount} sandwich products`);
  }

  console.log('\n✅ Sandwich Search Complete!\n');
  console.log('📊 Summary:');
  console.log('='.repeat(70));
  console.log(`  Archived Sandwiches Found:    ${archivedSandwiches.length}`);
  console.log(`  Active Sandwiches:            ${activeSandwiches.length}`);
  console.log(`  Total Sandwiches:             ${archivedSandwiches.length + activeSandwiches.length}`);
  console.log('='.repeat(70));

  if (archivedSandwiches.length > 0) {
    console.log('\n✅ All archived sandwiches have been restored!');
    console.log('💡 Next steps:');
    console.log('   1. Sync to POS: npx tsx -r dotenv/config scripts/force_full_pos_sync.ts');
    console.log('   2. Sync to website: curl -X POST http://localhost:3000/api/sync/products -H "x-admin-token: change-me"');
  } else if (activeSandwiches.length === 0) {
    console.log('\n⚠️  No sandwich products found!');
    console.log('💡 Would you like to create new sandwich products?');
  } else {
    console.log('\n✅ All sandwiches are already active!');
  }
}

findAndRestoreSandwiches().catch(console.error);

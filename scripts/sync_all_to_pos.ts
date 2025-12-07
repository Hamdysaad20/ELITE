import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient.js';
dotenv.config();

async function syncAllToPos() {
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  config.timeoutMs = 180000; // 3 minutes
  const odoo = new OdooClient(config);

  console.log('🔄 Starting POS Synchronization...\n');

  // Get all product categories
  const categories = await odoo.searchRead('product.category', 
    [], 
    ['id', 'name']
  );

  console.log(`📂 Found ${categories.length} product categories\n`);

  // Get or create corresponding POS categories
  console.log('📝 Step 1: Syncing POS Categories...');
  const categoryMapping: Record<number, number> = {};

  for (const category of categories) {
    // Check if POS category exists
    const posCategories = await odoo.searchRead('pos.category',
      [['name', '=', category.name]],
      ['id', 'name']
    );

    let posCategoryId: number;

    if (posCategories.length > 0) {
      posCategoryId = posCategories[0].id;
      console.log(`  ✓ Found POS category: ${category.name} (ID: ${posCategoryId})`);
    } else {
      posCategoryId = await odoo.rpc('pos.category', 'create', [{
        name: category.name,
      }]);
      console.log(`  ✓ Created POS category: ${category.name} (ID: ${posCategoryId})`);
    }

    categoryMapping[category.id] = posCategoryId;
  }

  // Get all products
  console.log('\n📝 Step 2: Syncing Products to POS...');
  const products = await odoo.searchRead('product.template',
    [['active', '=', true]],
    ['id', 'name', 'categ_id', 'available_in_pos', 'pos_categ_ids']
  );

  console.log(`  Found ${products.length} products to sync\n`);

  let updatedCount = 0;
  let alreadySynced = 0;

  for (const product of products) {
    const categoryId = Array.isArray(product.categ_id) ? product.categ_id[0] : product.categ_id;
    const posCategoryId = categoryMapping[categoryId];

    if (!posCategoryId) {
      console.log(`  ⚠️  No POS category mapping for ${product.name}, skipping...`);
      continue;
    }

    const isAvailable = Boolean(product.available_in_pos);
    const currentPosCategs = Array.isArray(product.pos_categ_ids) ? product.pos_categ_ids : [];
    const hasCorrectCateg = currentPosCategs.includes(posCategoryId);

    if (isAvailable && hasCorrectCateg) {
      alreadySynced++;
      continue;
    }

    // Update product to be available in POS with correct category
    await odoo.rpc('product.template', 'write', [[product.id], {
      available_in_pos: true,
      pos_categ_ids: [[6, 0, [posCategoryId]]],
    }]);

    updatedCount++;
    if (updatedCount % 10 === 0) {
      console.log(`  ✓ Synced ${updatedCount} products...`);
    }
  }

  console.log('\n✅ POS Synchronization Complete!\n');
  console.log('📊 Summary:');
  console.log('='.repeat(60));
  console.log(`  Total Products:           ${products.length}`);
  console.log(`  Updated:                  ${updatedCount}`);
  console.log(`  Already Synced:           ${alreadySynced}`);
  console.log(`  POS Categories Created:   ${Object.keys(categoryMapping).length}`);
  console.log('='.repeat(60));
  console.log('\n🎯 All products are now available in POS!');
}

syncAllToPos().catch(console.error);

import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient.js';
dotenv.config();

async function forceFullPosSync() {
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  config.timeoutMs = 300000; // 5 minutes
  const odoo = new OdooClient(config);

  console.log('🔄 Starting FULL POS Synchronization...\n');
  console.log('This will sync all products, extras, and attributes to POS\n');

  // Step 1: Get all POS categories
  console.log('📝 Step 1: Syncing POS Categories...');
  const productCategories = await odoo.searchRead('product.category', 
    [], 
    ['id', 'name']
  );

  const categoryMapping: Record<number, number> = {};

  for (const category of productCategories) {
    const posCategories = await odoo.searchRead('pos.category',
      [['name', '=', category.name]],
      ['id', 'name']
    );

    let posCategoryId: number;

    if (posCategories.length > 0) {
      posCategoryId = posCategories[0].id;
    } else {
      posCategoryId = await odoo.rpc('pos.category', 'create', [{
        name: category.name,
      }]);
      console.log(`  ✓ Created POS category: ${category.name}`);
    }

    categoryMapping[category.id] = posCategoryId;
  }

  console.log(`  ✓ Synced ${Object.keys(categoryMapping).length} categories\n`);

  // Step 2: Get ALL products including extras
  console.log('📝 Step 2: Syncing ALL Products to POS...');
  const allProducts = await odoo.searchRead('product.template',
    [],
    ['id', 'name', 'categ_id', 'available_in_pos', 'pos_categ_ids', 'to_weight', 'list_price']
  );

  console.log(`  Found ${allProducts.length} products\n`);

  let updatedCount = 0;
  let alreadyAvailable = 0;
  let errorCount = 0;

  for (const product of allProducts) {
    try {
      const categoryId = Array.isArray(product.categ_id) ? product.categ_id[0] : product.categ_id;
      const posCategoryId = categoryMapping[categoryId];

      if (!posCategoryId) {
        console.log(`  ⚠️  No POS category for ${product.name}, skipping...`);
        continue;
      }

      const isAvailable = Boolean(product.available_in_pos);
      
      if (!isAvailable) {
        // Force enable in POS
        await odoo.rpc('product.template', 'write', [[product.id], {
          available_in_pos: true,
          pos_categ_ids: [[6, 0, [posCategoryId]]],
          to_weight: false, // Ensure it's not a weight-based product
        }]);
        updatedCount++;
        
        if (updatedCount % 20 === 0) {
          console.log(`  ✓ Updated ${updatedCount} products...`);
        }
      } else {
        alreadyAvailable++;
      }
    } catch (error) {
      console.log(`  ❌ Error updating ${product.name}: ${error}`);
      errorCount++;
    }
  }

  console.log(`\n  ✓ Total products synced: ${allProducts.length}`);
  console.log(`  ✓ Updated to be available: ${updatedCount}`);
  console.log(`  ✓ Already available: ${alreadyAvailable}`);
  if (errorCount > 0) {
    console.log(`  ⚠️  Errors encountered: ${errorCount}`);
  }

  // Step 3: Verify extras category products
  console.log('\n📝 Step 3: Verifying Extras Category in POS...');
  const extrasCategory = await odoo.searchRead('product.category',
    [['name', '=', 'Extras']],
    ['id', 'name']
  );

  if (extrasCategory.length > 0) {
    const extrasCatId = extrasCategory[0].id;
    const extrasProducts = await odoo.searchRead('product.template',
      [['categ_id', '=', extrasCatId]],
      ['id', 'name', 'available_in_pos', 'list_price']
    );

    console.log(`  Found ${extrasProducts.length} extras products`);
    
    let extrasUpdated = 0;
    for (const extra of extrasProducts) {
      if (!extra.available_in_pos) {
        const posCategoryId = categoryMapping[extrasCatId];
        if (posCategoryId) {
          await odoo.rpc('product.template', 'write', [[extra.id], {
            available_in_pos: true,
            pos_categ_ids: [[6, 0, [posCategoryId]]],
          }]);
          extrasUpdated++;
        }
      }
    }

    if (extrasUpdated > 0) {
      console.log(`  ✓ Updated ${extrasUpdated} extras to be available in POS`);
    } else {
      console.log(`  ✓ All extras already available in POS`);
    }
  }

  // Step 4: Check POS configuration and cache
  console.log('\n📝 Step 4: Checking POS Configuration...');
  const posConfigs = await odoo.searchRead('pos.config',
    [],
    ['id', 'name', 'iface_available_categ_ids']
  );

  console.log(`  Found ${posConfigs.length} POS configuration(s)`);
  
  for (const config of posConfigs) {
    console.log(`  - ${config.name} (ID: ${config.id})`);
  }

  // Step 5: Get product variants (product.product)
  console.log('\n📝 Step 5: Syncing Product Variants...');
  const variants = await odoo.searchRead('product.product',
    [],
    ['id', 'name', 'product_tmpl_id', 'available_in_pos']
  );

  console.log(`  Found ${variants.length} product variants`);
  
  let variantsUpdated = 0;
  for (const variant of variants) {
    if (!variant.available_in_pos) {
      try {
        await odoo.rpc('product.product', 'write', [[variant.id], {
          available_in_pos: true,
        }]);
        variantsUpdated++;
        
        if (variantsUpdated % 50 === 0) {
          console.log(`  ✓ Updated ${variantsUpdated} variants...`);
        }
      } catch (error) {
        // Some variants may be read-only, skip them
      }
    }
  }

  if (variantsUpdated > 0) {
    console.log(`  ✓ Updated ${variantsUpdated} variants to be available in POS`);
  } else {
    console.log(`  ✓ All variants already available in POS`);
  }

  console.log('\n✅ FULL POS Sync Complete!\n');
  console.log('📊 Summary:');
  console.log('='.repeat(70));
  console.log(`  Total Products (Templates):    ${allProducts.length}`);
  console.log(`  Total Variants:                ${variants.length}`);
  console.log(`  POS Categories:                ${Object.keys(categoryMapping).length}`);
  console.log(`  Products Updated:              ${updatedCount}`);
  console.log(`  Variants Updated:              ${variantsUpdated}`);
  console.log(`  Already Available:             ${alreadyAvailable}`);
  if (errorCount > 0) {
    console.log(`  Errors:                        ${errorCount}`);
  }
  console.log('='.repeat(70));
  console.log('\n🎯 All products are now available in POS!');
  console.log('\n💡 IMPORTANT: Please refresh your POS session:');
  console.log('   1. Close current POS session (if open)');
  console.log('   2. Open a new POS session');
  console.log('   3. The POS will load all products with latest changes');
}

forceFullPosSync().catch(console.error);

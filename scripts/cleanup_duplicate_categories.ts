import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient.js';
dotenv.config();

async function cleanupDuplicateCategories() {
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  config.timeoutMs = 120000;
  const odoo = new OdooClient(config);

  console.log('🧹 Cleaning Up Duplicate Categories...\n');

  // Get all categories
  const allCategories = await odoo.searchRead('product.category',
    [],
    ['id', 'name', 'parent_id']
  );

  console.log(`📂 Found ${allCategories.length} total categories\n`);

  // Identify duplicates and similar categories
  const categoriesToMerge = [
    {
      keep: 'Soda',
      remove: ['Soda & Refreshers'],
      reason: 'Consolidate soda categories'
    },
    {
      keep: 'Coffee',
      remove: ['Hot Drinks / Coffee'],
      reason: 'Coffee is sufficient, no need for nested'
    },
    {
      keep: 'Tea',
      remove: ['Hot Drinks / Tea'],
      reason: 'Tea is sufficient, no need for nested'
    },
    {
      keep: 'Frappe',
      remove: ['Specialty Drinks / Frappe'],
      reason: 'Frappe is sufficient'
    },
    {
      keep: 'Milkshake',
      remove: ['Specialty Drinks / Milkshake'],
      reason: 'Milkshake is sufficient'
    },
    {
      keep: 'Iced',
      remove: ['Iced Drinks'],
      reason: 'Consolidate iced categories'
    },
  ];

  console.log('📝 Planned Merges:');
  console.log('='.repeat(60));
  for (const merge of categoriesToMerge) {
    console.log(`  Keep: "${merge.keep}"`);
    console.log(`  Remove: ${merge.remove.join(', ')}`);
    console.log(`  Reason: ${merge.reason}\n`);
  }

  let movedProducts = 0;
  let deletedCategories = 0;

  for (const merge of categoriesToMerge) {
    // Find the category to keep
    const keepCategory = allCategories.find(c => c.name === merge.keep);
    if (!keepCategory) {
      console.log(`  ⚠️  Category "${merge.keep}" not found, skipping...`);
      continue;
    }

    for (const removeName of merge.remove) {
      // Find category to remove
      const removeCategory = allCategories.find(c => c.name === removeName);
      if (!removeCategory) {
        console.log(`  ℹ️  Category "${removeName}" not found, skipping...`);
        continue;
      }

      console.log(`\n🔄 Processing: ${removeName} -> ${merge.keep}`);

      // Find all products in the category to remove
      const products = await odoo.searchRead('product.template',
        [['categ_id', '=', removeCategory.id]],
        ['id', 'name', 'categ_id']
      );

      if (products.length > 0) {
        console.log(`  Found ${products.length} products to move`);

        // Move products to the keep category
        for (const product of products) {
          await odoo.rpc('product.template', 'write', [[product.id], {
            categ_id: keepCategory.id
          }]);
        }

        movedProducts += products.length;
        console.log(`  ✓ Moved ${products.length} products to "${merge.keep}"`);
      } else {
        console.log(`  No products in "${removeName}"`);
      }

      // Archive the duplicate category (safer than delete)
      try {
        await odoo.rpc('product.category', 'write', [[removeCategory.id], {
          active: false
        }]);
        deletedCategories++;
        console.log(`  ✓ Archived category "${removeName}"`);
      } catch (error) {
        console.log(`  ⚠️  Could not archive "${removeName}": ${error}`);
      }
    }
  }

  console.log('\n✅ Category Cleanup Complete!\n');
  console.log('📊 Summary:');
  console.log('='.repeat(60));
  console.log(`  Products Moved:           ${movedProducts}`);
  console.log(`  Categories Archived:      ${deletedCategories}`);
  console.log('='.repeat(60));
  console.log('\n🎯 Categories are now clean and organized!');
  console.log('💡 Run sync to update the website: POST /api/sync/products');
}

cleanupDuplicateCategories().catch(console.error);

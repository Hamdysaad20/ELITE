import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient.js';
dotenv.config();

async function createTurkishSugarAttribute() {
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  config.timeoutMs = 180000;
  const odoo = new OdooClient(config);

  console.log('🔧 Creating Turkish Coffee Sugar Level Attribute...\n');

  // Check if Turkish Sugar Level attribute exists
  let turkishSugarAttr = await odoo.searchRead('product.attribute',
    [['name', '=', 'Turkish Sugar Level']],
    ['id', 'name']
  );

  let turkishSugarAttrId: number;

  if (turkishSugarAttr.length === 0) {
    // Create new attribute
    turkishSugarAttrId = await odoo.rpc('product.attribute', 'create', [{
      name: 'Turkish Sugar Level',
      display_type: 'radio',
      create_variant: 'no_variant',
    }]);
    console.log(`✓ Created Turkish Sugar Level attribute (ID: ${turkishSugarAttrId})`);

    // Create 5 simple options
    const sugarLevels = [
      'Sada (No Sugar)',
      'Areha (Light)',
      'Mazbout (Medium)',
      'Ziyada (Sweet)',
      'Extra Sweet'
    ];

    console.log('\nCreating sugar level options:');
    for (const level of sugarLevels) {
      await odoo.rpc('product.attribute.value', 'create', [{
        attribute_id: turkishSugarAttrId,
        name: level,
      }]);
      console.log(`  ✓ ${level}`);
    }
  } else {
    turkishSugarAttrId = turkishSugarAttr[0].id;
    console.log(`✓ Turkish Sugar Level attribute already exists (ID: ${turkishSugarAttrId})`);
  }

  // Find Turkish Coffee product
  const turkishCoffee = await odoo.searchRead('product.template',
    [['name', '=', 'Turkish Coffee'], ['active', '=', true]],
    ['id', 'name']
  );

  if (turkishCoffee.length > 0) {
    const productId = turkishCoffee[0].id;
    console.log(`\n✓ Found Turkish Coffee (ID: ${productId})`);

    // Remove old Sugar Level attribute if exists
    const oldSugarAttr = await odoo.searchRead('product.attribute',
      [['name', '=', 'Sugar Level']],
      ['id']
    );

    if (oldSugarAttr.length > 0) {
      const oldLines = await odoo.searchRead('product.template.attribute.line',
        [['product_tmpl_id', '=', productId], ['attribute_id', '=', oldSugarAttr[0].id]],
        ['id']
      );

      if (oldLines.length > 0) {
        await odoo.rpc('product.template.attribute.line', 'unlink', [oldLines.map(l => l.id)]);
        console.log(`  ✓ Removed old Sugar Level attribute`);
      }
    }

    // Check if Turkish Sugar Level already applied
    const existingLines = await odoo.searchRead('product.template.attribute.line',
      [['product_tmpl_id', '=', productId], ['attribute_id', '=', turkishSugarAttrId]],
      ['id']
    );

    if (existingLines.length === 0) {
      // Get new value IDs
      const valueRecords = await odoo.searchRead('product.attribute.value',
        [['attribute_id', '=', turkishSugarAttrId]],
        ['id']
      );

      // Apply Turkish Sugar Level attribute
      await odoo.rpc('product.template.attribute.line', 'create', [{
        product_tmpl_id: productId,
        attribute_id: turkishSugarAttrId,
        value_ids: [[6, 0, valueRecords.map(v => v.id)]],
      }]);

      console.log(`  ✓ Applied Turkish Sugar Level to Turkish Coffee`);
    } else {
      console.log(`  ℹ️  Turkish Sugar Level already applied`);
    }
  } else {
    console.log('\n⚠️  Turkish Coffee product not found');
  }

  console.log('\n✅ Turkish Coffee sugar levels configured!\n');
  console.log('Turkish Sugar Level Options:');
  console.log('  1. Sada (No Sugar)');
  console.log('  2. Areha (Light)');
  console.log('  3. Mazbout (Medium)');
  console.log('  4. Ziyada (Sweet)');
  console.log('  5. Extra Sweet');
}

createTurkishSugarAttribute().catch(console.error);

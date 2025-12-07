import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient.js';
dotenv.config();

async function fixTurkishSugarLevels() {
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  config.timeoutMs = 180000;
  const odoo = new OdooClient(config);

  console.log('🔧 Fixing Turkish Coffee Sugar Levels...\n');

  // Find Sugar Level attribute
  const sugarAttr = await odoo.searchRead('product.attribute',
    [['name', '=', 'Sugar Level']],
    ['id', 'name']
  );

  if (sugarAttr.length === 0) {
    console.log('❌ Sugar Level attribute not found!');
    return;
  }

  const sugarAttrId = sugarAttr[0].id;
  console.log(`✓ Found Sugar Level attribute (ID: ${sugarAttrId})`);

  // Get all current values
  const currentValues = await odoo.searchRead('product.attribute.value',
    [['attribute_id', '=', sugarAttrId]],
    ['id', 'name']
  );

  console.log(`\nCurrent Sugar Level values (${currentValues.length}):`);
  currentValues.forEach(v => console.log(`  - ${v.name}`));

  // Delete all current values
  if (currentValues.length > 0) {
    await odoo.rpc('product.attribute.value', 'unlink', [currentValues.map(v => v.id)]);
    console.log(`\n✓ Removed ${currentValues.length} old values`);
  }

  // Create 5 simple options for Turkish coffee
  const newValues = [
    'Sada (No Sugar)',
    'Areha (Light)',
    'Mazbout (Medium)',
    'Ziyada (Sweet)',
    'Extra Sweet'
  ];

  console.log('\nCreating new Turkish coffee sugar levels:');
  for (const value of newValues) {
    await odoo.rpc('product.attribute.value', 'create', [{
      attribute_id: sugarAttrId,
      name: value,
    }]);
    console.log(`  ✓ ${value}`);
  }

  // Find Turkish Coffee product
  const turkishCoffee = await odoo.searchRead('product.template',
    [['name', '=', 'Turkish Coffee'], ['active', '=', true]],
    ['id', 'name']
  );

  if (turkishCoffee.length > 0) {
    const productId = turkishCoffee[0].id;
    console.log(`\n✓ Found Turkish Coffee (ID: ${productId})`);

    // Remove existing Sugar Level attribute line
    const existingLines = await odoo.searchRead('product.template.attribute.line',
      [['product_tmpl_id', '=', productId], ['attribute_id', '=', sugarAttrId]],
      ['id']
    );

    if (existingLines.length > 0) {
      await odoo.rpc('product.template.attribute.line', 'unlink', [existingLines.map(l => l.id)]);
      console.log(`  ✓ Removed old Sugar Level attribute line`);
    }

    // Get new value IDs
    const newValueRecords = await odoo.searchRead('product.attribute.value',
      [['attribute_id', '=', sugarAttrId]],
      ['id']
    );

    // Apply new Sugar Level attribute
    await odoo.rpc('product.template.attribute.line', 'create', [{
      product_tmpl_id: productId,
      attribute_id: sugarAttrId,
      value_ids: [[6, 0, newValueRecords.map(v => v.id)]],
    }]);

    console.log(`  ✓ Applied new Sugar Level options to Turkish Coffee`);
  } else {
    console.log('\n⚠️  Turkish Coffee product not found');
  }

  console.log('\n✅ Turkish Coffee sugar levels updated!\n');
  console.log('Sugar Level Options:');
  console.log('  1. Sada (No Sugar)');
  console.log('  2. Areha (Light)');
  console.log('  3. Mazbout (Medium)');
  console.log('  4. Ziyada (Sweet)');
  console.log('  5. Extra Sweet');
}

fixTurkishSugarLevels().catch(console.error);

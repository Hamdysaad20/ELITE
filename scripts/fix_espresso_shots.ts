import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient.js';
dotenv.config();

async function fixEspressoProducts() {
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  const odoo = new OdooClient(config);

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           FIXING ESPRESSO PRODUCTS                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Find Espresso Double
  const espressoDouble = await odoo.searchRead('product.template', [
    ['name', '=', 'Espresso Double ']
  ], ['id', 'name', 'active']);

  console.log('🔍 Step 1: Finding Espresso Double');
  console.log('═'.repeat(60));
  if (espressoDouble.length > 0) {
    console.log(`Found: ${espressoDouble[0].name} (ID: ${espressoDouble[0].id})`);
    
    // Archive it (don't delete)
    await odoo.rpc('product.template', 'write', [[espressoDouble[0].id], {
      active: false
    }]);
    console.log(`✅ Archived Espresso Double (ID: ${espressoDouble[0].id})\n`);
  } else {
    console.log('⚠️  Espresso Double not found (might already be removed)\n');
  }

  // Find regular Espresso
  const espresso = await odoo.searchRead('product.template', [
    ['name', '=', 'Espresso'],
    ['active', '=', true]
  ], ['id', 'name', 'list_price']);

  console.log('🔍 Step 2: Finding Regular Espresso');
  console.log('═'.repeat(60));
  if (espresso.length === 0) {
    console.log('❌ Error: Espresso product not found!');
    return;
  }
  console.log(`Found: ${espresso[0].name} (ID: ${espresso[0].id}, Price: ${espresso[0].list_price} EGP)\n`);

  // Get Shots attribute
  const shotsAttr = await odoo.searchRead('product.attribute', [
    ['name', '=', 'Shots']
  ], ['id', 'name']);

  console.log('🔍 Step 3: Getting Shots Attribute');
  console.log('═'.repeat(60));
  if (shotsAttr.length === 0) {
    console.log('❌ Error: Shots attribute not found!');
    return;
  }
  console.log(`Found: ${shotsAttr[0].name} (ID: ${shotsAttr[0].id})\n`);

  // Get Shots values
  const shotsValues = await odoo.searchRead('product.attribute.value', [
    ['attribute_id', '=', shotsAttr[0].id]
  ], ['id', 'name']);

  console.log('📋 Shots Values:');
  shotsValues.forEach((v: any) => {
    console.log(`  - ${v.name} (ID: ${v.id})`);
  });

  // Check if Espresso already has Shots attribute
  const existingAttrLine = await odoo.searchRead('product.template.attribute.line', [
    ['product_tmpl_id', '=', espresso[0].id],
    ['attribute_id', '=', shotsAttr[0].id]
  ], ['id']);

  console.log('\n🔍 Step 4: Applying Shots to Espresso');
  console.log('═'.repeat(60));

  if (existingAttrLine.length > 0) {
    console.log('⚠️  Espresso already has Shots attribute');
  } else {
    // Create attribute line
    const attrLineId = await odoo.rpc<number>('product.template.attribute.line', 'create', [{
      product_tmpl_id: espresso[0].id,
      attribute_id: shotsAttr[0].id,
      value_ids: [[6, 0, shotsValues.map((v: any) => v.id)]]
    }]);
    console.log(`✅ Created attribute line (ID: ${attrLineId})`);

    // Set price extras for each value
    const singleShot = shotsValues.find((v: any) => v.name === 'Single Shot');
    const doubleShot = shotsValues.find((v: any) => v.name === 'Double Shot');
    const tripleShot = shotsValues.find((v: any) => v.name === 'Triple Shot');

    const ptavData = [];
    
    if (singleShot) {
      ptavData.push({
        attribute_line_id: attrLineId,
        product_tmpl_id: espresso[0].id,
        attribute_id: shotsAttr[0].id,
        product_attribute_value_id: singleShot.id,
        price_extra: 0
      });
    }

    if (doubleShot) {
      ptavData.push({
        attribute_line_id: attrLineId,
        product_tmpl_id: espresso[0].id,
        attribute_id: shotsAttr[0].id,
        product_attribute_value_id: doubleShot.id,
        price_extra: 10
      });
    }

    if (tripleShot) {
      ptavData.push({
        attribute_line_id: attrLineId,
        product_tmpl_id: espresso[0].id,
        attribute_id: shotsAttr[0].id,
        product_attribute_value_id: tripleShot.id,
        price_extra: 20
      });
    }

    for (const data of ptavData) {
      await odoo.rpc('product.template.attribute.value', 'create', [data]);
    }

    console.log('✅ Set pricing:');
    console.log(`   Single Shot: ${espresso[0].list_price} EGP (base + 0)`);
    console.log(`   Double Shot: ${espresso[0].list_price + 10} EGP (base + 10)`);
    console.log(`   Triple Shot: ${espresso[0].list_price + 20} EGP (base + 20)`);
  }

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║           ESPRESSO FIX COMPLETE                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n✅ Summary:');
  console.log('   - Espresso Double archived');
  console.log('   - Espresso configured with Shots attribute');
  console.log('   - Pricing: Single (base), Double (+10), Triple (+20)\n');
}

fixEspressoProducts().catch(console.error);

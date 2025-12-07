import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient.js';
dotenv.config();

async function addChocolateOptionToMocha() {
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  config.timeoutMs = 60000;
  const odoo = new OdooClient(config);

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║      ADDING CHOCOLATE OPTIONS TO MOCHA                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Step 1: Create or find Chocolate Type attribute
  console.log('📊 STEP 1: Creating Chocolate Type Attribute');
  console.log('='.repeat(60));

  let chocolateAttr = await odoo.searchRead('product.attribute', [
    ['name', '=', 'Chocolate Type']
  ], ['id']);

  let chocolateAttrId: number;

  if (chocolateAttr.length === 0) {
    // Create new attribute
    chocolateAttrId = await odoo.rpc<number>('product.attribute', 'create', [{
      name: 'Chocolate Type',
      display_type: 'radio',
      create_variant: 'no_variant'
    }]);
    console.log(`✅ Created Chocolate Type attribute (ID: ${chocolateAttrId})`);

    // Create values: Dark Chocolate, White Chocolate
    await odoo.rpc('product.attribute.value', 'create', [{
      name: 'Dark Chocolate',
      attribute_id: chocolateAttrId
    }]);
    console.log(`✅ Created value: Dark Chocolate`);

    await odoo.rpc('product.attribute.value', 'create', [{
      name: 'White Chocolate',
      attribute_id: chocolateAttrId
    }]);
    console.log(`✅ Created value: White Chocolate`);

  } else {
    chocolateAttrId = chocolateAttr[0].id;
    console.log(`⏭️  Chocolate Type attribute exists (ID: ${chocolateAttrId})`);
  }

  // Step 2: Find Mocha product
  console.log('\n📊 STEP 2: Finding Mocha Product');
  console.log('='.repeat(60));

  const mocha = await odoo.searchRead('product.template', [
    ['name', '=', 'Mocha'],
    ['active', '=', true]
  ], ['id', 'name', 'list_price']);

  if (mocha.length === 0) {
    console.log('❌ Mocha product not found');
    return;
  }

  console.log(`Found: ${mocha[0].name} (ID: ${mocha[0].id}, Price: ${mocha[0].list_price} EGP)`);

  // Step 3: Check if Mocha already has Chocolate Type
  console.log('\n📊 STEP 3: Applying Chocolate Type to Mocha');
  console.log('='.repeat(60));

  const existingAttrLine = await odoo.searchRead('product.template.attribute.line', [
    ['product_tmpl_id', '=', mocha[0].id],
    ['attribute_id', '=', chocolateAttrId]
  ], ['id']);

  if (existingAttrLine.length > 0) {
    console.log('⚠️  Mocha already has Chocolate Type attribute');
  } else {
    // Get chocolate values
    const chocolateValues = await odoo.searchRead('product.attribute.value', [
      ['attribute_id', '=', chocolateAttrId]
    ], ['id', 'name']);

    console.log(`Found ${chocolateValues.length} chocolate types`);

    // Create attribute line
    const attrLineId = await odoo.rpc<number>('product.template.attribute.line', 'create', [{
      product_tmpl_id: mocha[0].id,
      attribute_id: chocolateAttrId,
      value_ids: [[6, 0, chocolateValues.map((v: any) => v.id)]]
    }]);

    console.log(`✅ Created attribute line (ID: ${attrLineId})`);

    // Set pricing (no extra cost for chocolate type selection)
    for (const value of chocolateValues) {
      await odoo.rpc('product.template.attribute.value', 'create', [{
        attribute_line_id: attrLineId,
        product_tmpl_id: mocha[0].id,
        attribute_id: chocolateAttrId,
        product_attribute_value_id: value.id,
        price_extra: 0
      }]);
      console.log(`  ✅ Added ${value.name} (no extra cost)`);
    }
  }

  // Step 4: Verify
  console.log('\n📊 STEP 4: Verification');
  console.log('='.repeat(60));

  const finalAttrs = await odoo.searchRead('product.template.attribute.line', [
    ['product_tmpl_id', '=', mocha[0].id]
  ], ['id', 'attribute_id']);

  console.log(`\nMocha now has ${finalAttrs.length} attribute(s):`);
  for (const line of finalAttrs) {
    const attrName = Array.isArray(line.attribute_id) ? line.attribute_id[1] : 'Unknown';
    console.log(`  ✓ ${attrName}`);
  }

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║              CHOCOLATE OPTIONS ADDED                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n✅ Mocha now has Dark/White Chocolate options\n');
}

addChocolateOptionToMocha().catch(console.error);

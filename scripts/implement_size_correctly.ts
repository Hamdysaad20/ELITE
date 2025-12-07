import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient.js';
dotenv.config();

async function implementSizeAttributesCorrectly() {
  const config = getOdooConfigFromEnv();
  if (!config) {
    throw new Error('Odoo configuration not found in environment variables');
  }
  const odoo = new OdooClient(config);

  console.log('🔧 Implementing Size Attributes (Correct Approach)\n');
  console.log('═'.repeat(60));
  console.log('Pricing: Small (base), Medium (+10 EGP), Large (+20 EGP)\n');

  // Step 1: Check/Create Size attribute
  console.log('📋 Step 1: Setting up Size Attribute...\n');

  let sizeAttributeId: number;
  
  const existingAttr = await odoo.searchRead('product.attribute', [
    ['name', '=', 'Size'],
  ], ['id', 'name', 'create_variant']);

  if (existingAttr.length > 0) {
    sizeAttributeId = existingAttr[0].id;
    console.log(`✓ Size attribute exists (ID: ${sizeAttributeId})`);
    
    // Update to ensure it doesn't create variants
    await odoo.rpc('product.attribute', 'write', [[sizeAttributeId], {
      create_variant: 'no_variant',
      display_type: 'radio',
    }]);
    console.log(`✓ Updated to no_variant with radio display`);
  } else {
    sizeAttributeId = await odoo.rpc('product.attribute', 'create', [{
      name: 'Size',
      display_type: 'radio',
      create_variant: 'no_variant',
    }]);
    console.log(`✓ Created Size attribute (ID: ${sizeAttributeId})`);
  }

  // Step 2: Ensure size values exist
  console.log('\n📋 Step 2: Setting up Size Values...\n');

  const sizeConfigs = [
    { name: 'Small', sequence: 1 },
    { name: 'Medium', sequence: 2 },
    { name: 'Large', sequence: 3 },
  ];

  const sizeValueIds: Record<string, number> = {};

  for (const sizeConfig of sizeConfigs) {
    const existing = await odoo.searchRead('product.attribute.value', [
      ['attribute_id', '=', sizeAttributeId],
      ['name', '=', sizeConfig.name],
    ], ['id', 'name']);

    if (existing.length > 0) {
      sizeValueIds[sizeConfig.name] = existing[0].id;
      console.log(`✓ ${sizeConfig.name} exists (ID: ${existing[0].id})`);
    } else {
      const valueId = await odoo.rpc('product.attribute.value', 'create', [{
        name: sizeConfig.name,
        attribute_id: sizeAttributeId,
        sequence: sizeConfig.sequence,
      }]);
      sizeValueIds[sizeConfig.name] = valueId;
      console.log(`✓ Created ${sizeConfig.name} (ID: ${valueId})`);
    }
  }

  // Step 3: Get all drink products
  console.log('\n📋 Step 3: Finding drink products...\n');

  const drinkCategories = await odoo.searchRead('product.category', [
    '|', '|', ['name', '=', 'Coffee'], 
    ['name', '=', 'Iced'], 
    ['name', '=', 'Tea'],
  ], ['id', 'name']);

  const categoryIds = drinkCategories.map((c: any) => c.id);

  const products = await odoo.searchRead('product.template', [
    ['categ_id', 'in', categoryIds],
    ['active', '=', true],
  ], ['id', 'name', 'list_price', 'categ_id']);

  // Filter to actual drinks (exclude extras, services, etc.)
  const drinkPatterns = [
    'americano', 'latte', 'cappuccino', 'mocha', 'espresso',
    'spanish latte', 'chai', 'chocolate', 'matcha', 'flat white',
    'cortado', 'turkish', 'iced', 'boba', 'macchiato', 'icee'
  ];

  const drinks = products.filter((p: any) => {
    const name = p.name.toLowerCase();
    const isService = /settle|invoice|chai flavour|ice flavor|hibiscus/i.test(p.name);
    const isDrink = drinkPatterns.some(pattern => name.includes(pattern));
    return isDrink && !isService;
  });

  console.log(`Found ${drinks.length} drink products:\n`);

  // Step 4: Add size attribute to each drink
  console.log('📋 Step 4: Adding size attributes to drinks...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const product of drinks) {
    try {
      // Check if product already has size attribute
      const existingLines = await odoo.searchRead('product.template.attribute.line', [
        ['product_tmpl_id', '=', product.id],
        ['attribute_id', '=', sizeAttributeId],
      ], ['id']);

      if (existingLines.length > 0) {
        console.log(`⚠️  ${product.name} - Already has size attribute, skipping`);
        continue;
      }

      // Create attribute line with price extras
      // Small: 0 (base price), Medium: +10, Large: +20
      const attributeLineId = await odoo.rpc('product.template.attribute.line', 'create', [{
        product_tmpl_id: product.id,
        attribute_id: sizeAttributeId,
        value_ids: [[6, 0, Object.values(sizeValueIds)]],
      }]);

      // Now set price extras for each value
      const ptavs = await odoo.searchRead('product.template.attribute.value', [
        ['product_tmpl_id', '=', product.id],
        ['attribute_id', '=', sizeAttributeId],
      ], ['id', 'name', 'product_attribute_value_id']);

      for (const ptav of ptavs) {
        const valueName = Array.isArray(ptav.product_attribute_value_id) 
          ? ptav.product_attribute_value_id[1] 
          : ptav.name;
        
        let priceExtra = 0;
        if (valueName.includes('Small')) {
          priceExtra = 0; // Base price
        } else if (valueName.includes('Medium')) {
          priceExtra = 10;
        } else if (valueName.includes('Large')) {
          priceExtra = 20;
        }

        await odoo.rpc('product.template.attribute.value', 'write', [[ptav.id], {
          price_extra: priceExtra,
        }]);
      }

      console.log(`✅ ${product.name} - Added sizes (S: base, M: +10, L: +20)`);
      successCount++;

      await new Promise(resolve => setTimeout(resolve, 300));

    } catch (error: any) {
      console.log(`❌ ${product.name} - Error: ${error.message}`);
      errorCount++;
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('📊 IMPLEMENTATION SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Size Attribute: Created/Updated (ID: ${sizeAttributeId})`);
  console.log(`Variant Creation: Disabled (no_variant)`);
  console.log(`Display Type: Radio Buttons`);
  console.log(`Size Values: ${Object.keys(sizeValueIds).length} (Small, Medium, Large)`);
  console.log(`Products Updated: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Total Drinks: ${drinks.length}`);
  console.log('\nPricing:');
  console.log('  Small:  Base Price + 0 EGP');
  console.log('  Medium: Base Price + 10 EGP');
  console.log('  Large:  Base Price + 20 EGP');

  console.log('\n✅ Size attribute implementation complete!');
  console.log('\n💡 In POS:');
  console.log('   - Click on a drink product');
  console.log('   - Radio buttons for S/M/L will appear');
  console.log('   - Price updates automatically based on selection');
  console.log('   - No separate products created');
}

implementSizeAttributesCorrectly().catch(console.error);

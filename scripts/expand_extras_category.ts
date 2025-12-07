import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient.js';
dotenv.config();

interface AttributeConfig {
  name: string;
  display_type: 'radio' | 'multi';
  create_variant: string;
  values: { name: string; pricing?: number }[];
}

async function expandExtrasCategory() {
  console.log('🚀 Starting Extras Category Expansion...\n');

  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  config.timeoutMs = 120000;
  const odoo = new OdooClient(config);

  // Get Extras category ID
  const extrasCategories = await odoo.searchRead('product.category', [['name', '=', 'Extras']], ['id', 'name']);
  if (extrasCategories.length === 0) {
    console.error('❌ Extras category not found');
    return;
  }
  const extrasCategoryId = extrasCategories[0].id;
  console.log(`✅ Found Extras category (ID: ${extrasCategoryId})\n`);

  // Step 1: Update existing product pricing
  console.log('📝 Step 1: Updating existing product pricing...');
  
  const kinderProducts = await odoo.searchRead('product.template', 
    [['name', 'ilike', 'KINDER STEAK Single']], 
    ['id', 'name', 'list_price']
  );
  
  const extraShotProducts = await odoo.searchRead('product.template',
    [['name', '=', 'Extra Shot']],
    ['id', 'name', 'list_price']
  );
  
  const extraFlavorProducts = await odoo.searchRead('product.template',
    [['name', '=', 'EXTRA Flavor']],
    ['id', 'name', 'list_price']
  );

  if (kinderProducts.length > 0) {
    await odoo.rpc('product.template', 'write', [[kinderProducts[0].id], { list_price: 15 }]);
    console.log(`  ✓ Updated KINDER STEAK Single: 15 EGP`);
  }

  if (extraShotProducts.length > 0) {
    await odoo.rpc('product.template', 'write', [[extraShotProducts[0].id], { list_price: 25 }]);
    console.log(`  ✓ Updated Extra Shot: 25 EGP`);
  }

  if (extraFlavorProducts.length > 0) {
    await odoo.rpc('product.template', 'write', [[extraFlavorProducts[0].id], { list_price: 15 }]);
    console.log(`  ✓ Updated EXTRA Flavor: 15 EGP`);
  }

  // Step 2: Create new attributes for extras customization
  console.log('\n📝 Step 2: Creating customization attributes...');

  const attributesToCreate: AttributeConfig[] = [
    {
      name: 'KINDER Quantity',
      display_type: 'radio',
      create_variant: 'no_variant',
      values: [
        { name: 'Single (1 piece)', pricing: 0 },
        { name: 'Double (2 pieces)', pricing: 10 },
      ]
    },
    {
      name: 'BOBA Amount',
      display_type: 'radio',
      create_variant: 'no_variant',
      values: [
        { name: 'Regular', pricing: 0 },
        { name: 'Extra', pricing: 10 },
      ]
    },
    {
      name: 'BOBA Sugar Level',
      display_type: 'radio',
      create_variant: 'no_variant',
      values: [
        { name: 'No Sugar', pricing: 0 },
        { name: 'Low Sugar (25%)', pricing: 0 },
        { name: 'Medium Sugar (50%)', pricing: 0 },
        { name: 'Full Sugar (100%)', pricing: 0 },
      ]
    },
    {
      name: 'Whipped Cream Amount',
      display_type: 'radio',
      create_variant: 'no_variant',
      values: [
        { name: 'Light', pricing: 0 },
        { name: 'Regular', pricing: 0 },
        { name: 'Extra', pricing: 5 },
      ]
    },
    {
      name: 'Shot Type',
      display_type: 'radio',
      create_variant: 'no_variant',
      values: [
        { name: 'Regular Espresso', pricing: 0 },
        { name: 'Decaf Espresso', pricing: 5 },
        { name: 'Blonde Espresso', pricing: 5 },
      ]
    },
    {
      name: 'Flavor Type',
      display_type: 'radio',
      create_variant: 'no_variant',
      values: [
        { name: 'Vanilla', pricing: 0 },
        { name: 'Caramel', pricing: 0 },
        { name: 'Hazelnut', pricing: 0 },
        { name: 'Chocolate', pricing: 0 },
        { name: 'Coconut', pricing: 0 },
        { name: 'Peppermint', pricing: 0 },
        { name: 'Cinnamon', pricing: 0 },
      ]
    },
    {
      name: 'Ice Cream Scoop Flavor',
      display_type: 'radio',
      create_variant: 'no_variant',
      values: [
        { name: 'Vanilla', pricing: 0 },
        { name: 'Chocolate', pricing: 0 },
        { name: 'Strawberry', pricing: 0 },
        { name: 'Caramel', pricing: 0 },
      ]
    },
    {
      name: 'Honey Type',
      display_type: 'radio',
      create_variant: 'no_variant',
      values: [
        { name: 'Regular Honey', pricing: 0 },
        { name: 'Organic Honey', pricing: 5 },
      ]
    },
  ];

  const createdAttributes: Record<string, number> = {};

  for (const attrConfig of attributesToCreate) {
    // Check if attribute exists
    const existingAttrs = await odoo.searchRead('product.attribute',
      [['name', '=', attrConfig.name]],
      ['id']
    );

    let attrId: number;

    if (existingAttrs.length > 0) {
      attrId = existingAttrs[0].id;
      console.log(`  ℹ️  Attribute '${attrConfig.name}' already exists (ID: ${attrId})`);
    } else {
      attrId = await odoo.rpc('product.attribute', 'create', [{
        name: attrConfig.name,
        display_type: attrConfig.display_type,
        create_variant: attrConfig.create_variant,
      }]);
      console.log(`  ✓ Created attribute: ${attrConfig.name} (ID: ${attrId})`);
    }

    createdAttributes[attrConfig.name] = attrId;

    // Create attribute values
    for (const value of attrConfig.values) {
      const existingValues = await odoo.searchRead('product.attribute.value',
        [['attribute_id', '=', attrId], ['name', '=', value.name]],
        ['id']
      );

      if (existingValues.length === 0) {
        await odoo.rpc('product.attribute.value', 'create', [{
          attribute_id: attrId,
          name: value.name,
        }]);
        console.log(`    ✓ Created value: ${value.name}`);
      }
    }
  }

  // Step 3: Apply attributes to specific extras
  console.log('\n📝 Step 3: Applying attributes to extras...');

  const attributeApplications = [
    {
      productName: 'KINDER STEAK Single',
      attributeName: 'KINDER Quantity',
      valuePricing: {
        'Single (1 piece)': 0,
        'Double (2 pieces)': 10,
      }
    },
    {
      productName: 'EXTRA BOBA',
      attributeName: 'BOBA Amount',
      valuePricing: {
        'Regular': 0,
        'Extra': 10,
      }
    },
    {
      productName: 'EXTRA BOBA',
      attributeName: 'BOBA Sugar Level',
      valuePricing: {
        'No Sugar': 0,
        'Low Sugar (25%)': 0,
        'Medium Sugar (50%)': 0,
        'Full Sugar (100%)': 0,
      }
    },
    {
      productName: 'Extra Whip Cream',
      attributeName: 'Whipped Cream Amount',
      valuePricing: {
        'Light': 0,
        'Regular': 0,
        'Extra': 5,
      }
    },
    {
      productName: 'Extra Shot',
      attributeName: 'Shot Type',
      valuePricing: {
        'Regular Espresso': 0,
        'Decaf Espresso': 5,
        'Blonde Espresso': 5,
      }
    },
    {
      productName: 'EXTRA Flavor',
      attributeName: 'Flavor Type',
      valuePricing: {
        'Vanilla': 0,
        'Caramel': 0,
        'Hazelnut': 0,
        'Chocolate': 0,
        'Coconut': 0,
        'Peppermint': 0,
        'Cinnamon': 0,
      }
    },
    {
      productName: 'Extra Ice Cream Scoop',
      attributeName: 'Ice Cream Scoop Flavor',
      valuePricing: {
        'Vanilla': 0,
        'Chocolate': 0,
        'Strawberry': 0,
        'Caramel': 0,
      }
    },
    {
      productName: 'Extra Honey',
      attributeName: 'Honey Type',
      valuePricing: {
        'Regular Honey': 0,
        'Organic Honey': 5,
      }
    },
  ];

  for (const app of attributeApplications) {
    const products = await odoo.searchRead('product.template',
      [['name', '=', app.productName]],
      ['id', 'name']
    );

    if (products.length === 0) {
      console.log(`  ⚠️  Product '${app.productName}' not found, skipping...`);
      continue;
    }

    const productId = products[0].id;
    const attrId = createdAttributes[app.attributeName];

    if (!attrId) {
      console.log(`  ⚠️  Attribute '${app.attributeName}' not found, skipping...`);
      continue;
    }

    // Check if attribute line already exists
    const existingLines = await odoo.searchRead('product.template.attribute.line',
      [['product_tmpl_id', '=', productId], ['attribute_id', '=', attrId]],
      ['id']
    );

    let lineId: number;

    if (existingLines.length > 0) {
      lineId = existingLines[0].id;
      console.log(`  ℹ️  Attribute line already exists for '${app.productName}' - '${app.attributeName}'`);
    } else {
      // Get all attribute values
      const attrValues = await odoo.searchRead('product.attribute.value',
        [['attribute_id', '=', attrId]],
        ['id', 'name']
      );

      const valueIds = attrValues.map((v: any) => v.id);

      lineId = await odoo.rpc('product.template.attribute.line', 'create', [{
        product_tmpl_id: productId,
        attribute_id: attrId,
        value_ids: [[6, 0, valueIds]],
      }]);
      console.log(`  ✓ Applied '${app.attributeName}' to '${app.productName}'`);
    }

    // Set pricing for each value
    for (const [valueName, price] of Object.entries(app.valuePricing)) {
      const attrValues = await odoo.searchRead('product.attribute.value',
        [['attribute_id', '=', attrId], ['name', '=', valueName]],
        ['id']
      );

      if (attrValues.length === 0) continue;

      const valueId = attrValues[0].id;

      const ptavs = await odoo.searchRead('product.template.attribute.value',
        [['product_tmpl_id', '=', productId], ['product_attribute_value_id', '=', valueId]],
        ['id', 'price_extra']
      );

      if (ptavs.length > 0) {
        await odoo.rpc('product.template.attribute.value', 'write', [[ptavs[0].id], {
          price_extra: price,
        }]);
        console.log(`    ✓ Set pricing: ${valueName} = +${price} EGP`);
      }
    }
  }

  // Step 4: Create additional standalone extras
  console.log('\n📝 Step 4: Creating new standalone extras...');

  const newExtras = [
    { name: 'Extra Cinnamon Powder', price: 10 },
    { name: 'Extra Cocoa Powder', price: 10 },
    { name: 'Extra Matcha Powder', price: 15 },
    { name: 'Extra Caramel Drizzle', price: 10 },
    { name: 'Extra Chocolate Drizzle', price: 10 },
    { name: 'Extra Cookie Crumble', price: 15 },
    { name: 'Extra Oreo Crumble', price: 15 },
    { name: 'Extra Nuts (Mixed)', price: 15 },
    { name: 'Extra Almond Flakes', price: 12 },
    { name: 'Extra Coconut Flakes', price: 12 },
    { name: 'Extra Chia Seeds', price: 10 },
    { name: 'Extra Protein Powder', price: 20 },
    { name: 'Extra Collagen Powder', price: 25 },
    { name: 'Extra Espresso Shot (for non-coffee)', price: 20 },
    { name: 'Extra Mint Leaves', price: 5 },
    { name: 'Extra Lemon Slice', price: 5 },
    { name: 'Extra Fresh Fruit', price: 15 },
    { name: 'Extra Strawberry Puree', price: 12 },
    { name: 'Extra Mango Puree', price: 12 },
    { name: 'Extra Energy Boost', price: 20 },
  ];

  for (const extra of newExtras) {
    const existing = await odoo.searchRead('product.template',
      [['name', '=', extra.name]],
      ['id']
    );

    if (existing.length > 0) {
      console.log(`  ℹ️  '${extra.name}' already exists, skipping...`);
      continue;
    }

    const productId = await odoo.rpc('product.template', 'create', [{
      name: extra.name,
      list_price: extra.price,
      categ_id: extrasCategoryId,
      type: 'consu',
      sale_ok: true,
      purchase_ok: false,
    }]);

    console.log(`  ✓ Created: ${extra.name} (${extra.price} EGP)`);
  }

  console.log('\n✅ Extras category expansion complete!');
  console.log('\n📊 Summary:');
  console.log('  - Updated pricing for KINDER, Extra Shot, EXTRA Flavor');
  console.log('  - Created 8 customization attributes');
  console.log('  - Applied attributes to 8 existing extras');
  console.log('  - Created 20 new standalone extras');
  console.log('\n🎯 Users now have full customization options from Extras category!');
}

expandExtrasCategory().catch(console.error);

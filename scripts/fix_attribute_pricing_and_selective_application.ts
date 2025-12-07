import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient.js';
dotenv.config();

async function fixAttributePricingAndApplication() {
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  config.timeoutMs = 60000;
  const odoo = new OdooClient(config);

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║      FIXING ATTRIBUTE PRICING & SELECTIVE APPLICATION      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // STEP 1: Update pricing for all attribute values
  console.log('📊 STEP 1: Updating Attribute Pricing');
  console.log('='.repeat(60));

  const pricingUpdates = [
    // Milk Options - 25 EGP for Oat, others 10 EGP
    { attrName: 'Milk Options', valueName: 'Oat Milk', newPrice: 25 },
    { attrName: 'Milk Options', valueName: 'Almond Milk', newPrice: 10 },
    { attrName: 'Milk Options', valueName: 'Soy Milk', newPrice: 10 },
    { attrName: 'Milk Options', valueName: 'Lactose-Free Milk', newPrice: 10 },
    
    // Extras - minimum 10 EGP
    { attrName: 'Extras', valueName: 'Whipped Cream', newPrice: 10 },
    { attrName: 'Extras', valueName: 'Caramel Drizzle', newPrice: 10 },
    { attrName: 'Extras', valueName: 'Chocolate Sauce', newPrice: 10 },
    { attrName: 'Extras', valueName: 'Vanilla Syrup', newPrice: 10 },
    { attrName: 'Extras', valueName: 'Hazelnut Syrup', newPrice: 10 },
    
    // Toppings - minimum 10 EGP
    { attrName: 'Toppings', valueName: 'Whipped Cream', newPrice: 10 },
    { attrName: 'Toppings', valueName: 'BOBA Pearls', newPrice: 15 },
    { attrName: 'Toppings', valueName: 'Chocolate Chips', newPrice: 10 },
    { attrName: 'Toppings', valueName: 'Caramel Drizzle', newPrice: 10 },
    { attrName: 'Toppings', valueName: 'Oreo Crumble', newPrice: 10 },
    { attrName: 'Toppings', valueName: 'Sprinkles', newPrice: 10 },
    
    // Tea Extras - minimum 10 EGP
    { attrName: 'Tea Extras', valueName: 'Honey', newPrice: 10 },
    { attrName: 'Tea Extras', valueName: 'Lemon', newPrice: 10 },
    { attrName: 'Tea Extras', valueName: 'Mint', newPrice: 10 },
    { attrName: 'Tea Extras', valueName: 'Ginger', newPrice: 10 },
  ];

  for (const update of pricingUpdates) {
    try {
      // Find attribute
      const attr = await odoo.searchRead('product.attribute', [
        ['name', '=', update.attrName]
      ], ['id']);

      if (attr.length === 0) {
        console.log(`⚠️  Attribute not found: ${update.attrName}`);
        continue;
      }

      // Find attribute value
      const attrValue = await odoo.searchRead('product.attribute.value', [
        ['attribute_id', '=', attr[0].id],
        ['name', '=', update.valueName]
      ], ['id']);

      if (attrValue.length === 0) {
        console.log(`⚠️  Value not found: ${update.valueName} in ${update.attrName}`);
        continue;
      }

      // Update all product template attribute values with this value
      const ptavs = await odoo.searchRead('product.template.attribute.value', [
        ['product_attribute_value_id', '=', attrValue[0].id]
      ], ['id', 'price_extra']);

      for (const ptav of ptavs) {
        await odoo.rpc('product.template.attribute.value', 'write', [
          [ptav.id],
          { price_extra: update.newPrice }
        ]);
      }

      console.log(`✅ Updated ${update.attrName} - ${update.valueName}: ${update.newPrice} EGP (${ptavs.length} products)`);

    } catch (error: any) {
      console.error(`❌ Error updating ${update.attrName} - ${update.valueName}: ${error.message}`);
    }
  }

  // STEP 2: Add Marshmallow attribute for hot drinks
  console.log('\n\n📊 STEP 2: Adding Marshmallow Option for Hot Drinks');
  console.log('='.repeat(60));

  // Check if Marshmallow attribute exists
  let marshmallowAttr = await odoo.searchRead('product.attribute', [
    ['name', '=', 'Marshmallow']
  ], ['id']);

  let marshmallowAttrId: number;

  if (marshmallowAttr.length === 0) {
    // Create new attribute
    marshmallowAttrId = await odoo.rpc<number>('product.attribute', 'create', [{
      name: 'Marshmallow',
      display_type: 'multi',
      create_variant: 'no_variant'
    }]);
    console.log(`✅ Created Marshmallow attribute (ID: ${marshmallowAttrId})`);

    // Create value
    await odoo.rpc('product.attribute.value', 'create', [{
      name: 'Add Marshmallow',
      attribute_id: marshmallowAttrId
    }]);
    console.log(`✅ Created Marshmallow value`);
  } else {
    marshmallowAttrId = marshmallowAttr[0].id;
    console.log(`⏭️  Marshmallow attribute exists (ID: ${marshmallowAttrId})`);
  }

  // Apply to hot drinks: Latte, Cappuccino, Mocha, Spanish Latte (Hot), Chocolate (Hot)
  const hotDrinksForMarshmallow = [
    'Latte',
    'Cappuccino', 
    'Mocha',
    'Spanish Latte (Hot)',
    'Chocolate (Hot)',
    'Chai Latte (Hot)',
    'Matcha Latte (Hot)'
  ];

  const marshmallowValue = await odoo.searchRead('product.attribute.value', [
    ['attribute_id', '=', marshmallowAttrId]
  ], ['id', 'name']);

  for (const drinkName of hotDrinksForMarshmallow) {
    try {
      const product = await odoo.searchRead('product.template', [
        ['name', '=', drinkName],
        ['active', '=', true]
      ], ['id', 'name']);

      if (product.length === 0) {
        console.log(`⚠️  Product not found: ${drinkName}`);
        continue;
      }

      // Check if already has marshmallow
      const existing = await odoo.searchRead('product.template.attribute.line', [
        ['product_tmpl_id', '=', product[0].id],
        ['attribute_id', '=', marshmallowAttrId]
      ], ['id']);

      if (existing.length > 0) {
        console.log(`⏭️  ${drinkName} already has Marshmallow`);
        continue;
      }

      // Add marshmallow attribute
      const attrLineId = await odoo.rpc<number>('product.template.attribute.line', 'create', [{
        product_tmpl_id: product[0].id,
        attribute_id: marshmallowAttrId,
        value_ids: [[6, 0, marshmallowValue.map((v: any) => v.id)]]
      }]);

      // Set pricing (10 EGP)
      for (const value of marshmallowValue) {
        await odoo.rpc('product.template.attribute.value', 'create', [{
          attribute_line_id: attrLineId,
          product_tmpl_id: product[0].id,
          attribute_id: marshmallowAttrId,
          product_attribute_value_id: value.id,
          price_extra: 10
        }]);
      }

      console.log(`✅ Added Marshmallow to ${drinkName} (+10 EGP)`);

    } catch (error: any) {
      console.error(`❌ Error adding Marshmallow to ${drinkName}: ${error.message}`);
    }
  }

  // STEP 3: Remove inappropriate attributes from products
  console.log('\n\n📊 STEP 3: Removing Inappropriate Attributes');
  console.log('='.repeat(60));

  const inappropriateAssignments = [
    // Turkish coffee should NOT have espresso shots
    { productName: 'Turkish Coffee Single', attrName: 'Shots' },
    { productName: 'Turkish Coffee Double', attrName: 'Shots' },
    { productName: 'Turkish Coffee Single', attrName: 'Espresso Shots' },
    { productName: 'Turkish Coffee Double', attrName: 'Espresso Shots' },
    
    // Service/Settlement items should not have drink attributes
    { productName: 'Settle Due', attrName: 'Milk Options' },
    { productName: 'Settle Due', attrName: 'Size' },
    { productName: 'Settle Invoice', attrName: 'Milk Options' },
    { productName: 'Settle Invoice', attrName: 'Size' },
    
    // Ice Flavors is an add-on, not a drink
    { productName: 'Ice Flavors', attrName: 'Milk Options' },
    { productName: 'Ice Flavors', attrName: 'Size' },
    { productName: 'Ice Flavors', attrName: 'Ice Level' },
  ];

  for (const removal of inappropriateAssignments) {
    try {
      // Find product
      const product = await odoo.searchRead('product.template', [
        ['name', '=', removal.productName]
      ], ['id']);

      if (product.length === 0) continue;

      // Find attribute
      const attr = await odoo.searchRead('product.attribute', [
        ['name', '=', removal.attrName]
      ], ['id']);

      if (attr.length === 0) continue;

      // Find and remove attribute line
      const attrLine = await odoo.searchRead('product.template.attribute.line', [
        ['product_tmpl_id', '=', product[0].id],
        ['attribute_id', '=', attr[0].id]
      ], ['id']);

      if (attrLine.length > 0) {
        await odoo.rpc('product.template.attribute.line', 'unlink', [attrLine.map((l: any) => l.id)]);
        console.log(`✅ Removed ${removal.attrName} from ${removal.productName}`);
      }

    } catch (error: any) {
      console.error(`❌ Error removing ${removal.attrName} from ${removal.productName}: ${error.message}`);
    }
  }

  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                  FIXES COMPLETE                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n✅ Summary:');
  console.log('   - Updated pricing: Oat Milk (25 EGP), others (10+ EGP)');
  console.log('   - Added Marshmallow option to hot drinks (+10 EGP)');
  console.log('   - Removed inappropriate attribute assignments');
  console.log('\n');
}

fixAttributePricingAndApplication().catch(console.error);

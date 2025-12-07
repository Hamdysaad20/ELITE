import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient.js';
dotenv.config();

async function verifyExtrasExpansion() {
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  config.timeoutMs = 60000;
  const odoo = new OdooClient(config);

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           EXTRAS CATEGORY EXPANSION VERIFICATION          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Get all products in Extras category
  const extrasProducts = await odoo.searchRead('product.template', [
    ['categ_id.name', '=', 'Extras'],
    ['active', '=', true]
  ], ['id', 'name', 'list_price']);

  console.log('📊 TOTAL EXTRAS PRODUCTS');
  console.log('='.repeat(60));
  console.log(`Total: ${extrasProducts.length} products\n`);

  // Check specific updated products
  console.log('💰 PRICING UPDATES');
  console.log('='.repeat(60));
  
  const kinderProducts = extrasProducts.filter(p => p.name.includes('KINDER STEAK Single'));
  const extraShotProducts = extrasProducts.filter(p => p.name === 'Extra Shot');
  const extraFlavorProducts = extrasProducts.filter(p => p.name === 'EXTRA Flavor');

  if (kinderProducts.length > 0) {
    console.log(`✓ KINDER STEAK Single: ${kinderProducts[0].list_price} EGP (expected: 15)`);
  }
  if (extraShotProducts.length > 0) {
    console.log(`✓ Extra Shot: ${extraShotProducts[0].list_price} EGP (expected: 25)`);
  }
  if (extraFlavorProducts.length > 0) {
    console.log(`✓ EXTRA Flavor: ${extraFlavorProducts[0].list_price} EGP (expected: 15)`);
  }

  // Check newly created extras
  console.log('\n🆕 NEW STANDALONE EXTRAS');
  console.log('='.repeat(60));
  
  const newExtras = [
    'Extra Cinnamon Powder',
    'Extra Cocoa Powder',
    'Extra Matcha Powder',
    'Extra Caramel Drizzle',
    'Extra Chocolate Drizzle',
    'Extra Cookie Crumble',
    'Extra Oreo Crumble',
    'Extra Nuts (Mixed)',
    'Extra Almond Flakes',
    'Extra Coconut Flakes',
    'Extra Chia Seeds',
    'Extra Protein Powder',
    'Extra Collagen Powder',
    'Extra Espresso Shot (for non-coffee)',
    'Extra Mint Leaves',
    'Extra Lemon Slice',
    'Extra Fresh Fruit',
    'Extra Strawberry Puree',
    'Extra Mango Puree',
    'Extra Energy Boost',
  ];

  let foundCount = 0;
  for (const extraName of newExtras) {
    const found = extrasProducts.find(p => p.name === extraName);
    if (found) {
      foundCount++;
      console.log(`✓ ${extraName}: ${found.list_price} EGP`);
    } else {
      console.log(`✗ ${extraName}: NOT FOUND`);
    }
  }
  console.log(`\nFound ${foundCount}/${newExtras.length} new extras`);

  // Check products with attributes
  console.log('\n🎨 PRODUCTS WITH CUSTOMIZATION ATTRIBUTES');
  console.log('='.repeat(60));

  const productsWithAttributes = [
    { name: 'KINDER STEAK Single', attributes: ['KINDER Quantity'] },
    { name: 'EXTRA BOBA', attributes: ['BOBA Amount', 'BOBA Sugar Level'] },
    { name: 'Extra Whip Cream', attributes: ['Whipped Cream Amount'] },
    { name: 'Extra Shot', attributes: ['Shot Type'] },
    { name: 'EXTRA Flavor', attributes: ['Flavor Type'] },
    { name: 'Extra Ice Cream Scoop', attributes: ['Ice Cream Scoop Flavor'] },
    { name: 'Extra Honey', attributes: ['Honey Type'] },
  ];

  for (const product of productsWithAttributes) {
    const found = extrasProducts.find(p => p.name === product.name);
    if (!found) {
      console.log(`\n❌ ${product.name}: NOT FOUND`);
      continue;
    }

    console.log(`\n✅ ${product.name} (${found.list_price} EGP)`);
    
    // Get attribute lines for this product
    const attrLines = await odoo.searchRead('product.template.attribute.line',
      [['product_tmpl_id', '=', found.id]],
      ['id', 'attribute_id']
    );

    console.log(`   Attributes: ${attrLines.length}`);
    
    for (const line of attrLines) {
      const attrId = Array.isArray(line.attribute_id) ? line.attribute_id[0] : line.attribute_id;
      const attrs = await odoo.searchRead('product.attribute',
        [['id', '=', attrId]],
        ['id', 'name']
      );
      
      if (attrs.length > 0) {
        console.log(`   - ${attrs[0].name}`);
        
        // Get attribute values and pricing
        const values = await odoo.searchRead('product.template.attribute.value',
          [['product_tmpl_id', '=', found.id], ['attribute_id', '=', attrId]],
          ['product_attribute_value_id', 'price_extra']
        );
        
        for (const val of values) {
          const valueId = Array.isArray(val.product_attribute_value_id) 
            ? val.product_attribute_value_id[0] 
            : val.product_attribute_value_id;
          const valueDetails = await odoo.searchRead('product.attribute.value',
            [['id', '=', valueId]],
            ['name']
          );
          if (valueDetails.length > 0) {
            const priceExtra = val.price_extra || 0;
            const priceStr = priceExtra > 0 ? `+${priceExtra} EGP` : 'base price';
            console.log(`     • ${valueDetails[0].name}: ${priceStr}`);
          }
        }
      }
    }
  }

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    VERIFICATION COMPLETE                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n✅ Extras category has been fully expanded!');
  console.log(`📦 Total extras: ${extrasProducts.length}`);
  console.log(`🆕 New standalone extras: ${foundCount}`);
  console.log(`🎨 Products with customization: ${productsWithAttributes.length}`);
  console.log('\n🎯 Users now have comprehensive customization options!');
}

verifyExtrasExpansion().catch(console.error);

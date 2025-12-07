import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient.js';
dotenv.config();

async function verifyPricingUpdates() {
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  config.timeoutMs = 60000;
  const odoo = new OdooClient(config);

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           PRICING VERIFICATION REPORT                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Sample a few products to verify pricing
  const sampleProducts = [
    'Latte',
    'Cappuccino',
    'Americano',
    'Iced Latte',
    'Espresso'
  ];

  for (const productName of sampleProducts) {
    const product = await odoo.searchRead('product.template', [
      ['name', '=', productName],
      ['active', '=', true]
    ], ['id', 'name', 'list_price']);

    if (product.length === 0) continue;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📦 ${product[0].name}`);
    console.log(`Base Price: ${product[0].list_price} EGP`);
    console.log('─'.repeat(60));

    // Get all attributes for this product
    const attrLines = await odoo.searchRead('product.template.attribute.line', [
      ['product_tmpl_id', '=', product[0].id]
    ], ['id', 'attribute_id']);

    for (const line of attrLines) {
      const attrName = Array.isArray(line.attribute_id) ? line.attribute_id[1] : 'Unknown';
      
      // Get pricing for this attribute
      const ptavs = await odoo.searchRead('product.template.attribute.value', [
        ['attribute_line_id', '=', line.id]
      ], ['product_attribute_value_id', 'price_extra']);

      if (ptavs.length > 0) {
        console.log(`\n  ${attrName}:`);
        ptavs.forEach((ptav: any) => {
          const valueName = Array.isArray(ptav.product_attribute_value_id) 
            ? ptav.product_attribute_value_id[1] 
            : 'Unknown';
          const totalPrice = product[0].list_price + ptav.price_extra;
          const extraStr = ptav.price_extra > 0 ? `+${ptav.price_extra}` : ptav.price_extra;
          console.log(`    • ${valueName}: ${totalPrice} EGP (base ${extraStr})`);
        });
      }
    }
  }

  // Check if inappropriate attributes were removed
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         INAPPROPRIATE ATTRIBUTE REMOVAL CHECK              ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const checkProducts = [
    { name: 'Turkish Coffee Single', shouldNotHave: ['Shots', 'Espresso Shots'] },
    { name: 'Turkish Coffee Double', shouldNotHave: ['Shots', 'Espresso Shots'] },
    { name: 'Settle Due', shouldNotHave: ['Milk Options', 'Size'] },
    { name: 'Settle Invoice', shouldNotHave: ['Milk Options', 'Size'] },
    { name: 'Ice Flavors', shouldNotHave: ['Milk Options', 'Size', 'Ice Level'] }
  ];

  for (const check of checkProducts) {
    const product = await odoo.searchRead('product.template', [
      ['name', '=', check.name]
    ], ['id', 'name']);

    if (product.length === 0) continue;

    const attrLines = await odoo.searchRead('product.template.attribute.line', [
      ['product_tmpl_id', '=', product[0].id]
    ], ['id', 'attribute_id']);

    const currentAttrs = attrLines.map((line: any) => 
      Array.isArray(line.attribute_id) ? line.attribute_id[1] : 'Unknown'
    );

    const wrongAttrs = currentAttrs.filter((attr: string) => 
      check.shouldNotHave.includes(attr)
    );

    if (wrongAttrs.length > 0) {
      console.log(`❌ ${check.name}: Still has ${wrongAttrs.join(', ')}`);
    } else {
      console.log(`✅ ${check.name}: Clean (no inappropriate attributes)`);
    }
  }

  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║              VERIFICATION COMPLETE                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
}

verifyPricingUpdates().catch(console.error);

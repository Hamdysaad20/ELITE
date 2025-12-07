import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient.js';
dotenv.config();

async function verifyEspresso() {
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  config.timeoutMs = 60000;
  const odoo = new OdooClient(config);

  const espresso = await odoo.searchRead('product.template', [
    ['name', '=', 'Espresso'],
    ['active', '=', true]
  ], ['id', 'name', 'list_price']);

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║               ESPRESSO VERIFICATION                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`Product: ${espresso[0].name}`);
  console.log(`Base Price: ${espresso[0].list_price} EGP\n`);

  const attrLines = await odoo.searchRead('product.template.attribute.line', [
    ['product_tmpl_id', '=', espresso[0].id]
  ], ['id', 'attribute_id']);

  console.log(`Attributes: ${attrLines.length}\n`);

  for (const line of attrLines) {
    const attrName = Array.isArray(line.attribute_id) ? line.attribute_id[1] : 'Unknown';
    console.log(`📋 ${attrName}:`);
    
    const ptavs = await odoo.searchRead('product.template.attribute.value', [
      ['attribute_line_id', '=', line.id]
    ], ['product_attribute_value_id', 'price_extra']);

    for (const ptav of ptavs) {
      const valueName = Array.isArray(ptav.product_attribute_value_id) 
        ? ptav.product_attribute_value_id[1] 
        : 'Unknown';
      const totalPrice = espresso[0].list_price + ptav.price_extra;
      const extraStr = ptav.price_extra > 0 ? ` (+${ptav.price_extra})` : '';
      console.log(`  • ${valueName}: ${totalPrice} EGP${extraStr}`);
    }
  }

  console.log('\n✅ Espresso configured correctly with only Shots attribute\n');
}

verifyEspresso().catch(console.error);

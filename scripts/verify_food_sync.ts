import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient.js';
dotenv.config();

async function verifyFoodSync() {
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  const odoo = new OdooClient(config);

  console.log('🔍 Verifying Food Items Sync Status...\n');

  // Get Food category
  const foodCategory = await odoo.searchRead('product.category',
    [['name', '=', 'Food']],
    ['id', 'name']
  );

  if (foodCategory.length === 0) {
    console.log('❌ Food category not found in Odoo!');
    return;
  }

  console.log(`✓ Food Category ID: ${foodCategory[0].id}\n`);

  // Get all food products
  const allFood = await odoo.searchRead('product.template',
    [['categ_id', '=', foodCategory[0].id], ['active', '=', true]],
    ['id', 'name', 'list_price', 'available_in_pos', 'sale_ok']
  );

  console.log('📦 FOOD ITEMS IN ODOO:');
  console.log('='.repeat(70));
  
  const sandwiches = allFood.filter(f => 
    f.name.toLowerCase().includes('sandwich') || 
    f.name.toLowerCase().includes('club') ||
    f.name.toLowerCase().includes('wrap') ||
    f.name.toLowerCase().includes('panini') ||
    f.name.toLowerCase().includes('steak')
  );

  const desserts = allFood.filter(f => 
    f.name.toLowerCase().includes('cake') || 
    f.name.toLowerCase().includes('cookie') ||
    f.name.toLowerCase().includes('brownie')
  );

  const other = allFood.filter(f => 
    !sandwiches.includes(f) && !desserts.includes(f)
  );

  console.log(`\n🥪 SANDWICHES (${sandwiches.length}):`);
  sandwiches.forEach(s => {
    const pos = s.available_in_pos ? '✓ POS' : '✗ No POS';
    const sale = s.sale_ok ? '✓ Sale' : '✗ No Sale';
    console.log(`  ${s.name.padEnd(35)} ${s.list_price} EGP  ${pos}  ${sale}`);
  });

  console.log(`\n🍰 DESSERTS (${desserts.length}):`);
  desserts.forEach(d => {
    const pos = d.available_in_pos ? '✓ POS' : '✗ No POS';
    const sale = d.sale_ok ? '✓ Sale' : '✗ No Sale';
    console.log(`  ${d.name.padEnd(35)} ${d.list_price} EGP  ${pos}  ${sale}`);
  });

  if (other.length > 0) {
    console.log(`\n🍔 OTHER (${other.length}):`);
    other.forEach(o => {
      const pos = o.available_in_pos ? '✓ POS' : '✗ No POS';
      const sale = o.sale_ok ? '✓ Sale' : '✗ No Sale';
      console.log(`  ${o.name.padEnd(35)} ${o.list_price} EGP  ${pos}  ${sale}`);
    });
  }

  console.log('\n' + '='.repeat(70));
  console.log(`📊 SUMMARY:`);
  console.log(`  Total Food Items:    ${allFood.length}`);
  console.log(`  Sandwiches:          ${sandwiches.length}`);
  console.log(`  Desserts:            ${desserts.length}`);
  console.log(`  Other:               ${other.length}`);
  console.log(`  Available in POS:    ${allFood.filter(f => f.available_in_pos).length}`);
  console.log(`  Available for Sale:  ${allFood.filter(f => f.sale_ok).length}`);
  console.log('='.repeat(70));

  // Check Custom Sandwich attributes
  const customSandwich = allFood.find(f => f.name === 'Custom Sandwich');
  if (customSandwich) {
    console.log('\n🔧 CUSTOM SANDWICH ATTRIBUTES:');
    const attrs = await odoo.searchRead('product.template.attribute.line',
      [['product_tmpl_id', '=', customSandwich.id]],
      ['attribute_id', 'value_ids']
    );

    for (const attr of attrs) {
      const attrInfo = await odoo.searchRead('product.attribute',
        [['id', '=', attr.attribute_id[0]]],
        ['name', 'display_type']
      );

      const valueCount = Array.isArray(attr.value_ids) ? attr.value_ids.length : 0;
      const displayType = attrInfo[0].display_type === 'multi' ? 'Multi-Select' : 'Single';
      
      console.log(`  ${attrInfo[0].name.padEnd(30)} ${displayType.padEnd(12)} ${valueCount} options`);
    }
  }

  console.log('\n✅ Verification Complete!\n');
}

verifyFoodSync().catch(console.error);

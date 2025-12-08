import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient.js';
dotenv.config();

async function updateMilkshakeWhippedCream() {
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  config.timeoutMs = 180000;
  const odoo = new OdooClient(config);

  console.log('🥤 Updating Milkshake Whipped Cream...\n');

  // Get Milkshake category
  const milkshakeCategory = await odoo.searchRead('product.category',
    [['name', '=', 'Milkshake']],
    ['id']
  );

  if (milkshakeCategory.length === 0) {
    console.log('❌ Milkshake category not found!');
    return;
  }

  const milkshakes = await odoo.searchRead('product.template',
    [['categ_id', '=', milkshakeCategory[0].id], ['active', '=', true]],
    ['id', 'name']
  );

  console.log(`✓ Found ${milkshakes.length} milkshakes\n`);

  // 1. Remove "Whipped Cream Amount" attribute
  console.log('1️⃣  Removing Whipped Cream Amount attribute...');
  console.log('='.repeat(70));

  const whippedAmountAttr = await odoo.searchRead('product.attribute',
    [['name', '=', 'Whipped Cream Amount']],
    ['id']
  );

  if (whippedAmountAttr.length > 0) {
    for (const milkshake of milkshakes) {
      const lines = await odoo.searchRead('product.template.attribute.line',
        [['product_tmpl_id', '=', milkshake.id], ['attribute_id', '=', whippedAmountAttr[0].id]],
        ['id']
      );

      if (lines.length > 0) {
        await odoo.rpc('product.template.attribute.line', 'unlink', [lines.map(l => l.id)]);
        console.log(`  ✓ Removed Whipped Cream Amount from ${milkshake.name}`);
      }
    }
  }

  // 2. Update Premium Toppings to have Whipped Cream at 20 EGP
  console.log('\n2️⃣  Updating Whipped Cream pricing in Premium Toppings...');
  console.log('='.repeat(70));

  const premiumToppingsAttr = await odoo.searchRead('product.attribute',
    [['name', '=', 'Premium Toppings']],
    ['id']
  );

  if (premiumToppingsAttr.length > 0) {
    // Find the "Whipped Cream (+8 EGP)" value and update it
    const whippedCreamValue = await odoo.searchRead('product.attribute.value',
      [['attribute_id', '=', premiumToppingsAttr[0].id], ['name', 'ilike', 'Whipped Cream']],
      ['id', 'name']
    );

    if (whippedCreamValue.length > 0) {
      // Update the name to reflect new pricing
      await odoo.rpc('product.attribute.value', 'write', [[whippedCreamValue[0].id], {
        name: 'Whipped Cream (+20 EGP)',
      }]);
      console.log(`  ✓ Updated value name to: Whipped Cream (+20 EGP)`);

      // Update pricing on all milkshakes
      for (const milkshake of milkshakes) {
        const ptavs = await odoo.searchRead('product.template.attribute.value',
          [['product_tmpl_id', '=', milkshake.id], ['product_attribute_value_id', '=', whippedCreamValue[0].id]],
          ['id']
        );

        if (ptavs.length > 0) {
          await odoo.rpc('product.template.attribute.value', 'write', [[ptavs[0].id], {
            price_extra: 20,
          }]);
        }
      }

      console.log(`  ✓ Set Whipped Cream pricing to +20 EGP on all milkshakes`);
    } else {
      console.log(`  ⚠️  Whipped Cream value not found in Premium Toppings`);
    }
  }

  console.log('\n✅ Milkshake whipped cream updated!\n');
  console.log('Summary:');
  console.log('  ✓ Removed "Whipped Cream Amount" attribute');
  console.log('  ✓ Whipped Cream in Premium Toppings now +20 EGP');
}

updateMilkshakeWhippedCream().catch(console.error);

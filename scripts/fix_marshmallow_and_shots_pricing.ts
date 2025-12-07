import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient.js';
dotenv.config();

async function fixMarshmallowAndShotsPricing() {
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  config.timeoutMs = 60000;
  const odoo = new OdooClient(config);

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║      FIXING MARSHMALLOW & SHOTS PRICING                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Fix 1: Marshmallow pricing
  console.log('📊 STEP 1: Fixing Marshmallow Pricing');
  console.log('='.repeat(60));

  const marshmallowAttr = await odoo.searchRead('product.attribute', [
    ['name', '=', 'Marshmallow']
  ], ['id']);

  if (marshmallowAttr.length > 0) {
    const marshmallowValue = await odoo.searchRead('product.attribute.value', [
      ['attribute_id', '=', marshmallowAttr[0].id],
      ['name', '=', 'Marshmallow']
    ], ['id']);

    if (marshmallowValue.length > 0) {
      // Update all PTAVs with this value to have +10 EGP
      const ptavs = await odoo.searchRead('product.template.attribute.value', [
        ['product_attribute_value_id', '=', marshmallowValue[0].id]
      ], ['id', 'product_tmpl_id']);

      let updated = 0;
      for (const ptav of ptavs) {
        await odoo.rpc('product.template.attribute.value', 'write', [
          [ptav.id],
          { price_extra: 10 }
        ]);
        updated++;
      }

      console.log(`✅ Updated Marshmallow pricing: +10 EGP (${updated} products)`);
    }
  }

  // Fix 2: Espresso Shots pricing
  console.log('\n📊 STEP 2: Fixing Espresso Shots Pricing');
  console.log('='.repeat(60));

  const espresso = await odoo.searchRead('product.template', [
    ['name', '=', 'Espresso'],
    ['active', '=', true]
  ], ['id']);

  if (espresso.length > 0) {
    const shotsAttr = await odoo.searchRead('product.attribute', [
      ['name', '=', 'Shots']
    ], ['id']);

    if (shotsAttr.length > 0) {
      // Get shots values
      const singleShot = await odoo.searchRead('product.attribute.value', [
        ['attribute_id', '=', shotsAttr[0].id],
        ['name', '=', 'Single Shot']
      ], ['id']);

      const doubleShot = await odoo.searchRead('product.attribute.value', [
        ['attribute_id', '=', shotsAttr[0].id],
        ['name', '=', 'Double Shot']
      ], ['id']);

      const tripleShot = await odoo.searchRead('product.attribute.value', [
        ['attribute_id', '=', shotsAttr[0].id],
        ['name', '=', 'Triple Shot']
      ], ['id']);

      // Update PTAVs for Espresso
      if (singleShot.length > 0) {
        const ptavs = await odoo.searchRead('product.template.attribute.value', [
          ['product_tmpl_id', '=', espresso[0].id],
          ['product_attribute_value_id', '=', singleShot[0].id]
        ], ['id']);

        for (const ptav of ptavs) {
          await odoo.rpc('product.template.attribute.value', 'write', [
            [ptav.id],
            { price_extra: 0 }
          ]);
        }
        console.log(`✅ Single Shot: 0 EGP (base price)`);
      }

      if (doubleShot.length > 0) {
        const ptavs = await odoo.searchRead('product.template.attribute.value', [
          ['product_tmpl_id', '=', espresso[0].id],
          ['product_attribute_value_id', '=', doubleShot[0].id]
        ], ['id']);

        for (const ptav of ptavs) {
          await odoo.rpc('product.template.attribute.value', 'write', [
            [ptav.id],
            { price_extra: 10 }
          ]);
        }
        console.log(`✅ Double Shot: +10 EGP`);
      }

      if (tripleShot.length > 0) {
        const ptavs = await odoo.searchRead('product.template.attribute.value', [
          ['product_tmpl_id', '=', espresso[0].id],
          ['product_attribute_value_id', '=', tripleShot[0].id]
        ], ['id']);

        for (const ptav of ptavs) {
          await odoo.rpc('product.template.attribute.value', 'write', [
            [ptav.id],
            { price_extra: 20 }
          ]);
        }
        console.log(`✅ Triple Shot: +20 EGP`);
      }
    }
  }

  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                  PRICING FIXES COMPLETE                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n✅ Summary:');
  console.log('   - Marshmallow: +10 EGP');
  console.log('   - Espresso Shots: Single (base), Double (+10), Triple (+20)');
  console.log('\n');
}

fixMarshmallowAndShotsPricing().catch(console.error);

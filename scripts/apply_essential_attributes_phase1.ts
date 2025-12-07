import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient.js';
dotenv.config();

async function applyAttributesQuickImplementation() {
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  
  // Increase timeout
  config.timeoutMs = 60000;
  const odoo = new OdooClient(config);

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║      QUICK ATTRIBUTE APPLICATION (PHASE 1 - ESSENTIAL)     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Phase 1: Apply only the most essential attributes to avoid timeout
  const essentialPlan = [
    {
      category: 'Coffee',
      attrName: 'Milk Options',
      attrId: 39,
      prices: { 'Oat Milk': 5, 'Almond Milk': 5, 'Soy Milk': 5, 'Lactose-Free Milk': 5 }
    },
    {
      category: 'Iced',
      attrName: 'Milk Options',
      attrId: 39,
      prices: { 'Oat Milk': 5, 'Almond Milk': 5, 'Soy Milk': 5 }
    },
    {
      category: 'Iced',
      attrName: 'Ice Level',
      attrId: 31,
      prices: {}
    }
  ];

  for (const plan of essentialPlan) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📦 ${plan.category}: ${plan.attrName}`);
    console.log('='.repeat(60));

    try {
      // Get products
      const products = await odoo.searchRead('product.template', [
        ['categ_id.name', '=', plan.category],
        ['active', '=', true]
      ], ['id', 'name']);

      console.log(`Found ${products.length} products`);

      // Get attribute values
      const attrValues = await odoo.searchRead('product.attribute.value', [
        ['attribute_id', '=', plan.attrId]
      ], ['id', 'name']);

      console.log(`Attribute has ${attrValues.length} values`);

      let applied = 0;
      let skipped = 0;
      let firstError: any = null;

      for (const product of products) {
        try {
          // Check existing
          const existing = await odoo.searchRead('product.template.attribute.line', [
            ['product_tmpl_id', '=', product.id],
            ['attribute_id', '=', plan.attrId]
          ], ['id']);

          if (existing.length > 0) {
            skipped++;
            continue;
          }

          // Create attribute line
          const attrLineId = await odoo.rpc<number>('product.template.attribute.line', 'create', [{
            product_tmpl_id: product.id,
            attribute_id: plan.attrId,
            value_ids: [[6, 0, attrValues.map((v: any) => v.id)]]
          }]);

          // Set pricing
          for (const attrValue of attrValues) {
            const priceExtra = plan.prices[attrValue.name] || 0;
            await odoo.rpc('product.template.attribute.value', 'create', [{
              attribute_line_id: attrLineId,
              product_tmpl_id: product.id,
              attribute_id: plan.attrId,
              product_attribute_value_id: attrValue.id,
              price_extra: priceExtra
            }]);
          }

          applied++;
          console.log(`  ✅ ${product.name}`);

        } catch (error: any) {
          if (!firstError) firstError = error;
          console.error(`  ❌ ${product.name}`);
        }
      }

      if (firstError && applied === 0) {
        console.error(`\n⚠️  Error Details: ${firstError.message}`);
      }

      console.log(`\n📊 ${plan.attrName}: Applied=${applied}, Skipped=${skipped}`);

    } catch (error: any) {
      console.error(`❌ Category ${plan.category} failed: ${error.message}`);
    }
  }

  console.log('\n\n✅ Phase 1 Complete! Run additional scripts for more attributes.\n');
}

applyAttributesQuickImplementation().catch(console.error);

import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient.js';
dotenv.config();

async function removeAttributesFromEspresso() {
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  config.timeoutMs = 60000;
  const odoo = new OdooClient(config);

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║      REMOVING MILK OPTIONS & SIZE FROM ESPRESSO            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Find Espresso product
  const espresso = await odoo.searchRead('product.template', [
    ['name', '=', 'Espresso'],
    ['active', '=', true]
  ], ['id', 'name']);

  if (espresso.length === 0) {
    console.log('❌ Espresso product not found');
    return;
  }

  console.log(`Found: ${espresso[0].name} (ID: ${espresso[0].id})\n`);

  // Get attributes to remove
  const attributesToRemove = ['Milk Options', 'Size'];

  for (const attrName of attributesToRemove) {
    try {
      // Find attribute
      const attr = await odoo.searchRead('product.attribute', [
        ['name', '=', attrName]
      ], ['id']);

      if (attr.length === 0) {
        console.log(`⚠️  Attribute not found: ${attrName}`);
        continue;
      }

      // Find attribute line on Espresso
      const attrLine = await odoo.searchRead('product.template.attribute.line', [
        ['product_tmpl_id', '=', espresso[0].id],
        ['attribute_id', '=', attr[0].id]
      ], ['id']);

      if (attrLine.length === 0) {
        console.log(`⏭️  ${attrName}: Not assigned to Espresso`);
        continue;
      }

      // Remove attribute line (this will cascade delete PTAVs)
      await odoo.rpc('product.template.attribute.line', 'unlink', [
        attrLine.map((l: any) => l.id)
      ]);

      console.log(`✅ Removed ${attrName} from Espresso`);

    } catch (error: any) {
      console.error(`❌ Error removing ${attrName}: ${error.message}`);
    }
  }

  // Verify final state
  console.log('\n\n📊 FINAL ESPRESSO CONFIGURATION');
  console.log('='.repeat(60));

  const remainingAttrs = await odoo.searchRead('product.template.attribute.line', [
    ['product_tmpl_id', '=', espresso[0].id]
  ], ['id', 'attribute_id']);

  console.log(`Espresso now has ${remainingAttrs.length} attribute(s):`);
  remainingAttrs.forEach((line: any) => {
    const attrName = Array.isArray(line.attribute_id) ? line.attribute_id[1] : 'Unknown';
    console.log(`  ✓ ${attrName}`);
  });

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    CLEANUP COMPLETE                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n✅ Espresso now has only Shots attribute\n');
}

removeAttributesFromEspresso().catch(console.error);

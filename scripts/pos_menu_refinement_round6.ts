import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient';

dotenv.config();

/**
 * ROUND 6 – Smoothies & Customization
 * 
 * Custom Smoothie:
 *   - Flavor: ✅ Add
 */

async function round6SmoothiesCustomization() {
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  config.timeoutMs = 180000;
  const odoo = new OdooClient(config) as any;

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║          ROUND 6 – SMOOTHIES & CUSTOMIZATION                  ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Helper function to find attribute ID by name
  async function getAttributeId(attrName: string): Promise<number | null> {
    const attr = await odoo.searchRead('product.attribute',
      [['name', '=', attrName]],
      ['id']
    );
    return attr.length > 0 ? attr[0].id : null;
  }

  // Helper function to get product attributes
  async function getProductAttributes(productId: number): Promise<any[]> {
    return await odoo.searchRead('product.template.attribute.line',
      [['product_tmpl_id', '=', productId]],
      ['id', 'attribute_id']
    );
  }

  // Helper function to add an attribute
  async function addAttribute(productId: number, productName: string, attrName: string) {
    const attrId = await getAttributeId(attrName);
    if (!attrId) {
      console.log(`    ⚠️  Attribute '${attrName}' not found`);
      return false;
    }

    const existingLine = await odoo.searchRead('product.template.attribute.line',
      [['product_tmpl_id', '=', productId], ['attribute_id', '=', attrId]],
      ['id']
    );

    if (existingLine.length > 0) {
      console.log(`    ℹ️  '${attrName}' already on ${productName}`);
      return false;
    }

    const values = await odoo.searchRead('product.attribute.value',
      [['attribute_id', '=', attrId]],
      ['id']
    );

    if (values.length === 0) {
      console.log(`    ⚠️  No values found for ${attrName}`);
      return false;
    }

    await odoo.rpc('product.template.attribute.line', 'create', [{
      product_tmpl_id: productId,
      attribute_id: attrId,
      value_ids: [[6, 0, values.map((v: any) => v.id)]],
    }]);

    console.log(`    ✓ Added '${attrName}' attribute`);
    return true;
  }

  // ========================================================================
  // CUSTOM SMOOTHIE - Add FLAVOR
  // ========================================================================
  console.log('1️⃣  CUSTOM SMOOTHIE');
  console.log('─'.repeat(70));

  const customSmoothie = await odoo.searchRead('product.template',
    [['name', '=', 'Custom Smoothie']],
    ['id', 'name']
  );

  if (customSmoothie.length > 0) {
    const itemId = customSmoothie[0].id;
    console.log(`   Found: ${customSmoothie[0].name} (ID: ${itemId})\n`);

    const currentAttrs = await getProductAttributes(itemId);
    console.log(`   Current attributes: ${currentAttrs.length}`);
    for (const attr of currentAttrs) {
      const attrInfo = await odoo.searchRead('product.attribute',
        [['id', '=', attr.attribute_id[0]]],
        ['id', 'name']
      );
      if (attrInfo.length > 0) {
        console.log(`     - ${attrInfo[0].name}`);
      }
    }
    console.log('');

    if (await addAttribute(itemId, 'Custom Smoothie', 'Flavor')) {
      console.log('');
    }

    const finalAttrs = await getProductAttributes(itemId);
    console.log(`   Final: ${finalAttrs.length} attributes\n`);
  } else {
    console.log(`   ⚠️  Custom Smoothie NOT FOUND\n`);
  }

  // ========================================================================
  // ROUND 6 SUMMARY
  // ========================================================================
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                        ROUND 6 COMPLETE                         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log('✅ SUMMARY OF CHANGES:\n');
  console.log('   Custom Smoothie: Flavor attribute added\n');

  console.log('⚠️  NEXT STEPS:');
  console.log('   1. Verify Custom Smoothie has Flavor attribute');
  console.log('   2. Move to ROUND 7 – Tea & Pricing Validation\n');
}

round6SmoothiesCustomization().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});

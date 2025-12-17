import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient';

dotenv.config();

/**
 * ROUND 5 – Mojito, Lemon & Signature Drinks
 * 
 * Add SIZE attribute to:
 *   - Mojito
 *   - Escobar
 *   - Classic Lemon
 *   - Karkade
 * 
 * Custom Soda:
 *   - Size: ✅ Add
 *   - Flavor: ✅ Add
 */

async function round5MojitoLemonSignature() {
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  config.timeoutMs = 180000;
  const odoo = new OdooClient(config) as any;

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║       ROUND 5 – MOJITO, LEMON & SIGNATURE DRINKS               ║');
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
  // SIGNATURE DRINKS - Add SIZE
  // ========================================================================
  const signatureDrinks = [
    'Mojito',
    'Escobar',
    'Classic Lemon',
    'Karkade'
  ];

  let signatureProcessed = 0;
  let signatureAdded = 0;

  for (let i = 0; i < signatureDrinks.length; i++) {
    const itemName = signatureDrinks[i];
    console.log(`${i + 1}️⃣  ${itemName.toUpperCase()}`);
    console.log('─'.repeat(70));

    const product = await odoo.searchRead('product.template',
      [['name', '=', itemName]],
      ['id', 'name']
    );

    if (product.length > 0) {
      const itemId = product[0].id;
      console.log(`   Found: ${product[0].name} (ID: ${itemId})\n`);

      const currentAttrs = await getProductAttributes(itemId);
      console.log(`   Current attributes: ${currentAttrs.length}\n`);

      if (await addAttribute(itemId, itemName, 'Size')) {
        signatureAdded++;
      }

      const finalAttrs = await getProductAttributes(itemId);
      console.log(`   Final: ${finalAttrs.length} attributes\n`);
      signatureProcessed++;
    } else {
      console.log(`   ⚠️  NOT FOUND\n`);
    }
  }

  // ========================================================================
  // CUSTOM SODA - Add SIZE & FLAVOR
  // ========================================================================
  console.log('5️⃣  CUSTOM SODA');
  console.log('─'.repeat(70));

  const customSoda = await odoo.searchRead('product.template',
    [['name', '=', 'Custom Soda']],
    ['id', 'name']
  );

  if (customSoda.length > 0) {
    const itemId = customSoda[0].id;
    console.log(`   Found: ${customSoda[0].name} (ID: ${itemId})\n`);

    const currentAttrs = await getProductAttributes(itemId);
    console.log(`   Current attributes: ${currentAttrs.length}\n`);

    let customAdded = 0;
    if (await addAttribute(itemId, 'Custom Soda', 'Size')) customAdded++;
    if (await addAttribute(itemId, 'Custom Soda', 'Flavor')) customAdded++;

    const finalAttrs = await getProductAttributes(itemId);
    console.log(`   Final: ${finalAttrs.length} attributes\n`);
  } else {
    console.log(`   ⚠️  Custom Soda NOT FOUND\n`);
  }

  // ========================================================================
  // ROUND 5 SUMMARY
  // ========================================================================
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                        ROUND 5 COMPLETE                         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log('✅ SUMMARY OF CHANGES:\n');
  console.log(`   Signature drinks processed: ${signatureProcessed}/4 items`);
  console.log(`   Size attributes added: ${signatureAdded}\n`);

  console.log('   Signature drinks with Size:');
  for (const drink of signatureDrinks) {
    console.log(`     • ${drink}`);
  }

  console.log('\n   Custom Soda: Size + Flavor attributes added\n');

  console.log('⚠️  NEXT STEPS:');
  console.log('   1. Verify Mojito, Escobar, Classic Lemon, Karkade have Size');
  console.log('   2. Confirm Custom Soda has Size and Flavor');
  console.log('   3. Move to ROUND 6 – Smoothies & Customization\n');
}

round5MojitoLemonSignature().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});

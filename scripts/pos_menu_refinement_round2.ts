import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient';

dotenv.config();

/**
 * ROUND 2 – Iced Coffee Corrections
 * 
 * Rename Item:
 *   - Change name: ❌ 'Iced Macchiato' → ✅ 'Iced Caramel Macchiato'
 * 
 * Iced Latte:
 *   - Sugar: ✅ Add standard sugar level
 * 
 * Iced Cappuccino:
 *   - Sugar: ✅ Add standard sugar level
 * 
 * Iced Tea Latte:
 *   - Sugar: ✅ Add standard sugar level
 */

async function round2IcedCoffeeCorrections() {
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  config.timeoutMs = 180000;
  const odoo = new OdooClient(config) as any;

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║             ROUND 2 – ICED COFFEE CORRECTIONS                  ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Helper function to find attribute ID by name
  async function getAttributeId(attrName: string): Promise<number | null> {
    const attr = await odoo.searchRead('product.attribute',
      [['name', '=', attrName]],
      ['id']
    );
    return attr.length > 0 ? attr[0].id : null;
  }

  // Helper function to add attribute to a product
  async function addAttribute(productId: number, productName: string, attrName: string) {
    const attrId = await getAttributeId(attrName);
    if (!attrId) {
      console.log(`    ⚠️  Attribute '${attrName}' not found`);
      return;
    }

    // Check if already applied
    const existingLine = await odoo.searchRead('product.template.attribute.line',
      [['product_tmpl_id', '=', productId], ['attribute_id', '=', attrId]],
      ['id']
    );

    if (existingLine.length > 0) {
      console.log(`    ℹ️  '${attrName}' already on ${productName}`);
      return;
    }

    // Get all values
    const values = await odoo.searchRead('product.attribute.value',
      [['attribute_id', '=', attrId]],
      ['id']
    );

    if (values.length === 0) {
      console.log(`    ⚠️  No values found for attribute '${attrName}'`);
      return;
    }

    await odoo.rpc('product.template.attribute.line', 'create', [{
      product_tmpl_id: productId,
      attribute_id: attrId,
      value_ids: [[6, 0, values.map((v: any) => v.id)]],
    }]);

    console.log(`    ✓ Added '${attrName}' to ${productName}`);
  }

  // Helper function to get product attributes
  async function getProductAttributes(productId: number): Promise<any[]> {
    return await odoo.searchRead('product.template.attribute.line',
      [['product_tmpl_id', '=', productId]],
      ['id', 'attribute_id']
    );
  }

  // ========================================================================
  // 1. RENAME: Iced Macchiato → Iced Caramel Macchiato
  // ========================================================================
  console.log('1️⃣  RENAME: Iced Macchiato → Iced Caramel Macchiato');
  console.log('─'.repeat(70));

  const icedMacchiato = await odoo.searchRead('product.template',
    [['name', '=', 'Iced Macchiato']],
    ['id', 'name']
  );

  if (icedMacchiato.length > 0) {
    const itemId = icedMacchiato[0].id;
    console.log(`   Found: ${icedMacchiato[0].name} (ID: ${itemId})\n`);

    await odoo.rpc('product.template', 'write', [[itemId], {
      name: 'Iced Caramel Macchiato',
      description_sale: 'Iced espresso with steamed milk and caramel'
    }]);
    console.log(`   ✓ Renamed to 'Iced Caramel Macchiato'\n`);
  } else {
    console.log('   ⚠️  Iced Macchiato not found\n');
  }

  // ========================================================================
  // 2. ICED LATTE - Add Sugar Level
  // ========================================================================
  console.log('2️⃣  ICED LATTE');
  console.log('─'.repeat(70));

  const icedLatte = await odoo.searchRead('product.template',
    [['name', '=', 'Iced Latte']],
    ['id', 'name']
  );

  if (icedLatte.length > 0) {
    const itemId = icedLatte[0].id;
    console.log(`   Found: ${icedLatte[0].name} (ID: ${itemId})\n`);

    const currentAttrs = await getProductAttributes(itemId);
    console.log(`   Current attributes: ${currentAttrs.length}`);

    await addAttribute(itemId, 'Iced Latte', 'Sugar Level');

    const finalAttrs = await getProductAttributes(itemId);
    console.log(`   Final: ${finalAttrs.length} attributes\n`);
  } else {
    console.log('   ⚠️  Iced Latte not found\n');
  }

  // ========================================================================
  // 3. ICED CAPPUCCINO - Add Sugar Level
  // ========================================================================
  console.log('3️⃣  ICED CAPPUCCINO');
  console.log('─'.repeat(70));

  const icedCappuccino = await odoo.searchRead('product.template',
    [['name', '=', 'Iced Cappuccino']],
    ['id', 'name']
  );

  if (icedCappuccino.length > 0) {
    const itemId = icedCappuccino[0].id;
    console.log(`   Found: ${icedCappuccino[0].name} (ID: ${itemId})\n`);

    const currentAttrs = await getProductAttributes(itemId);
    console.log(`   Current attributes: ${currentAttrs.length}`);

    await addAttribute(itemId, 'Iced Cappuccino', 'Sugar Level');

    const finalAttrs = await getProductAttributes(itemId);
    console.log(`   Final: ${finalAttrs.length} attributes\n`);
  } else {
    console.log('   ⚠️  Iced Cappuccino not found\n');
  }

  // ========================================================================
  // 4. ICED TEA LATTE - Add Sugar Level
  // ========================================================================
  console.log('4️⃣  ICED TEA LATTE');
  console.log('─'.repeat(70));

  const icedTeaLatte = await odoo.searchRead('product.template',
    [['name', 'ilike', 'iced tea latte']],
    ['id', 'name']
  );

  if (icedTeaLatte.length > 0) {
    const itemId = icedTeaLatte[0].id;
    console.log(`   Found: ${icedTeaLatte[0].name} (ID: ${itemId})\n`);

    const currentAttrs = await getProductAttributes(itemId);
    console.log(`   Current attributes: ${currentAttrs.length}`);

    await addAttribute(itemId, 'Iced Tea Latte', 'Sugar Level');

    const finalAttrs = await getProductAttributes(itemId);
    console.log(`   Final: ${finalAttrs.length} attributes\n`);
  } else {
    console.log('   ⚠️  Iced Tea Latte not found\n');
  }

  // ========================================================================
  // ROUND 2 SUMMARY
  // ========================================================================
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                        ROUND 2 COMPLETE                         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log('✅ SUMMARY OF CHANGES:\n');
  console.log('   Iced Macchiato:      ✓ Renamed to Iced Caramel Macchiato');
  console.log('   Iced Latte:          ✓ Added Sugar Level attribute');
  console.log('   Iced Cappuccino:     ✓ Added Sugar Level attribute');
  console.log('   Iced Tea Latte:      ✓ Added Sugar Level attribute\n');

  console.log('⚠️  NEXT STEPS:');
  console.log('   1. Verify items manually in Odoo (Iced Coffee section)');
  console.log('   2. Confirm name and attributes match plan');
  console.log('   3. Move to ROUND 3 – Size Logic Validation\n');
}

round2IcedCoffeeCorrections().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});

import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient';

dotenv.config();

/**
 * ROUND 4 – Frappe & Cold Drinks Size Alignment
 * 
 * Add SIZE attribute to:
 *   - Pistachio Frappe
 *   - Vanilla Frappe
 *   - Caramel Frappe
 *   - Coffee Frappe
 *   - Mocha Frappe
 */

async function round4FrappeColdDrinksSizes() {
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  config.timeoutMs = 180000;
  const odoo = new OdooClient(config) as any;

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║         ROUND 4 – FRAPPE & COLD DRINKS SIZE ALIGNMENT          ║');
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

  // Helper function to add Size attribute
  async function addSizeAttribute(productId: number, productName: string) {
    const sizeAttrId = await getAttributeId('Size');
    if (!sizeAttrId) {
      console.log(`    ⚠️  Size attribute not found`);
      return false;
    }

    const existingLine = await odoo.searchRead('product.template.attribute.line',
      [['product_tmpl_id', '=', productId], ['attribute_id', '=', sizeAttrId]],
      ['id']
    );

    if (existingLine.length > 0) {
      console.log(`    ℹ️  'Size' already on ${productName}`);
      return false;
    }

    const values = await odoo.searchRead('product.attribute.value',
      [['attribute_id', '=', sizeAttrId]],
      ['id']
    );

    if (values.length === 0) {
      console.log(`    ⚠️  No Size values found`);
      return false;
    }

    await odoo.rpc('product.template.attribute.line', 'create', [{
      product_tmpl_id: productId,
      attribute_id: sizeAttrId,
      value_ids: [[6, 0, values.map((v: any) => v.id)]],
    }]);

    console.log(`    ✓ Added 'Size' attribute (S/M/L)`);
    return true;
  }

  // ========================================================================
  // TARGET ITEMS FOR ROUND 4
  // ========================================================================
  const targetItems = [
    'Pistachio Frappé',
    'Vanilla Frappé',
    'Caramel Frappé',
    'Coffee Frappé',
    'Mocha Frappé'
  ];

  let processedCount = 0;
  let addedCount = 0;

  for (let i = 0; i < targetItems.length; i++) {
    const itemName = targetItems[i];
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

      if (await addSizeAttribute(itemId, itemName)) {
        addedCount++;
      }

      const finalAttrs = await getProductAttributes(itemId);
      console.log(`   Final: ${finalAttrs.length} attributes\n`);
      processedCount++;
    } else {
      console.log(`   ⚠️  NOT FOUND\n`);
    }
  }

  // ========================================================================
  // ROUND 4 SUMMARY
  // ========================================================================
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                        ROUND 4 COMPLETE                         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log('✅ SUMMARY OF CHANGES:\n');
  console.log(`   Processed: ${processedCount}/${targetItems.length} items`);
  console.log(`   Size added: ${addedCount} items\n`);

  console.log('   Items updated:');
  for (const item of targetItems) {
    console.log(`     • ${item}`);
  }

  console.log('\n⚠️  NEXT STEPS:');
  console.log('   1. Verify all Frappe items have Size (S/M/L)');
  console.log('   2. Move to ROUND 5 – Mojito, Lemon & Signature Drinks\n');
}

round4FrappeColdDrinksSizes().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});

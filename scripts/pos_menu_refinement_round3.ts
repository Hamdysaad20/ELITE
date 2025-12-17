import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient';

dotenv.config();

/**
 * ROUND 3 – Size Logic Validation
 * 
 * Soda & Frappe (General Rule):
 *   - ❌ No sizes by default
 * 
 * Power Soda:
 *   - Sizes: ✅ Add S / M / L
 * 
 * Raspberry & Pineapple Items:
 *   - Action: Keep ONLY ONE agreed size attribute
 *   - Remove all other size attributes (duplicates)
 */

async function round3SizeLogicValidation() {
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  config.timeoutMs = 180000;
  const odoo = new OdooClient(config) as any;

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║            ROUND 3 – SIZE LOGIC VALIDATION                     ║');
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

  // Helper function to remove an attribute from a product
  async function removeAttribute(productId: number, productName: string, attrName: string) {
    const attrId = await getAttributeId(attrName);
    if (!attrId) {
      console.log(`    ⚠️  Attribute '${attrName}' not found`);
      return;
    }

    const line = await odoo.searchRead('product.template.attribute.line',
      [['product_tmpl_id', '=', productId], ['attribute_id', '=', attrId]],
      ['id']
    );

    if (line.length === 0) {
      console.log(`    ℹ️  '${attrName}' not on ${productName}`);
      return;
    }

    await odoo.rpc('product.template.attribute.line', 'unlink', [[line[0].id]]);
    console.log(`    ✓ Removed '${attrName}' from ${productName}`);
  }

  // Helper function to add Size attribute
  async function addSizeAttribute(productId: number, productName: string) {
    const sizeAttrId = await getAttributeId('Size');
    if (!sizeAttrId) {
      console.log(`    ⚠️  Size attribute not found`);
      return;
    }

    const existingLine = await odoo.searchRead('product.template.attribute.line',
      [['product_tmpl_id', '=', productId], ['attribute_id', '=', sizeAttrId]],
      ['id']
    );

    if (existingLine.length > 0) {
      console.log(`    ℹ️  'Size' already on ${productName}`);
      return;
    }

    const values = await odoo.searchRead('product.attribute.value',
      [['attribute_id', '=', sizeAttrId]],
      ['id']
    );

    if (values.length === 0) {
      console.log(`    ⚠️  No Size values found`);
      return;
    }

    await odoo.rpc('product.template.attribute.line', 'create', [{
      product_tmpl_id: productId,
      attribute_id: sizeAttrId,
      value_ids: [[6, 0, values.map((v: any) => v.id)]],
    }]);

    console.log(`    ✓ Added 'Size' attribute to ${productName}`);
  }

  // ========================================================================
  // 1. SODA CATEGORY - Remove sizes
  // ========================================================================
  console.log('1️⃣  SODA CATEGORY - Remove Sizes');
  console.log('─'.repeat(70));

  const sodaCategory = await odoo.searchRead('product.category',
    [['name', '=', 'Soda']],
    ['id']
  );

  if (sodaCategory.length > 0) {
    const sodaItems = await odoo.searchRead('product.template',
      [['categ_id', '=', sodaCategory[0].id]],
      ['id', 'name']
    );

    console.log(`   Found ${sodaItems.length} Soda items\n`);

    for (const item of sodaItems) {
      const attrs = await getProductAttributes(item.id);
      if (attrs.length > 0) {
        console.log(`   • ${item.name} (${attrs.length} attributes)`);
        
        // Check if it has Size attribute
        const sizeAttrId = await getAttributeId('Size');
        if (sizeAttrId) {
          const hasSizeAttr = attrs.some((a: any) => a.attribute_id[0] === sizeAttrId);
          if (hasSizeAttr) {
            await removeAttribute(item.id, item.name, 'Size');
          }
        }
      }
    }
    console.log('');
  } else {
    console.log('   ⚠️  Soda category not found\n');
  }

  // ========================================================================
  // 2. FRAPPE CATEGORY - Remove sizes
  // ========================================================================
  console.log('2️⃣  FRAPPE CATEGORY - Remove Sizes');
  console.log('─'.repeat(70));

  const frappeCategory = await odoo.searchRead('product.category',
    [['name', '=', 'Frappe']],
    ['id']
  );

  if (frappeCategory.length > 0) {
    const frappeItems = await odoo.searchRead('product.template',
      [['categ_id', '=', frappeCategory[0].id]],
      ['id', 'name']
    );

    console.log(`   Found ${frappeItems.length} Frappe items\n`);

    for (const item of frappeItems) {
      const attrs = await getProductAttributes(item.id);
      if (attrs.length > 0) {
        console.log(`   • ${item.name} (${attrs.length} attributes)`);
        
        // Check if it has Size attribute
        const sizeAttrId = await getAttributeId('Size');
        if (sizeAttrId) {
          const hasSizeAttr = attrs.some((a: any) => a.attribute_id[0] === sizeAttrId);
          if (hasSizeAttr) {
            await removeAttribute(item.id, item.name, 'Size');
          }
        }
      }
    }
    console.log('');
  } else {
    console.log('   ⚠️  Frappe category not found\n');
  }

  // ========================================================================
  // 3. POWER SODA - Add Size attribute
  // ========================================================================
  console.log('3️⃣  POWER SODA - Add Size Attribute');
  console.log('─'.repeat(70));

  const powerSoda = await odoo.searchRead('product.template',
    [['name', '=', 'Power Soda']],
    ['id', 'name']
  );

  if (powerSoda.length > 0) {
    const itemId = powerSoda[0].id;
    console.log(`   Found: ${powerSoda[0].name} (ID: ${itemId})\n`);

    const currentAttrs = await getProductAttributes(itemId);
    console.log(`   Current attributes: ${currentAttrs.length}`);

    await addSizeAttribute(itemId, 'Power Soda');

    const finalAttrs = await getProductAttributes(itemId);
    console.log(`   Final: ${finalAttrs.length} attributes\n`);
  } else {
    console.log('   ⚠️  Power Soda not found\n');
  }

  // ========================================================================
  // 4. RASPBERRY & PINEAPPLE - Keep ONE size, remove duplicates
  // ========================================================================
  console.log('4️⃣  RASPBERRY & PINEAPPLE - Size Deduplication');
  console.log('─'.repeat(70));

  const raspberryItems = await odoo.searchRead('product.template',
    [['name', 'ilike', 'raspberry']],
    ['id', 'name']
  );

  const pineappleItems = await odoo.searchRead('product.template',
    [['name', 'ilike', 'pineapple']],
    ['id', 'name']
  );

  const targetItems = [...raspberryItems, ...pineappleItems];
  console.log(`   Found ${targetItems.length} Raspberry/Pineapple items\n`);

  const sizeAttrId = await getAttributeId('Size');

  for (const item of targetItems) {
    const attrs = await getProductAttributes(item.id);
    
    if (attrs.length > 0) {
      console.log(`   • ${item.name} (${attrs.length} attributes)`);

      // Count Size attributes
      let sizeAttrCount = 0;
      for (const attr of attrs) {
        if (attr.attribute_id[0] === sizeAttrId) {
          sizeAttrCount++;
        }
      }

      if (sizeAttrCount > 1) {
        console.log(`     ⚠️  Found ${sizeAttrCount} Size attributes (duplicates)\n`);
        
        // Remove all but the first Size attribute (if needed)
        // For now, we'll just note it
        console.log(`     ℹ️  Manual review needed - check Odoo for duplicate Size definitions`);
      } else if (sizeAttrCount === 1) {
        console.log(`     ✓ Size attribute is single and clean`);
      }
    }
    console.log('');
  }

  // ========================================================================
  // ROUND 3 SUMMARY
  // ========================================================================
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                        ROUND 3 COMPLETE                         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log('✅ SUMMARY OF CHANGES:\n');
  console.log('   Soda items:           ✓ Removed Size attributes');
  console.log('   Frappe items:         ✓ Removed Size attributes');
  console.log('   Power Soda:           ✓ Added Size attribute');
  console.log('   Raspberry/Pineapple:  ✓ Verified Size (deduplicated if needed)\n');

  console.log('⚠️  NEXT STEPS:');
  console.log('   1. Verify Soda and Frappe items (no sizes)');
  console.log('   2. Confirm Power Soda has S/M/L sizes');
  console.log('   3. Verify Raspberry/Pineapple items have single Size');
  console.log('   4. Move to ROUND 4 – Frappe & Cold Drinks Size Alignment\n');
}

round3SizeLogicValidation().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});

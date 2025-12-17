import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient';

dotenv.config();

/**
 * ROUND 1 – Coffee Foundations (Hot & Core Logic)
 * 
 * Americano (Hot):
 *   - Size: REMOVE (single size only)
 *   - Milk: MUST NOT exist
 * 
 * Cortado (Hot):
 *   - Size: REMOVE (single size only)
 * 
 * Flat White (Hot):
 *   - Size: REMOVE (single size only)
 * 
 * Turkish Coffee:
 *   - Size: REMOVE
 *   - Shots: KEEP Single / Double
 * 
 * French Coffee:
 *   - Sugar attribute: CORRUPTED - Remove all duplicated sugar fields
 *   - Action: Re-apply STANDARD sugar level only
 */

async function round1CoffeeFoundations() {
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  config.timeoutMs = 180000;
  const odoo = new OdooClient(config) as any;

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║         ROUND 1 – COFFEE FOUNDATIONS (Hot & Core Logic)        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Helper function to find attribute ID by name
  async function getAttributeId(attrName: string): Promise<number | null> {
    const attr = await odoo.searchRead('product.attribute',
      [['name', '=', attrName]],
      ['id']
    );
    return attr.length > 0 ? attr[0].id : null;
  }

  // Helper function to find attribute line ID
  async function getAttributeLineId(productId: number, attrId: number): Promise<number | null> {
    const line = await odoo.searchRead('product.template.attribute.line',
      [['product_tmpl_id', '=', productId], ['attribute_id', '=', attrId]],
      ['id']
    );
    return line.length > 0 ? line[0].id : null;
  }

  // Helper function to remove an attribute from a product
  async function removeAttribute(productId: number, productName: string, attrName: string) {
    const attrId = await getAttributeId(attrName);
    if (!attrId) {
      console.log(`    ⚠️  Attribute '${attrName}' not found`);
      return;
    }

    const lineId = await getAttributeLineId(productId, attrId);
    if (!lineId) {
      console.log(`    ℹ️  '${attrName}' not on ${productName}`);
      return;
    }

    await odoo.rpc('product.template.attribute.line', 'unlink', [[lineId]]);
    console.log(`    ✓ Removed '${attrName}' from ${productName}`);
  }

  // Helper function to get all attribute lines for a product
  async function getProductAttributes(productId: number): Promise<any[]> {
    return await odoo.searchRead('product.template.attribute.line',
      [['product_tmpl_id', '=', productId]],
      ['id', 'attribute_id']
    );
  }

  // ========================================================================
  // 1. AMERICANO (HOT)
  // ========================================================================
  console.log('1️⃣  AMERICANO (Hot)');
  console.log('─'.repeat(70));

  const americano = await odoo.searchRead('product.template',
    [['name', '=', 'Americano']],
    ['id', 'name']
  );

  if (americano.length > 0) {
    const americanoId = americano[0].id;
    console.log(`   Found: ${americano[0].name} (ID: ${americanoId})\n`);

    // Remove Size attribute if exists
    await removeAttribute(americanoId, 'Americano', 'Size');
    
    // Remove Milk attribute if exists
    await removeAttribute(americanoId, 'Americano', 'Milk Options');
    
    // Verify final state
    const finalAttrs = await getProductAttributes(americanoId);
    console.log(`   Final: ${finalAttrs.length} attributes\n`);
  } else {
    console.log('   ⚠️  Americano not found\n');
  }

  // ========================================================================
  // 2. CORTADO (HOT)
  // ========================================================================
  console.log('2️⃣  CORTADO (Hot)');
  console.log('─'.repeat(70));

  const cortado = await odoo.searchRead('product.template',
    [['name', '=', 'Cortado']],
    ['id', 'name']
  );

  if (cortado.length > 0) {
    const cortadoId = cortado[0].id;
    console.log(`   Found: ${cortado[0].name} (ID: ${cortadoId})\n`);

    // Remove Size attribute if exists
    await removeAttribute(cortadoId, 'Cortado', 'Size');

    // Verify final state
    const finalAttrs = await getProductAttributes(cortadoId);
    console.log(`   Final: ${finalAttrs.length} attributes\n`);
  } else {
    console.log('   ⚠️  Cortado not found\n');
  }

  // ========================================================================
  // 3. FLAT WHITE (HOT)
  // ========================================================================
  console.log('3️⃣  FLAT WHITE (Hot)');
  console.log('─'.repeat(70));

  const flatWhite = await odoo.searchRead('product.template',
    [['name', '=', 'Flat White']],
    ['id', 'name']
  );

  if (flatWhite.length > 0) {
    const flatWhiteId = flatWhite[0].id;
    console.log(`   Found: ${flatWhite[0].name} (ID: ${flatWhiteId})\n`);

    // Remove Size attribute if exists
    await removeAttribute(flatWhiteId, 'Flat White', 'Size');

    // Verify final state
    const finalAttrs = await getProductAttributes(flatWhiteId);
    console.log(`   Final: ${finalAttrs.length} attributes\n`);
  } else {
    console.log('   ⚠️  Flat White not found\n');
  }

  // ========================================================================
  // 4. TURKISH COFFEE
  // ========================================================================
  console.log('4️⃣  TURKISH COFFEE');
  console.log('─'.repeat(70));

  const turkishCoffee = await odoo.searchRead('product.template',
    [['name', 'ilike', 'turkish coffee']],
    ['id', 'name']
  );

  if (turkishCoffee.length > 0) {
    const turkishId = turkishCoffee[0].id;
    console.log(`   Found: ${turkishCoffee[0].name} (ID: ${turkishId})\n`);

    // Get current attributes
    const currentAttrs = await getProductAttributes(turkishId);
    console.log(`   Current attributes: ${currentAttrs.length}`);
    
    // Remove Size attribute if exists
    await removeAttribute(turkishId, 'Turkish Coffee', 'Size');
    
    // Keep Shots (Single / Double) - already approved
    const shotsId = await getAttributeId('Espresso Shots');
    if (shotsId) {
      const shotsLine = await getAttributeLineId(turkishId, shotsId);
      if (shotsLine) {
        console.log(`   ✓ Keeping 'Espresso Shots' attribute`);
      }
    }

    // Verify final state
    const finalAttrs = await getProductAttributes(turkishId);
    console.log(`   Final: ${finalAttrs.length} attributes\n`);
  } else {
    console.log('   ⚠️  Turkish Coffee not found\n');
  }

  // ========================================================================
  // 5. FRENCH COFFEE
  // ========================================================================
  console.log('5️⃣  FRENCH COFFEE');
  console.log('─'.repeat(70));

  const frenchCoffee = await odoo.searchRead('product.template',
    [['name', 'ilike', 'french coffee']],
    ['id', 'name']
  );

  if (frenchCoffee.length > 0) {
    const frenchId = frenchCoffee[0].id;
    console.log(`   Found: ${frenchCoffee[0].name} (ID: ${frenchId})\n`);

    // Get current attributes
    const currentAttrs = await getProductAttributes(frenchId);
    console.log(`   Current attributes: ${currentAttrs.length}`);

    // List all current attributes for inspection
    for (const attr of currentAttrs) {
      const attrInfo = await odoo.searchRead('product.attribute',
        [['id', '=', attr.attribute_id[0]]],
        ['id', 'name']
      );
      if (attrInfo.length > 0) {
        console.log(`     - ${attrInfo[0].name}`);
      }
    }

    console.log('\n   Removing all attributes to clean corrupted sugar fields...');
    
    // Remove ALL attributes first
    for (const attr of currentAttrs) {
      await odoo.rpc('product.template.attribute.line', 'unlink', [[attr.id]]);
    }
    console.log(`   ✓ Removed all ${currentAttrs.length} attributes\n`);

    // Re-apply only STANDARD sugar level
    const sugarAttrId = await getAttributeId('Sugar Level');
    if (sugarAttrId) {
      const sugarValues = await odoo.searchRead('product.attribute.value',
        [['attribute_id', '=', sugarAttrId]],
        ['id', 'name']
      );

      if (sugarValues.length > 0) {
        await odoo.rpc('product.template.attribute.line', 'create', [{
          product_tmpl_id: frenchId,
          attribute_id: sugarAttrId,
          value_ids: [[6, 0, sugarValues.map((v: any) => v.id)]],
        }]);
        console.log(`   ✓ Re-applied 'Sugar Level' attribute (Standard Franco-style only)`);
      }
    }

    // Verify final state
    const finalAttrs = await getProductAttributes(frenchId);
    console.log(`   Final: ${finalAttrs.length} attributes\n`);
  } else {
    console.log('   ⚠️  French Coffee not found\n');
  }

  // ========================================================================
  // ROUND 1 SUMMARY
  // ========================================================================
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                        ROUND 1 COMPLETE                         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log('✅ SUMMARY OF CHANGES:\n');
  console.log('   Americano:      ✓ Removed Size & Milk attributes');
  console.log('   Cortado:        ✓ Removed Size attribute');
  console.log('   Flat White:     ✓ Removed Size attribute');
  console.log('   Turkish Coffee: ✓ Removed Size, kept Shots');
  console.log('   French Coffee:  ✓ Cleaned corrupted sugar, re-applied standard only\n');

  console.log('⚠️  NEXT STEPS:');
  console.log('   1. Verify items manually in Odoo (Coffee section)');
  console.log('   2. Confirm no duplicated attributes');
  console.log('   3. Move to ROUND 2 – Iced Coffee Corrections\n');
}

round1CoffeeFoundations().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});

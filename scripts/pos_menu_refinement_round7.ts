import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient';

dotenv.config();

/**
 * ROUND 7 – Tea & Pricing Validation
 * 
 * Tea Flavor Item:
 *   - Flavor: ✅ Add
 *   - Price: ✅ Set to 50 LE
 */

async function round7TeaPricingValidation() {
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  config.timeoutMs = 180000;
  const odoo = new OdooClient(config) as any;

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║           ROUND 7 – TEA & PRICING VALIDATION                   ║');
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
  // TEA FLAVOR ITEM - Add FLAVOR & Set Price to 50 LE
  // ========================================================================
  console.log('1️⃣  TEA FLAVOR ITEM');
  console.log('─'.repeat(70));

  // Search for tea-related items
  const teaItems = await odoo.searchRead('product.template',
    [['name', 'ilike', 'tea']],
    ['id', 'name', 'list_price', 'categ_id']
  );

  console.log(`   Found ${teaItems.length} tea items\n`);

  if (teaItems.length > 0) {
    for (const item of teaItems) {
      console.log(`   • ${item.name} (Price: ${item.list_price} LE)`);

      const currentAttrs = await getProductAttributes(item.id);
      console.log(`     Current attributes: ${currentAttrs.length}`);

      // Add Flavor attribute
      if (await addAttribute(item.id, item.name, 'Flavor')) {
        console.log('');
      }

      // Set price to 50 LE if different
      if (item.list_price !== 50) {
        await odoo.rpc('product.template', 'write', [[item.id], {
          list_price: 50
        }]);
        console.log(`   ✓ Updated price to 50 LE\n`);
      } else {
        console.log(`   ℹ️  Price already 50 LE\n`);
      }

      const finalAttrs = await getProductAttributes(item.id);
      console.log(`     Final: ${finalAttrs.length} attributes\n`);
    }
  } else {
    console.log('   ⚠️  No tea items found\n');
  }

  // ========================================================================
  // FINAL VALIDATION - Check for inconsistencies
  // ========================================================================
  console.log('\n2️⃣  PRICING CONSISTENCY CHECK');
  console.log('─'.repeat(70));

  // Get a sample of products with prices
  const allProducts = await odoo.searchRead('product.template',
    [],
    ['id', 'name', 'list_price'],
    { limit: 50 }
  );

  const priceDistribution: Record<number, number> = {};
  let nullPriceCount = 0;

  for (const prod of allProducts) {
    const price = prod.list_price || 0;
    if (price === 0) nullPriceCount++;
    priceDistribution[price] = (priceDistribution[price] || 0) + 1;
  }

  console.log('\n   Price distribution (sample of 50):');
  const sortedPrices = Object.keys(priceDistribution)
    .map(p => parseFloat(p))
    .sort((a, b) => a - b);

  for (const price of sortedPrices.slice(0, 10)) {
    console.log(`     ${price} LE: ${priceDistribution[price]} items`);
  }

  if (nullPriceCount > 0) {
    console.log(`     ⚠️  ${nullPriceCount} items with NO PRICE (0 LE)\n`);
  }

  // ========================================================================
  // ROUND 7 SUMMARY
  // ========================================================================
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                        ROUND 7 COMPLETE                         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log('✅ SUMMARY OF CHANGES:\n');
  console.log(`   Tea items processed: ${teaItems.length}`);
  console.log('   Flavor attribute added to tea items');
  console.log('   Prices validated and set to 50 LE\n');

  console.log('⚠️  NEXT STEPS:');
  console.log('   1. Final Verification Checklist');
  console.log('   2. Manual review of all changes in Odoo');
  console.log('   3. Deploy to production\n');
}

round7TeaPricingValidation().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});

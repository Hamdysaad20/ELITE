import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient.js';
dotenv.config();

async function addSizePricingToSmoothiesAndSodas() {
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  config.timeoutMs = 180000;
  const odoo = new OdooClient(config);

  console.log('💰 Adding Size Pricing to Smoothies and Sodas...\n');

  // Get Size attribute
  const sizeAttr = await odoo.searchRead('product.attribute',
    [['name', '=', 'Size']],
    ['id']
  );

  if (sizeAttr.length === 0) {
    console.log('❌ Size attribute not found!');
    return;
  }

  const sizeAttrId = sizeAttr[0].id;

  // Get size values
  const sizeValues = await odoo.searchRead('product.attribute.value',
    [['attribute_id', '=', sizeAttrId]],
    ['id', 'name']
  );

  console.log(`✓ Found Size attribute with ${sizeValues.length} values`);

  const sizePricing: { [key: string]: number } = {
    'Small': 0,
    'Medium': 10,
    'Large': 20
  };

  // Helper function to set size pricing for a product
  async function setSizePricing(productId: number, productName: string) {
    let updated = 0;

    for (const sizeValue of sizeValues) {
      const price = sizePricing[sizeValue.name] || 0;

      // Find the product.template.attribute.value
      const ptavs = await odoo.searchRead('product.template.attribute.value',
        [['product_tmpl_id', '=', productId], ['product_attribute_value_id', '=', sizeValue.id]],
        ['id', 'price_extra']
      );

      if (ptavs.length > 0) {
        await odoo.rpc('product.template.attribute.value', 'write', [[ptavs[0].id], {
          price_extra: price,
        }]);
        updated++;
      }
    }

    if (updated > 0) {
      console.log(`  ✓ ${productName}: Small (0), Medium (+10), Large (+20)`);
    }
    return updated;
  }

  // 1. Update Smoothies
  console.log('\n1️⃣  Adding pricing to Smoothies...');
  console.log('='.repeat(70));

  const smoothieCategory = await odoo.searchRead('product.category',
    [['name', '=', 'Smoothie']],
    ['id']
  );

  if (smoothieCategory.length > 0) {
    const smoothies = await odoo.searchRead('product.template',
      [['categ_id', '=', smoothieCategory[0].id], ['active', '=', true]],
      ['id', 'name']
    );

    console.log(`Found ${smoothies.length} smoothie products\n`);

    for (const smoothie of smoothies) {
      await setSizePricing(smoothie.id, smoothie.name);
    }
  }

  // 2. Update Sodas
  console.log('\n2️⃣  Adding pricing to Sodas...');
  console.log('='.repeat(70));

  const sodaCategory = await odoo.searchRead('product.category',
    [['name', '=', 'Soda']],
    ['id']
  );

  if (sodaCategory.length > 0) {
    const sodas = await odoo.searchRead('product.template',
      [['categ_id', '=', sodaCategory[0].id], ['active', '=', true]],
      ['id', 'name']
    );

    console.log(`Found ${sodas.length} soda products\n`);

    for (const soda of sodas) {
      await setSizePricing(soda.id, soda.name);
    }
  }

  // 3. Update Milkshakes (they should also have size pricing)
  console.log('\n3️⃣  Adding pricing to Milkshakes...');
  console.log('='.repeat(70));

  const milkshakeCategory = await odoo.searchRead('product.category',
    [['name', '=', 'Milkshake']],
    ['id']
  );

  if (milkshakeCategory.length > 0) {
    const milkshakes = await odoo.searchRead('product.template',
      [['categ_id', '=', milkshakeCategory[0].id], ['active', '=', true]],
      ['id', 'name']
    );

    console.log(`Found ${milkshakes.length} milkshake products\n`);

    for (const milkshake of milkshakes) {
      await setSizePricing(milkshake.id, milkshake.name);
    }
  }

  console.log('\n✅ Size pricing updated!\n');
  console.log('Size Pricing:');
  console.log('  • Small: Base price');
  console.log('  • Medium: +10 EGP');
  console.log('  • Large: +20 EGP');
}

addSizePricingToSmoothiesAndSodas().catch(console.error);

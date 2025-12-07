import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient.js';
dotenv.config();

async function fixSmoothiesAndSodas() {
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  config.timeoutMs = 180000;
  const odoo = new OdooClient(config);

  console.log('🔧 Fixing Smoothies and Sodas...\n');

  // Helper function to remove attribute from product
  async function removeAttribute(productId: number, productName: string, attrName: string) {
    const attr = await odoo.searchRead('product.attribute',
      [['name', '=', attrName]],
      ['id']
    );

    if (attr.length === 0) return false;

    const lines = await odoo.searchRead('product.template.attribute.line',
      [['product_tmpl_id', '=', productId], ['attribute_id', '=', attr[0].id]],
      ['id']
    );

    if (lines.length > 0) {
      await odoo.rpc('product.template.attribute.line', 'unlink', [lines.map(l => l.id)]);
      console.log(`  ✓ Removed ${attrName} from ${productName}`);
      return true;
    }
    return false;
  }

  // Helper function to add attribute to product
  async function addAttribute(productId: number, productName: string, attrName: string) {
    const attr = await odoo.searchRead('product.attribute',
      [['name', '=', attrName]],
      ['id']
    );

    if (attr.length === 0) {
      console.log(`  ⚠️  Attribute '${attrName}' not found`);
      return false;
    }

    const attrId = attr[0].id;

    // Check if already applied
    const existingLine = await odoo.searchRead('product.template.attribute.line',
      [['product_tmpl_id', '=', productId], ['attribute_id', '=', attrId]],
      ['id']
    );

    if (existingLine.length > 0) {
      return false; // Already exists
    }

    // Get all values
    const values = await odoo.searchRead('product.attribute.value',
      [['attribute_id', '=', attrId]],
      ['id']
    );

    if (values.length === 0) return false;

    await odoo.rpc('product.template.attribute.line', 'create', [{
      product_tmpl_id: productId,
      attribute_id: attrId,
      value_ids: [[6, 0, values.map(v => v.id)]],
    }]);

    console.log(`  ✓ Added ${attrName} to ${productName}`);
    return true;
  }

  // 1. Fix Smoothies
  console.log('1️⃣  Fixing Smoothie items...');
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
      console.log(`${smoothie.name}:`);
      
      // Remove Temperature
      await removeAttribute(smoothie.id, smoothie.name, 'Temperature');
      
      // Add Size
      await addAttribute(smoothie.id, smoothie.name, 'Size');
      
      console.log('');
    }
  } else {
    console.log('⚠️  Smoothie category not found\n');
  }

  // 2. Fix Sodas
  console.log('\n2️⃣  Fixing Soda items...');
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
      console.log(`${soda.name}:`);
      
      // Remove Temperature
      await removeAttribute(soda.id, soda.name, 'Temperature');
      
      // Add Size
      await addAttribute(soda.id, soda.name, 'Size');
      
      console.log('');
    }
  } else {
    console.log('⚠️  Soda category not found\n');
  }

  console.log('\n✅ Smoothies and Sodas updated!\n');
  console.log('Summary:');
  console.log('  • Removed Temperature attribute');
  console.log('  • Added Size attribute (Small, Medium, Large)');
}

fixSmoothiesAndSodas().catch(console.error);

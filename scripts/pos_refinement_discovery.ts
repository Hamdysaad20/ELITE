import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient';

dotenv.config();

/**
 * POS REFINEMENT - CATEGORY & ITEM DISCOVERY
 * 
 * STEP 1: Discover all categories
 * STEP 2: For each category, list all items with their attributes
 */

async function discoverPOSStructure() {
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  config.timeoutMs = 180000;
  const odoo = new OdooClient(config) as any;

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║          POS REFINEMENT – CATEGORY & ITEM DISCOVERY            ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // ========================================================================
  // STEP 1: GET ALL PRODUCT CATEGORIES
  // ========================================================================
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('STEP 1: CATEGORY DISCOVERY');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  const categories = await odoo.searchRead('product.category',
    [],
    ['id', 'name', 'parent_id'],
    { order: 'name' }
  );

  console.log(`Found ${categories.length} product categories:\n`);

  for (const cat of categories) {
    const parent = cat.parent_id ? ` (parent: ${cat.parent_id[1]})` : '';
    console.log(`  [${cat.id}] ${cat.name}${parent}`);
  }

  // ========================================================================
  // STEP 2: GET ALL ATTRIBUTES IN SYSTEM
  // ========================================================================
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('STEP 2: ATTRIBUTE DISCOVERY');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  const attributes = await odoo.searchRead('product.attribute',
    [],
    ['id', 'name', 'create_variant', 'display_type'],
    { order: 'name' }
  );

  console.log(`Found ${attributes.length} product attributes:\n`);

  for (const attr of attributes) {
    // Get values for this attribute
    const values = await odoo.searchRead('product.attribute.value',
      [['attribute_id', '=', attr.id]],
      ['id', 'name', 'is_custom']
    );
    
    const valueNames = values.map((v: any) => v.name).join(', ');
    console.log(`  [${attr.id}] ${attr.name}`);
    console.log(`      Type: ${attr.display_type || 'radio'} | Variant: ${attr.create_variant}`);
    console.log(`      Values: ${valueNames || 'none'}\n`);
  }

  // ========================================================================
  // STEP 3: GET ITEMS PER CATEGORY WITH ATTRIBUTES
  // ========================================================================
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('STEP 3: ITEMS BY CATEGORY (WITH ATTRIBUTES)');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  // Filter to only relevant categories (those with products)
  for (const cat of categories) {
    const products = await odoo.searchRead('product.template',
      [['categ_id', '=', cat.id], ['active', '=', true]],
      ['id', 'name', 'list_price', 'available_in_pos'],
      { order: 'name' }
    );

    if (products.length === 0) continue;

    console.log(`\n┌─────────────────────────────────────────────────────────────────┐`);
    console.log(`│ CATEGORY: ${cat.name} (ID: ${cat.id})`);
    console.log(`│ Items: ${products.length}`);
    console.log(`└─────────────────────────────────────────────────────────────────┘\n`);

    for (const prod of products) {
      // Get attribute lines for this product
      const attrLines = await odoo.searchRead('product.template.attribute.line',
        [['product_tmpl_id', '=', prod.id]],
        ['id', 'attribute_id', 'value_ids']
      );

      console.log(`  ● ${prod.name}`);
      console.log(`    ID: ${prod.id} | Price: ${prod.list_price} LE | POS: ${prod.available_in_pos ? 'Yes' : 'No'}`);

      if (attrLines.length > 0) {
        console.log(`    Attributes (${attrLines.length}):`);
        for (const line of attrLines) {
          const attrName = line.attribute_id[1];
          
          // Get value names
          const valueIds = line.value_ids || [];
          let valueNames = '';
          if (valueIds.length > 0) {
            const vals = await odoo.searchRead('product.attribute.value',
              [['id', 'in', valueIds]],
              ['id', 'name']
            );
            valueNames = vals.map((v: any) => v.name).join(', ');
          }
          
          console.log(`      - ${attrName}: [${valueNames}]`);
        }
      } else {
        console.log(`    Attributes: None`);
      }
      console.log('');
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('DISCOVERY COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════════\n');
}

discoverPOSStructure().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});

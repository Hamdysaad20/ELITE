import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient.js';
dotenv.config();

async function implementSizeAttributes() {
  const config = getOdooConfigFromEnv();
  if (!config) {
    throw new Error('Odoo configuration not found in environment variables');
  }
  const odoo = new OdooClient(config);

  console.log('🔧 Implementing Size Attributes for Drinks\n');
  console.log('═'.repeat(60));

  // Step 1: Create product attribute "Size"
  console.log('\n📋 Step 1: Creating Size Attribute...\n');

  let sizeAttributeId: number;
  
  // Check if Size attribute already exists
  const existingAttr = await odoo.searchRead('product.attribute', [
    ['name', '=', 'Size'],
  ], ['id', 'name']);

  if (existingAttr.length > 0) {
    sizeAttributeId = existingAttr[0].id;
    console.log(`✓ Size attribute already exists (ID: ${sizeAttributeId})`);
  } else {
    sizeAttributeId = await odoo.rpc('product.attribute', 'create', [{
      name: 'Size',
      display_type: 'radio',
      create_variant: 'always',
    }]);
    console.log(`✓ Created Size attribute (ID: ${sizeAttributeId})`);
  }

  // Step 2: Create attribute values (S, M, L)
  console.log('\n📋 Step 2: Creating Size Values...\n');

  const sizeValues = ['Small', 'Medium', 'Large'];
  const sizeValueIds: Record<string, number> = {};

  for (const sizeName of sizeValues) {
    const existing = await odoo.searchRead('product.attribute.value', [
      ['attribute_id', '=', sizeAttributeId],
      ['name', '=', sizeName],
    ], ['id', 'name']);

    if (existing.length > 0) {
      sizeValueIds[sizeName] = existing[0].id;
      console.log(`✓ ${sizeName} already exists (ID: ${existing[0].id})`);
    } else {
      const valueId = await odoo.rpc('product.attribute.value', 'create', [{
        name: sizeName,
        attribute_id: sizeAttributeId,
      }]);
      sizeValueIds[sizeName] = valueId;
      console.log(`✓ Created ${sizeName} (ID: ${valueId})`);
    }
  }

  // Step 3: Define drinks that should have size variants
  console.log('\n📋 Step 3: Identifying drinks for size variants...\n');

  const drinkPatterns = [
    'Americano',
    'Latte',
    'Cappuccino',
    'Mocha',
    'Espresso',
    'Spanish Latte',
    'Chai Latte',
    'Chocolate',
    'Matcha Latte',
    'Flat White',
    'Cortado',
    'Turkish Coffee',
    'Iced Americano',
    'Iced Latte',
    'Iced Cappuccino',
    'Iced Mocha',
    'Iced Chai Latte',
    'Iced Chocolate',
    'Iced Macchiato',
    'Iced Caramel Macchiato',
  ];

  // Get coffee and iced drink products
  const categories = await odoo.searchRead('product.category', [
    '|', ['name', '=', 'Coffee'], ['name', '=', 'Iced'],
  ], ['id', 'name']);

  const categoryIds = categories.map((c: any) => c.id);

  const products = await odoo.searchRead('product.template', [
    ['categ_id', 'in', categoryIds],
    ['active', '=', true],
  ], ['id', 'name', 'list_price', 'default_code', 'categ_id']);

  // Filter products that match drink patterns and don't already have variants
  const drinksForSize = products.filter((p: any) => {
    const matchesPattern = drinkPatterns.some(pattern => 
      p.name.toLowerCase().includes(pattern.toLowerCase())
    );
    // Exclude products that already have size indicators
    const hasSize = /\b(small|medium|large|s|m|l)\b/i.test(p.name);
    return matchesPattern && !hasSize;
  });

  console.log(`Found ${drinksForSize.length} drinks to add size variants:\n`);
  drinksForSize.forEach((p: any) => {
    console.log(`  - ${p.name} (${p.categ_id[1]})`);
  });

  // Step 4: Add size attribute to products
  console.log('\n📋 Step 4: Adding size attribute to products...\n');

  let successCount = 0;
  let skipCount = 0;

  for (const product of drinksForSize) {
    try {
      // Check if product already has attributes
      const productData = await odoo.searchRead('product.template', [
        ['id', '=', product.id],
      ], ['attribute_line_ids']);

      if (productData[0].attribute_line_ids && productData[0].attribute_line_ids.length > 0) {
        console.log(`⚠️  ${product.name} - Already has attributes, skipping`);
        skipCount++;
        continue;
      }

      // Create attribute line with all size values
      const attributeLineData = {
        attribute_id: sizeAttributeId,
        value_ids: [[6, 0, Object.values(sizeValueIds)]],
      };

      // Update product with attribute line
      await odoo.rpc('product.template', 'write', [[product.id], {
        attribute_line_ids: [[0, 0, attributeLineData]],
      }]);

      console.log(`✅ ${product.name} - Added size variants (S/M/L)`);
      successCount++;

      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error: any) {
      console.log(`❌ ${product.name} - Error: ${error.message}`);
    }
  }

  // Step 5: Configure pricing per size
  console.log('\n📋 Step 5: Price Configuration Info...\n');
  console.log('ℹ️  Size pricing can be configured in Odoo UI:');
  console.log('   - Navigate to Sales > Products > Variants');
  console.log('   - Set different prices for Small/Medium/Large');
  console.log('   - Typical pricing: Small (-10 EGP), Medium (base), Large (+10 EGP)');

  console.log('\n' + '═'.repeat(60));
  console.log('📊 IMPLEMENTATION SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Size Attribute Created: Yes (ID: ${sizeAttributeId})`);
  console.log(`Size Values Created: ${Object.keys(sizeValueIds).length} (Small, Medium, Large)`);
  console.log(`Products Updated: ${successCount}`);
  console.log(`Products Skipped: ${skipCount}`);
  console.log(`Total Drinks Processed: ${drinksForSize.length}`);

  console.log('\n✅ Size attribute implementation complete!');
  console.log('\n💡 Next Steps:');
  console.log('   1. Review variants in Odoo UI');
  console.log('   2. Adjust pricing for each size');
  console.log('   3. Test variant selection in POS');
  console.log('   4. Update frontend to display size options');
}

implementSizeAttributes().catch(console.error);

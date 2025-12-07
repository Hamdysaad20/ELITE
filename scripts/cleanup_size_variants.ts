import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient.js';
dotenv.config();

async function cleanupSizeVariants() {
  const config = getOdooConfigFromEnv();
  if (!config) {
    throw new Error('Odoo configuration not found in environment variables');
  }
  const odoo = new OdooClient(config);

  console.log('🔄 Removing Incorrect Size Variants Implementation\n');
  console.log('═'.repeat(60));

  // Get Size attribute
  const sizeAttr = await odoo.searchRead('product.attribute', [
    ['name', '=', 'Size'],
  ], ['id', 'name']);

  if (sizeAttr.length === 0) {
    console.log('✓ No Size attribute found - nothing to remove');
    return;
  }

  const sizeAttributeId = sizeAttr[0].id;
  console.log(`\nFound Size attribute (ID: ${sizeAttributeId})\n`);

  // Get products with size attribute lines
  const templates = await odoo.searchRead('product.template', [
    ['attribute_line_ids.attribute_id', '=', sizeAttributeId],
  ], ['id', 'name', 'product_variant_ids']);

  console.log(`Found ${templates.length} products with size variants\n`);

  let removedCount = 0;

  for (const template of templates) {
    try {
      console.log(`Processing: ${template.name}...`);

      // Get attribute lines for this product
      const attrLines = await odoo.searchRead('product.template.attribute.line', [
        ['product_tmpl_id', '=', template.id],
        ['attribute_id', '=', sizeAttributeId],
      ], ['id']);

      if (attrLines.length > 0) {
        // Delete the attribute lines (this will remove the variants)
        for (const line of attrLines) {
          await odoo.rpc('product.template.attribute.line', 'unlink', [[line.id]]);
        }
        console.log(`  ✓ Removed size attribute line`);
        removedCount++;
      }

      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error: any) {
      console.log(`  ❌ Error: ${error.message}`);
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('📊 CLEANUP SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Products cleaned: ${removedCount}`);
  console.log(`Size attribute preserved: Yes (for future use)`);
  
  console.log('\n✅ Cleanup complete!');
  console.log('\n💡 Note: Size should be implemented as custom fields or options in POS');
  console.log('   Product variants are for separate SKUs, not size selection.');
}

cleanupSizeVariants().catch(console.error);

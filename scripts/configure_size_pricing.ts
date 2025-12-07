import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient.js';
dotenv.config();

async function configureSizePricing() {
  const config = getOdooConfigFromEnv();
  if (!config) {
    throw new Error('Odoo configuration not found in environment variables');
  }
  const odoo = new OdooClient(config);

  console.log('💰 Configuring Size-Based Pricing\n');
  console.log('═'.repeat(60));

  // Get Size attribute
  const sizeAttr = await odoo.searchRead('product.attribute', [
    ['name', '=', 'Size'],
  ], ['id', 'name']);

  if (sizeAttr.length === 0) {
    console.log('❌ Size attribute not found. Run implement_size_attributes.ts first.');
    return;
  }

  const sizeAttributeId = sizeAttr[0].id;
  console.log(`\n✓ Found Size attribute (ID: ${sizeAttributeId})\n`);

  // Get size values
  const sizeValues = await odoo.searchRead('product.attribute.value', [
    ['attribute_id', '=', sizeAttributeId],
  ], ['id', 'name']);

  const sizeValueMap: Record<string, number> = {};
  sizeValues.forEach((v: any) => {
    sizeValueMap[v.name] = v.id;
  });

  console.log('Size values:');
  Object.entries(sizeValueMap).forEach(([name, id]) => {
    console.log(`  - ${name} (ID: ${id})`);
  });

  // Get all product templates with size attribute
  const templates = await odoo.searchRead('product.template', [
    ['attribute_line_ids.attribute_id', '=', sizeAttributeId],
  ], ['id', 'name', 'list_price', 'product_variant_ids']);

  console.log(`\n\n📋 Found ${templates.length} products with size variants\n`);

  let updatedCount = 0;
  let errorCount = 0;

  for (const template of templates) {
    try {
      const basePrice = template.list_price;
      
      // Get all variants for this template
      const variants = await odoo.searchRead('product.product', [
        ['product_tmpl_id', '=', template.id],
      ], ['id', 'display_name', 'lst_price', 'product_template_attribute_value_ids']);

      console.log(`\n${template.name} (Base: ${basePrice} EGP):`);

      for (const variant of variants) {
        // Get attribute values for this variant
        const attrValues = await odoo.searchRead('product.template.attribute.value', [
          ['id', 'in', variant.product_template_attribute_value_ids],
        ], ['id', 'name', 'product_attribute_value_id']);

        // Find the size attribute value
        const sizeAttrValue = attrValues.find((av: any) => {
          const valueId = Array.isArray(av.product_attribute_value_id) 
            ? av.product_attribute_value_id[0] 
            : av.product_attribute_value_id;
          return Object.values(sizeValueMap).includes(valueId);
        });

        if (sizeAttrValue) {
          const valueId = Array.isArray(sizeAttrValue.product_attribute_value_id) 
            ? sizeAttrValue.product_attribute_value_id[0] 
            : sizeAttrValue.product_attribute_value_id;
          
          const sizeName = Object.entries(sizeValueMap).find(([_, id]) => id === valueId)?.[0];
          
          // Calculate price based on size
          let newPrice = basePrice;
          if (sizeName === 'Small') {
            newPrice = basePrice - 10; // Small is -10 EGP
          } else if (sizeName === 'Medium') {
            newPrice = basePrice; // Medium is base price
          } else if (sizeName === 'Large') {
            newPrice = basePrice + 10; // Large is +10 EGP
          }

          // Update variant price if different
          if (variant.lst_price !== newPrice) {
            await odoo.rpc('product.product', 'write', [[variant.id], {
              lst_price: newPrice,
            }]);
            console.log(`  ✓ ${sizeName}: ${variant.lst_price} → ${newPrice} EGP`);
            updatedCount++;
          } else {
            console.log(`  - ${sizeName}: ${newPrice} EGP (unchanged)`);
          }
        }
      }

      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 300));

    } catch (error: any) {
      console.log(`  ❌ Error: ${error.message}`);
      errorCount++;
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('📊 PRICING UPDATE SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Products Processed: ${templates.length}`);
  console.log(`Variants Updated: ${updatedCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log('\nPricing Strategy:');
  console.log('  Small:  Base Price - 10 EGP');
  console.log('  Medium: Base Price');
  console.log('  Large:  Base Price + 10 EGP');

  console.log('\n✅ Size-based pricing configuration complete!');
}

configureSizePricing().catch(console.error);

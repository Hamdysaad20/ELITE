import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient.js';
dotenv.config();

async function verifyAttributeImplementation() {
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  config.timeoutMs = 60000;
  const odoo = new OdooClient(config);

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         ATTRIBUTE IMPLEMENTATION VERIFICATION              ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // 1. Check all attributes
  const attributes = await odoo.searchRead('product.attribute', [
    ['id', 'in', [38, 39, 40, 42, 43, 44, 45, 46, 47, 48, 31, 11, 32, 10]]
  ], ['id', 'name', 'create_variant', 'display_type']);

  console.log('📋 CONFIGURED ATTRIBUTES');
  console.log('='.repeat(60));
  attributes.forEach((attr: any) => {
    const variant = attr.create_variant === 'no_variant' ? '✅' : '⚠️';
    const display = attr.display_type === 'radio' ? 'Radio' : attr.display_type === 'multi' ? 'Multi' : attr.display_type;
    console.log(`${variant} ${attr.name} (ID: ${attr.id}) - ${display}`);
  });

  // 2. Check products with attributes by category
  const categories = ['Coffee', 'Tea', 'Iced', 'Frappe', 'Milkshake', 'Smoothie', 'Soda', 'Food'];
  
  console.log('\n\n📊 PRODUCTS WITH ATTRIBUTES BY CATEGORY');
  console.log('='.repeat(60));

  for (const catName of categories) {
    const products = await odoo.searchRead('product.template', [
      ['categ_id.name', '=', catName],
      ['active', '=', true]
    ], ['id', 'name']);

    if (products.length === 0) continue;

    const attrLines = await odoo.searchRead('product.template.attribute.line', [
      ['product_tmpl_id', 'in', products.map((p: any) => p.id)]
    ], ['id', 'product_tmpl_id', 'attribute_id']);

    const productAttrMap: Record<number, Set<string>> = {};
    for (const line of attrLines) {
      const prodId = Array.isArray(line.product_tmpl_id) ? line.product_tmpl_id[0] : line.product_tmpl_id;
      const attrName = Array.isArray(line.attribute_id) ? line.attribute_id[1] : 'Unknown';
      
      if (!productAttrMap[prodId]) productAttrMap[prodId] = new Set();
      productAttrMap[prodId].add(attrName);
    }

    console.log(`\n${catName.toUpperCase()} (${products.length} products):`);
    console.log('-'.repeat(60));

    // Count attributes across products
    const attrCounts: Record<string, number> = {};
    Object.values(productAttrMap).forEach(attrs => {
      attrs.forEach(attr => {
        attrCounts[attr] = (attrCounts[attr] || 0) + 1;
      });
    });

    if (Object.keys(attrCounts).length === 0) {
      console.log('  No attributes applied');
    } else {
      Object.entries(attrCounts).forEach(([attr, count]) => {
        console.log(`  ${attr}: ${count}/${products.length} products`);
      });
    }

    // Show sample products with their attributes
    const sampleProducts = products.slice(0, 3);
    console.log('\n  Sample Products:');
    sampleProducts.forEach((p: any) => {
      const attrs = productAttrMap[p.id];
      if (attrs && attrs.size > 0) {
        console.log(`    • ${p.name}: [${Array.from(attrs).join(', ')}]`);
      } else {
        console.log(`    • ${p.name}: [No attributes]`);
      }
    });
  }

  // 3. Special check: Espresso
  console.log('\n\n🎯 ESPRESSO VERIFICATION');
  console.log('='.repeat(60));
  
  const espresso = await odoo.searchRead('product.template', [
    ['name', '=', 'Espresso'],
    ['active', '=', true]
  ], ['id', 'name', 'list_price']);

  if (espresso.length > 0) {
    const espressoAttrs = await odoo.searchRead('product.template.attribute.line', [
      ['product_tmpl_id', '=', espresso[0].id]
    ], ['id', 'attribute_id']);

    console.log(`Product: ${espresso[0].name} (ID: ${espresso[0].id})`);
    console.log(`Base Price: ${espresso[0].list_price} EGP`);
    console.log(`Attributes: ${espressoAttrs.length}`);
    
    espressoAttrs.forEach((line: any) => {
      const attrName = Array.isArray(line.attribute_id) ? line.attribute_id[1] : line.attribute_id;
      console.log(`  • ${attrName}`);
    });

    // Check if Shots attribute is there
    const hasShotsAttr = espressoAttrs.some((line: any) => {
      const attrName = Array.isArray(line.attribute_id) ? line.attribute_id[1] : '';
      return attrName === 'Shots';
    });

    if (hasShotsAttr) {
      console.log('\n✅ Espresso has Shots attribute configured!');
      
      // Get pricing details
      const ptavs = await odoo.searchRead('product.template.attribute.value', [
        ['product_tmpl_id', '=', espresso[0].id],
        ['attribute_id.name', '=', 'Shots']
      ], ['product_attribute_value_id', 'price_extra']);

      console.log('\nShots Pricing:');
      ptavs.forEach((ptav: any) => {
        const valueName = Array.isArray(ptav.product_attribute_value_id) 
          ? ptav.product_attribute_value_id[1] 
          : 'Unknown';
        const totalPrice = espresso[0].list_price + ptav.price_extra;
        console.log(`  ${valueName}: ${totalPrice} EGP (base + ${ptav.price_extra})`);
      });
    } else {
      console.log('\n⚠️  Espresso missing Shots attribute');
    }
  } else {
    console.log('❌ Espresso product not found');
  }

  // 4. Check Espresso Double (should be archived)
  const espressoDouble = await odoo.searchRead('product.template', [
    ['name', '=', 'Espresso Double ']
  ], ['id', 'name', 'active']);

  console.log('\n\n🔍 ESPRESSO DOUBLE CHECK');
  console.log('='.repeat(60));
  if (espressoDouble.length > 0) {
    console.log(`Found: ${espressoDouble[0].name} (ID: ${espressoDouble[0].id})`);
    console.log(`Status: ${espressoDouble[0].active ? '⚠️  Still Active' : '✅ Archived'}`);
  } else {
    console.log('✅ Espresso Double not found (archived or removed)');
  }

  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║              VERIFICATION COMPLETE                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
}

verifyAttributeImplementation().catch(console.error);

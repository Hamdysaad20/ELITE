/**
 * POS Menu Refinement - Coffee Category (ID: 15)
 * 
 * ISSUES IDENTIFIED:
 * 1. Inconsistent Sugar Level values (should be Franco-style)
 * 2. Duplicate size attributes (size: L/S/M vs Size: Small/Medium/Large)
 * 3. Missing Sugar Level on some items
 * 
 * FRANCO-STYLE SUGAR LEVELS:
 * - Sada (0 sugar)
 * - Alriha (light)
 * - Mazboot (balanced)
 * - Mano (1.5)
 * - Zeyada (sweet)
 * - Seryaosy (extra sweet)
 */

import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient';

dotenv.config();

const COFFEE_CATEGORY_ID = 15;
let client: any;

// Franco-style sugar levels
const FRANCO_SUGAR_LEVELS = [
  'Sada',
  'Alriha', 
  'Mazboot',
  'Mano',
  'Zeyada',
  'Seryaosy'
];

// Items that need Sugar Level attribute added (from discovery)
const ITEMS_NEED_SUGAR = [
  { id: 851, name: 'Americano' },
  { id: 844, name: 'Cortado' },
  { id: 845, name: 'Flat White' },
  { id: 846, name: 'Turkish Coffee' },
  { id: 847, name: 'French Coffee' },
];

// Items with wrong sugar values that need fixing
const ITEMS_WITH_WRONG_SUGAR = [
  { id: 690, name: 'Café Latte' },
  { id: 691, name: 'Cappuccino' },
  { id: 768, name: 'Caffè Mocha' },
  { id: 634, name: 'Caramel Macchiato' },
  { id: 766, name: 'Espresso' },
  { id: 692, name: 'Spanish Latte' },
  // Add more as needed
];

async function getOrCreateAttribute(name: string): Promise<number> {
  // Search for existing attribute
  const existing = await client.searchRead('product.attribute', [['name', '=', name]], ['id']);
  if (existing.length > 0) {
    return existing[0].id;
  }
  
  // Create new attribute
  const newId = await client.rpc('product.attribute', 'create', [{ name, create_variant: 'no_variant', display_type: 'radio' }]);
  console.log(`  ✅ Created attribute: ${name} (ID: ${newId})`);
  return newId;
}

async function getOrCreateAttributeValue(attrId: number, valueName: string): Promise<number> {
  // Search for existing value
  const existing = await client.searchRead(
    'product.attribute.value',
    [['attribute_id', '=', attrId], ['name', '=', valueName]],
    ['id']
  );
  if (existing.length > 0) {
    return existing[0].id;
  }
  
  // Create new value
  const newId = await client.rpc('product.attribute.value', 'create', [{ name: valueName, attribute_id: attrId }]);
  console.log(`    ✅ Created value: ${valueName} (ID: ${newId})`);
  return newId;
}

async function addSugarLevelToItem(productId: number, productName: string) {
  console.log(`\n📝 Adding Sugar Level to: ${productName} (ID: ${productId})`);
  
  // Get or create Sugar Level attribute
  const sugarAttrId = await getOrCreateAttribute('Sugar Level');
  
  // Get or create Franco-style values
  const valueIds: number[] = [];
  for (const level of FRANCO_SUGAR_LEVELS) {
    const valueId = await getOrCreateAttributeValue(sugarAttrId, level);
    valueIds.push(valueId);
  }
  
  // Check if product already has Sugar Level
  const existingLines = await client.searchRead(
    'product.template.attribute.line',
    [['product_tmpl_id', '=', productId], ['attribute_id', '=', sugarAttrId]],
    ['id', 'value_ids']
  );
  
  if (existingLines.length > 0) {
    console.log(`  ⚠️ Product already has Sugar Level, updating values...`);
    await client.rpc('product.template.attribute.line', 'write', [[existingLines[0].id], { value_ids: [[6, 0, valueIds]] }]);
  } else {
    // Create new attribute line
    await client.rpc('product.template.attribute.line', 'create', [{
      product_tmpl_id: productId,
      attribute_id: sugarAttrId,
      value_ids: [[6, 0, valueIds]]
    }]);
  }
  
  console.log(`  ✅ Sugar Level added with Franco-style values`);
}

async function fixSugarLevelValues(productId: number, productName: string) {
  console.log(`\n🔧 Fixing Sugar Level on: ${productName} (ID: ${productId})`);
  
  // Get Sugar Level attribute
  const sugarAttr = await client.searchRead(
    'product.attribute',
    [['name', '=', 'Sugar Level']],
    ['id']
  );
  
  if (sugarAttr.length === 0) {
    console.log(`  ❌ Sugar Level attribute not found!`);
    return;
  }
  const sugarAttrId = sugarAttr[0].id;
  
  // Get Franco-style values
  const valueIds: number[] = [];
  for (const level of FRANCO_SUGAR_LEVELS) {
    const valueId = await getOrCreateAttributeValue(sugarAttrId, level);
    valueIds.push(valueId);
  }
  
  // Find the attribute line for this product
  const existingLines = await client.searchRead(
    'product.template.attribute.line',
    [['product_tmpl_id', '=', productId], ['attribute_id', '=', sugarAttrId]],
    ['id', 'value_ids']
  );
  
  if (existingLines.length > 0) {
    await client.rpc('product.template.attribute.line', 'write', [[existingLines[0].id], { value_ids: [[6, 0, valueIds]] }]);
    console.log(`  ✅ Updated to Franco-style values: ${FRANCO_SUGAR_LEVELS.join(', ')}`);
  } else {
    console.log(`  ⚠️ No Sugar Level attribute found on product`);
  }
}

async function removeDuplicateSizeAttribute(productId: number, productName: string) {
  console.log(`\n🔧 Checking duplicate size on: ${productName} (ID: ${productId})`);
  
  // Get both size attributes
  const sizeAttrs = await client.searchRead(
    'product.attribute',
    [['name', 'in', ['size', 'Size']]],
    ['id', 'name']
  );
  
  if (sizeAttrs.length < 2) {
    console.log(`  ℹ️ No duplicate size attributes found`);
    return;
  }
  
  // Find lowercase 'size' attribute
  const lowercaseSize = sizeAttrs.find((a: any) => a.name === 'size');
  if (!lowercaseSize) return;
  
  // Check if product has this attribute
  const existingLines = await client.searchRead(
    'product.template.attribute.line',
    [['product_tmpl_id', '=', productId], ['attribute_id', '=', lowercaseSize.id]],
    ['id']
  );
  
  if (existingLines.length > 0) {
    await client.rpc('product.template.attribute.line', 'unlink', [[existingLines[0].id]]);
    console.log(`  ✅ Removed duplicate lowercase 'size' attribute`);
  }
}

async function verifyItem(productId: number, productName: string) {
  console.log(`\n✔️  Verifying: ${productName} (ID: ${productId})`);
  
  // Get attribute lines
  const attrLines = await client.searchRead(
    'product.template.attribute.line',
    [['product_tmpl_id', '=', productId]],
    ['attribute_id', 'value_ids']
  );
  
  for (const line of attrLines) {
    const attr = await client.searchRead(
      'product.attribute',
      [['id', '=', line.attribute_id[0]]],
      ['name']
    );
    const values = await client.searchRead(
      'product.attribute.value',
      [['id', 'in', line.value_ids]],
      ['name']
    );
    console.log(`  - ${attr[0].name}: [${values.map((v: any) => v.name).join(', ')}]`);
  }
}

async function main() {
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  config.timeoutMs = 180000;
  
  client = new OdooClient(config) as any;
  
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('☕ COFFEE CATEGORY FIX - PHASE 1: Add Sugar Level to Missing Items');
  console.log('═══════════════════════════════════════════════════════════════════');
  
  // Step 1: Add Sugar Level to items that are missing it
  for (const item of ITEMS_NEED_SUGAR) {
    await addSugarLevelToItem(item.id, item.name);
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('☕ COFFEE CATEGORY FIX - PHASE 2: Fix Wrong Sugar Values');
  console.log('═══════════════════════════════════════════════════════════════════');
  
  // Step 2: Fix items with wrong sugar level values
  for (const item of ITEMS_WITH_WRONG_SUGAR) {
    await fixSugarLevelValues(item.id, item.name);
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('☕ COFFEE CATEGORY FIX - PHASE 3: Remove Duplicate Size Attributes');
  console.log('═══════════════════════════════════════════════════════════════════');
  
  // Get all coffee items
  const coffeeItems = await client.searchRead(
    'product.template',
    [['pos_categ_ids', 'in', [COFFEE_CATEGORY_ID]], ['available_in_pos', '=', true]],
    ['id', 'name']
  );
  
  for (const item of coffeeItems) {
    await removeDuplicateSizeAttribute(item.id, item.name);
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('☕ VERIFICATION - Coffee Items After Fix');
  console.log('═══════════════════════════════════════════════════════════════════');
  
  // Verify key items
  const itemsToVerify = [...ITEMS_NEED_SUGAR, ...ITEMS_WITH_WRONG_SUGAR.slice(0, 3)];
  for (const item of itemsToVerify) {
    await verifyItem(item.id, item.name);
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('✅ COFFEE CATEGORY FIX COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════════');
}

main().catch(console.error);

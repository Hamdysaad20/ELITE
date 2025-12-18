/**
 * POS Menu Refinement - Iced Category (ID: 18)
 * 
 * ISSUES FROM DISCOVERY:
 * 1. Iced Cappuccino & Iced Latte have corrupted Sugar Level values (mix of old and Franco-style)
 * 2. Items have inconsistent attributes (some have more than needed)
 * 3. All should have: Ice Level, Size, Milk Options
 * 4. Sugar Level should use Franco-style only
 * 
 * ITEMS TO PROCESS:
 * - Iced Cappuccino (830) - Fix Sugar Level
 * - Iced Latte (829) - Fix Sugar Level
 * - All others - Verify consistency
 */

import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient';

dotenv.config();

const ICED_CATEGORY_ID = 18;
let client: any;

const FRANCO_SUGAR_LEVELS = ['Sada', 'Alriha', 'Mazboot', 'Mano', 'Zeyada', 'Seryaosy'];

async function getAttributeId(name: string): Promise<number | null> {
  const attr = await client.searchRead('product.attribute', [['name', '=', name]], ['id']);
  return attr.length > 0 ? attr[0].id : null;
}

async function getOrCreateAttributeValue(attrId: number, valueName: string): Promise<number> {
  const existing = await client.searchRead(
    'product.attribute.value',
    [['attribute_id', '=', attrId], ['name', '=', valueName]],
    ['id']
  );
  if (existing.length > 0) return existing[0].id;
  
  const newId = await client.rpc('product.attribute.value', 'create', [{ name: valueName, attribute_id: attrId }]);
  console.log(`    ✅ Created value: ${valueName}`);
  return newId;
}

async function fixSugarLevel(productId: number, productName: string) {
  console.log(`\n🔧 Fixing Sugar Level: ${productName} (ID: ${productId})`);
  
  const sugarAttrId = await getAttributeId('Sugar Level');
  if (!sugarAttrId) {
    console.log(`  ❌ Sugar Level attribute not found`);
    return;
  }
  
  // Get Franco-style values
  const valueIds: number[] = [];
  for (const level of FRANCO_SUGAR_LEVELS) {
    const valueId = await getOrCreateAttributeValue(sugarAttrId, level);
    valueIds.push(valueId);
  }
  
  // Find existing line
  const lines = await client.searchRead(
    'product.template.attribute.line',
    [['product_tmpl_id', '=', productId], ['attribute_id', '=', sugarAttrId]],
    ['id']
  );
  
  if (lines.length > 0) {
    await client.rpc('product.template.attribute.line', 'write', [[lines[0].id], { value_ids: [[6, 0, valueIds]] }]);
    console.log(`  ✅ Updated to Franco-style: ${FRANCO_SUGAR_LEVELS.join(', ')}`);
  } else {
    console.log(`  ⚠️ No Sugar Level attribute found`);
  }
}

async function removeAttribute(productId: number, productName: string, attrName: string) {
  console.log(`\n🗑️  Removing ${attrName} from: ${productName}`);
  
  const attrId = await getAttributeId(attrName);
  if (!attrId) {
    console.log(`  ℹ️ Attribute ${attrName} not found in system`);
    return;
  }
  
  const lines = await client.searchRead(
    'product.template.attribute.line',
    [['product_tmpl_id', '=', productId], ['attribute_id', '=', attrId]],
    ['id']
  );
  
  if (lines.length > 0) {
    await client.rpc('product.template.attribute.line', 'unlink', [[lines[0].id]]);
    console.log(`  ✅ Removed ${attrName}`);
  } else {
    console.log(`  ℹ️ ${attrName} not present on product`);
  }
}

async function removeDuplicateSizeAttributes(productId: number, productName: string) {
  console.log(`\n🔧 Checking duplicate sizes: ${productName}`);
  
  // Get both size attributes
  const sizeAttrs = await client.searchRead(
    'product.attribute',
    [['name', 'in', ['size', 'Size']]],
    ['id', 'name']
  );
  
  if (sizeAttrs.length < 2) {
    console.log(`  ℹ️ No duplicate found`);
    return;
  }
  
  // Remove lowercase 'size' if both exist
  const lowercaseSize = sizeAttrs.find((a: any) => a.name === 'size');
  if (!lowercaseSize) return;
  
  const lines = await client.searchRead(
    'product.template.attribute.line',
    [['product_tmpl_id', '=', productId], ['attribute_id', '=', lowercaseSize.id]],
    ['id']
  );
  
  if (lines.length > 0) {
    await client.rpc('product.template.attribute.line', 'unlink', [[lines[0].id]]);
    console.log(`  ✅ Removed duplicate lowercase 'size'`);
  }
}

async function verifyItem(productId: number, productName: string) {
  console.log(`\n✔️  ${productName} (ID: ${productId})`);
  
  const attrLines = await client.searchRead(
    'product.template.attribute.line',
    [['product_tmpl_id', '=', productId]],
    ['attribute_id', 'value_ids']
  );
  
  for (const line of attrLines) {
    const attr = await client.searchRead('product.attribute', [['id', '=', line.attribute_id[0]]], ['name']);
    const values = await client.searchRead('product.attribute.value', [['id', 'in', line.value_ids]], ['name']);
    console.log(`  - ${attr[0].name}: [${values.map((v: any) => v.name).join(', ')}]`);
  }
}

async function main() {
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  config.timeoutMs = 180000;
  
  client = new OdooClient(config) as any;
  
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('❄️  ICED CATEGORY FIX - Fix Corrupted Sugar Levels');
  console.log('═══════════════════════════════════════════════════════════════════');
  
  // Fix items with corrupted sugar values
  await fixSugarLevel(830, 'Iced Cappuccino');
  await fixSugarLevel(829, 'Iced Latte');
  
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('❄️  ICED CATEGORY FIX - Remove Duplicate Size Attributes');
  console.log('═══════════════════════════════════════════════════════════════════');
  
  // Get all iced items
  const icedItems = await client.searchRead(
    'product.template',
    [['pos_categ_ids', 'in', [ICED_CATEGORY_ID]], ['available_in_pos', '=', true]],
    ['id', 'name']
  );
  
  for (const item of icedItems) {
    await removeDuplicateSizeAttributes(item.id, item.name);
  }
  
  // Clean up unusual attributes from specific items
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('❄️  ICED CATEGORY FIX - Remove Unnecessary Attributes');
  console.log('═══════════════════════════════════════════════════════════════════');
  
  // Ice Flavors (776) has size + Sugar + Flavor + Temperature - keep all as it's customizable
  // Remove Temperature from standard iced drinks as they're always iced
  const itemsToClean = [
    { id: 830, name: 'Iced Cappuccino' },
    { id: 829, name: 'Iced Latte' },
  ];
  
  for (const item of itemsToClean) {
    await removeAttribute(item.id, item.name, 'Temperature');
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('❄️  VERIFICATION - Key Iced Items');
  console.log('═══════════════════════════════════════════════════════════════════');
  
  await verifyItem(830, 'Iced Cappuccino');
  await verifyItem(829, 'Iced Latte');
  await verifyItem(836, 'Iced Americano');
  await verifyItem(632, 'Iced Caramel Macchiato');
  
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('✅ ICED CATEGORY FIX COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════════');
}

main().catch(console.error);

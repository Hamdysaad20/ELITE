/**
 * POS Quick Fix - Multiple Categories
 * Rapid fixes for Tea, Frappe, Smoothie, Soda categories
 */

import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient';

dotenv.config();

let client: any;
const FRANCO_SUGAR = ['Sada', 'Alriha', 'Mazboot', 'Mano', 'Zeyada', 'Seryaosy'];

async function getAttrId(name: string): Promise<number | null> {
  const attr = await client.searchRead('product.attribute', [['name', '=', name]], ['id']);
  return attr.length > 0 ? attr[0].id : null;
}

async function getOrCreateValue(attrId: number, name: string): Promise<number> {
  const existing = await client.searchRead('product.attribute.value', [['attribute_id', '=', attrId], ['name', '=', name]], ['id']);
  if (existing.length > 0) return existing[0].id;
  return await client.rpc('product.attribute.value', 'create', [{ name, attribute_id: attrId }]);
}

async function fixSugar(productId: number, name: string) {
  console.log(`\n🔧 ${name} (${productId})`);
  const sugarAttrId = await getAttrId('Sugar Level');
  if (!sugarAttrId) return;
  
  const valueIds = await Promise.all(FRANCO_SUGAR.map(v => getOrCreateValue(sugarAttrId, v)));
  const lines = await client.searchRead('product.template.attribute.line', [['product_tmpl_id', '=', productId], ['attribute_id', '=', sugarAttrId]], ['id']);
  
  if (lines.length > 0) {
    await client.rpc('product.template.attribute.line', 'write', [[lines[0].id], { value_ids: [[6, 0, valueIds]] }]);
    console.log(`  ✅ Sugar fixed`);
  }
}

async function main() {
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo config not found');
  config.timeoutMs = 300000;
  client = new OdooClient(config) as any;
  
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('🍵 TEA CATEGORY - Fix Sugar Levels');
  console.log('═══════════════════════════════════════════════════════════════════');
  
  // Tea items with wrong sugar
  await fixSugar(680, 'Classic Teas');
  await fixSugar(771, 'Hibiscus');
  await fixSugar(696, 'Karak Chai');
  await fixSugar(783, 'Morning Bird Offer Chai Latte');
  await fixSugar(775, 'Chai Flavours');
  
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('✅ QUICK FIX COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════════');
}

main().catch(console.error);

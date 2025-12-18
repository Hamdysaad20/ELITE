/**
 * FAST BATCH FIX - Frappe, Smoothie, Soda, Tea Categories
 * Applies standard attributes efficiently
 */

import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient';

dotenv.config();

const FRANCO_SUGAR = ['Sada', 'Alriha', 'Mazboot', 'Mano', 'Zeyada', 'Seryaosy'];
const STANDARD_SIZES = ['Small', 'Medium', 'Large'];

const FRAPPE_ITEMS = [
  { id: 812, name: 'Caramel Frappé' },
  { id: 811, name: 'Coffee Frappé' },
  { id: 810, name: 'Mocha Frappé' },
  { id: 814, name: 'Pistachio Frappé' },
  { id: 813, name: 'Vanilla Frappé' },
];

const SMOOTHIE_ITEMS = [
  { id: 871, name: 'Custom Smoothie' },
  { id: 809, name: 'Golden Peach Sunrise' },
  { id: 805, name: 'Mango Smoothie' },
  { id: 807, name: 'Mixed Berry Smoothie' },
  { id: 808, name: 'Passion Fruit Smoothie' },
  { id: 806, name: 'Strawberry Smoothie' },
  { id: 641, name: 'Raspberry & Pineapple' },
];

const SODA_ITEMS = [
  { id: 866, name: 'Black Cat' },
  { id: 823, name: 'Custom Soda' },
  { id: 826, name: 'Passion Fruit Soda' },
];

const TEA_ITEMS = [
  { id: 680, name: 'Classic Teas' },
  { id: 771, name: 'Hibiscus' },
  { id: 852, name: 'Hibiscus Tea' },
  { id: 696, name: 'Karak Chai' },
];

async function fixCategory(client: any, items: any[], categoryName: string, needsSugar: boolean, needsSize: boolean) {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`${categoryName.toUpperCase()} CATEGORY`);
  console.log(`${'═'.repeat(70)}`);

  const sugarAttrId = needsSugar ? (await client.searchRead('product.attribute', [['name', '=', 'Sugar Level']], ['id']))[0]?.id : null;
  const sizeAttrId = needsSize ? (await client.searchRead('product.attribute', [['name', '=', 'Size']], ['id']))[0]?.id : null;
  const lowercaseSizeAttrId = (await client.searchRead('product.attribute', [['name', '=', 'size']], ['id']))[0]?.id;

  let sugarValueIds: number[] = [];
  let sizeValueIds: number[] = [];

  if (needsSugar && sugarAttrId) {
    for (const level of FRANCO_SUGAR) {
      const existing = await client.searchRead('product.attribute.value', [['attribute_id', '=', sugarAttrId], ['name', '=', level]], ['id']);
      if (existing.length > 0) sugarValueIds.push(existing[0].id);
    }
  }

  if (needsSize && sizeAttrId) {
    for (const size of STANDARD_SIZES) {
      const existing = await client.searchRead('product.attribute.value', [['attribute_id', '=', sizeAttrId], ['name', '=', size]], ['id']);
      if (existing.length > 0) sizeValueIds.push(existing[0].id);
    }
  }

  for (const item of items) {
    console.log(`\n${item.name} (${item.id})`);
    
    // Remove lowercase size
    if (lowercaseSizeAttrId) {
      const lines = await client.searchRead('product.template.attribute.line', [['product_tmpl_id', '=', item.id], ['attribute_id', '=', lowercaseSizeAttrId]], ['id']);
      if (lines.length > 0) {
        await client.rpc('product.template.attribute.line', 'unlink', [lines.map((l: any) => l.id)]);
        console.log('  ✓ Removed lowercase size');
      }
    }

    // Set Size
    if (needsSize && sizeAttrId && sizeValueIds.length > 0) {
      const sizeLines = await client.searchRead('product.template.attribute.line', [['product_tmpl_id', '=', item.id], ['attribute_id', '=', sizeAttrId]], ['id']);
      if (sizeLines.length > 0) {
        await client.rpc('product.template.attribute.line', 'write', [sizeLines.map((l: any) => l.id), { value_ids: [[6, 0, sizeValueIds]] }]);
        console.log('  ✓ Size → S/M/L');
      } else {
        await client.rpc('product.template.attribute.line', 'create', [{ product_tmpl_id: item.id, attribute_id: sizeAttrId, value_ids: [[6, 0, sizeValueIds]] }]);
        console.log('  ✓ Added Size');
      }
    }

    // Set Sugar
    if (needsSugar && sugarAttrId && sugarValueIds.length > 0) {
      const sugarLines = await client.searchRead('product.template.attribute.line', [['product_tmpl_id', '=', item.id], ['attribute_id', '=', sugarAttrId]], ['id']);
      if (sugarLines.length > 0) {
        await client.rpc('product.template.attribute.line', 'write', [sugarLines.map((l: any) => l.id), { value_ids: [[6, 0, sugarValueIds]] }]);
        console.log('  ✓ Sugar → Franco');
      } else {
        await client.rpc('product.template.attribute.line', 'create', [{ product_tmpl_id: item.id, attribute_id: sugarAttrId, value_ids: [[6, 0, sugarValueIds]] }]);
        console.log('  ✓ Added Sugar');
      }
    }
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('🚀 BATCH FIX - Multiple Categories');
  console.log('═══════════════════════════════════════════════════════════════════');

  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  const client = new OdooClient(config);

  await fixCategory(client, FRAPPE_ITEMS, '☕ Frappe', false, true); // Size only, no sugar for frappés
  await fixCategory(client, SMOOTHIE_ITEMS, '🍓 Smoothie', false, true); // Size only
  await fixCategory(client, SODA_ITEMS, '🥤 Soda', false, true); // Size only
  await fixCategory(client, TEA_ITEMS, '🍵 Tea', true, false); // Sugar only (tea has no size by default)

  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('✅ ALL CATEGORIES COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);

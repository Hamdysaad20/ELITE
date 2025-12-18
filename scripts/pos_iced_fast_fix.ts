/**
 * ICED CATEGORY - Fast Processing
 * Process only true iced drinks from category 18
 */

import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient';

dotenv.config();

const FRANCO_SUGAR = ['Sada', 'Alriha', 'Mazboot', 'Mano', 'Zeyada', 'Seryaosy'];
const STANDARD_SIZES = ['Small', 'Medium', 'Large'];

// TRUE ICED ITEMS FROM DISCOVERY (Category 18)
const ICED_ITEMS = [
  { id: 836, name: 'Iced Americano' },
  { id: 830, name: 'Iced Cappuccino' },
  { id: 632, name: 'Iced Caramel Macchiato' },
  { id: 832, name: 'Iced Chai Latte' },
  { id: 834, name: 'Iced Chocolate' },
  { id: 829, name: 'Iced Latte' },
  { id: 864, name: 'Iced Lemon' },
  { id: 831, name: 'Iced Mocha' },
  { id: 865, name: 'Icee Chocolate' },
  { id: 835, name: 'Matcha Latte (Iced)' },
  { id: 833, name: 'Spanish Latte (Iced)' },
  { id: 838, name: 'Strawberry Matcha Latte' },
  { id: 867, name: 'BOBA Chocolate' },
  { id: 868, name: 'BOBA Spanish Latte' },
  { id: 869, name: 'Brown Sugar BOBA/Bubble [Classic]' },
  { id: 870, name: '[Taro] Boba/Bubble' },
  { id: 776, name: 'Ice Flavors' }, // Has wrong attributes
];

async function main() {
  console.log('🧊 ICED CATEGORY - FAST FIX');
  
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  const client = new OdooClient(config);

  const sugarAttrId = (await client.searchRead('product.attribute', [['name', '=', 'Sugar Level']], ['id']))[0]?.id;
  const sizeAttrId = (await client.searchRead('product.attribute', [['name', '=', 'Size']], ['id']))[0]?.id;
  const lowercaseSizeAttrId = (await client.searchRead('product.attribute', [['name', '=', 'size']], ['id']))[0]?.id;

  if (!sugarAttrId || !sizeAttrId) {
    console.error('❌ Required attributes not found');
    return;
  }

  const sugarValueIds: number[] = [];
  for (const level of FRANCO_SUGAR) {
    const existing = await client.searchRead('product.attribute.value', [['attribute_id', '=', sugarAttrId], ['name', '=', level]], ['id']);
    if (existing.length > 0) sugarValueIds.push(existing[0].id);
  }

  const sizeValueIds: number[] = [];
  for (const size of STANDARD_SIZES) {
    const existing = await client.searchRead('product.attribute.value', [['attribute_id', '=', sizeAttrId], ['name', '=', size]], ['id']);
    if (existing.length > 0) sizeValueIds.push(existing[0].id);
  }

  for (const item of ICED_ITEMS) {
    console.log(`\n━━━ ${item.name} (${item.id})`);
    
    // Remove lowercase size if exists
    if (lowercaseSizeAttrId) {
      const lines = await client.searchRead('product.template.attribute.line', [['product_tmpl_id', '=', item.id], ['attribute_id', '=', lowercaseSizeAttrId]], ['id']);
      if (lines.length > 0) {
        await client.rpc('product.template.attribute.line', 'unlink', [lines.map((l: any) => l.id)]);
        console.log('  ✓ Removed lowercase size');
      }
    }

    // Set Size
    const sizeLines = await client.searchRead('product.template.attribute.line', [['product_tmpl_id', '=', item.id], ['attribute_id', '=', sizeAttrId]], ['id']);
    if (sizeLines.length > 0) {
      await client.rpc('product.template.attribute.line', 'write', [sizeLines.map((l: any) => l.id), { value_ids: [[6, 0, sizeValueIds]] }]);
      console.log('  ✓ Updated Size');
    } else {
      await client.rpc('product.template.attribute.line', 'create', [{ product_tmpl_id: item.id, attribute_id: sizeAttrId, value_ids: [[6, 0, sizeValueIds]] }]);
      console.log('  ✓ Added Size');
    }

    // Set Sugar
    const sugarLines = await client.searchRead('product.template.attribute.line', [['product_tmpl_id', '=', item.id], ['attribute_id', '=', sugarAttrId]], ['id']);
    if (sugarLines.length > 0) {
      await client.rpc('product.template.attribute.line', 'write', [sugarLines.map((l: any) => l.id), { value_ids: [[6, 0, sugarValueIds]] }]);
      console.log('  ✓ Updated Sugar');
    } else {
      await client.rpc('product.template.attribute.line', 'create', [{ product_tmpl_id: item.id, attribute_id: sugarAttrId, value_ids: [[6, 0, sugarValueIds]] }]);
      console.log('  ✓ Added Sugar');
    }
  }

  console.log('\n✅ ICED CATEGORY COMPLETE\n');
}

main().catch(console.error);

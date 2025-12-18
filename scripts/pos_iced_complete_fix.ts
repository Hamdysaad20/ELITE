/**
 * COMPLETE ICED CATEGORY REFINEMENT
 * Category ID: 18 (17 items)
 * 
 * KEY REQUIREMENTS:
 * - All iced drinks have Franco sugar (Sada/Alriha/Mazboot/Mano/Zeyada/Seryaosy)
 * - Standard sizes (Small/Medium/Large)
 * - Ice Level attribute preserved
 * - Milk Options preserved where applicable
 */

import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient';

dotenv.config();

const ICED_CATEGORY_ID = 18;
const FRANCO_SUGAR = ['Sada', 'Alriha', 'Mazboot', 'Mano', 'Zeyada', 'Seryaosy'];
const STANDARD_SIZES = ['Small', 'Medium', 'Large'];

class IcedRefinement {
  private client: any;

  constructor(client: any) {
    this.client = client;
  }

  async getAttributeId(name: string): Promise<number | null> {
    const attrs = await this.client.searchRead('product.attribute', [['name', '=', name]], ['id']);
    return attrs.length > 0 ? attrs[0].id : null;
  }

  async getOrCreateAttributeValue(attrId: number, valueName: string): Promise<number> {
    const existing = await this.client.searchRead(
      'product.attribute.value',
      [['attribute_id', '=', attrId], ['name', '=', valueName]],
      ['id']
    );
    if (existing.length > 0) return existing[0].id;

    const newId = await this.client.rpc('product.attribute.value', 'create', [{
      name: valueName,
      attribute_id: attrId
    }]);
    return newId;
  }

  async removeAttributeFromProduct(productId: number, attrName: string) {
    const attrId = await this.getAttributeId(attrName);
    if (!attrId) return false;

    const lines = await this.client.searchRead(
      'product.template.attribute.line',
      [['product_tmpl_id', '=', productId], ['attribute_id', '=', attrId]],
      ['id']
    );

    if (lines.length > 0) {
      await this.client.rpc('product.template.attribute.line', 'unlink', [lines.map((l: any) => l.id)]);
      return true;
    }
    return false;
  }

  async setSugarLevel(productId: number, productName: string) {
    console.log(`  🔧 Franco Sugar on: ${productName}`);
    
    const sugarAttrId = await this.getAttributeId('Sugar Level');
    if (!sugarAttrId) {
      console.log(`    ❌ Sugar Level attribute not found!`);
      return;
    }

    const valueIds: number[] = [];
    for (const level of FRANCO_SUGAR) {
      const vid = await this.getOrCreateAttributeValue(sugarAttrId, level);
      valueIds.push(vid);
    }

    const existingLines = await this.client.searchRead(
      'product.template.attribute.line',
      [['product_tmpl_id', '=', productId], ['attribute_id', '=', sugarAttrId]],
      ['id']
    );

    if (existingLines.length > 0) {
      await this.client.rpc('product.template.attribute.line', 'write', [
        existingLines.map((l: any) => l.id),
        { value_ids: [[6, 0, valueIds]] }
      ]);
      console.log(`    ✅ Updated`);
    } else {
      await this.client.rpc('product.template.attribute.line', 'create', [{
        product_tmpl_id: productId,
        attribute_id: sugarAttrId,
        value_ids: [[6, 0, valueIds]]
      }]);
      console.log(`    ✅ Added`);
    }
  }

  async setSize(productId: number, productName: string) {
    console.log(`  🔧 Standard Size on: ${productName}`);
    
    const sizeAttrId = await this.getAttributeId('Size');
    if (!sizeAttrId) {
      console.log(`    ❌ Size attribute not found!`);
      return;
    }

    const valueIds: number[] = [];
    for (const size of STANDARD_SIZES) {
      const vid = await this.getOrCreateAttributeValue(sizeAttrId, size);
      valueIds.push(vid);
    }

    const existingLines = await this.client.searchRead(
      'product.template.attribute.line',
      [['product_tmpl_id', '=', productId], ['attribute_id', '=', sizeAttrId]],
      ['id']
    );

    if (existingLines.length > 0) {
      await this.client.rpc('product.template.attribute.line', 'write', [
        existingLines.map((l: any) => l.id),
        { value_ids: [[6, 0, valueIds]] }
      ]);
      console.log(`    ✅ Updated`);
    } else {
      await this.client.rpc('product.template.attribute.line', 'create', [{
        product_tmpl_id: productId,
        attribute_id: sizeAttrId,
        value_ids: [[6, 0, valueIds]]
      }]);
      console.log(`    ✅ Added`);
    }
  }

  async verifyProduct(productId: number, productName: string) {
    console.log(`\n✔️  ${productName} (ID: ${productId})`);
    
    const attrLines = await this.client.searchRead(
      'product.template.attribute.line',
      [['product_tmpl_id', '=', productId]],
      ['attribute_id', 'value_ids']
    );

    for (const line of attrLines) {
      const attr = await this.client.searchRead(
        'product.attribute',
        [['id', '=', line.attribute_id[0]]],
        ['name']
      );
      const values = await this.client.searchRead(
        'product.attribute.value',
        [['id', 'in', line.value_ids]],
        ['name']
      );
      console.log(`    - ${attr[0].name}: [${values.map((v: any) => v.name).join(', ')}]`);
    }
  }

  async fixItem(id: number, name: string) {
    console.log(`\n━━━ ${name} (ID: ${id}) ━━━`);
    await this.removeAttributeFromProduct(id, 'size'); // Remove lowercase
    await this.setSize(id, name);
    await this.setSugarLevel(id, name);
    await this.verifyProduct(id, name);
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('🧊 ICED CATEGORY - COMPLETE REFINEMENT');
  console.log('═══════════════════════════════════════════════════════════════════');

  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');

  const client = new OdooClient(config);
  const refiner = new IcedRefinement(client);

  // Get all iced items
  const icedItems = await client.searchRead(
    'product.template',
    [['pos_categ_ids', 'in', [ICED_CATEGORY_ID]], ['available_in_pos', '=', true]],
    ['id', 'name']
  );

  console.log(`\n📋 Found ${icedItems.length} iced items\n`);

  // Process each item
  for (const item of icedItems) {
    await refiner.fixItem(item.id, item.name);
  }

  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('✅ ICED CATEGORY REFINEMENT COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════════');
}

main().catch(console.error);

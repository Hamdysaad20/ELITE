/**
 * COMPLETE COFFEE CATEGORY REFINEMENT
 * Category ID: 15
 * 
 * SYSTEMATIC ITEM-BY-ITEM APPROACH
 */

import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient';

dotenv.config();

const COFFEE_CATEGORY_ID = 15;

// Franco-style sugar levels (standard)
const FRANCO_SUGAR = ['Sada', 'Alriha', 'Mazboot', 'Mano', 'Zeyada', 'Seryaosy'];

// Size values (standard)
const STANDARD_SIZES = ['Small', 'Medium', 'Large'];

class CoffeeRefinement {
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
    console.log(`  🔧 Setting Franco Sugar on: ${productName}`);
    
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
      console.log(`    ✅ Updated to Franco sugar`);
    } else {
      await this.client.rpc('product.template.attribute.line', 'create', [{
        product_tmpl_id: productId,
        attribute_id: sugarAttrId,
        value_ids: [[6, 0, valueIds]]
      }]);
      console.log(`    ✅ Added Franco sugar`);
    }
  }

  async setSize(productId: number, productName: string) {
    console.log(`  🔧 Setting Standard Size on: ${productName}`);
    
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
      console.log(`    ✅ Updated to standard sizes`);
    } else {
      await this.client.rpc('product.template.attribute.line', 'create', [{
        product_tmpl_id: productId,
        attribute_id: sizeAttrId,
        value_ids: [[6, 0, valueIds]]
      }]);
      console.log(`    ✅ Added standard sizes`);
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

  // ITEM-SPECIFIC FIX METHODS

  async fixAmericano() {
    console.log('\n━━━ Americano (ID: 851) ━━━');
    await this.removeAttributeFromProduct(851, 'size');
    await this.removeAttributeFromProduct(851, 'Size');
    await this.setSugarLevel(851, 'Americano');
    await this.verifyProduct(851, 'Americano');
  }

  async fixCortado() {
    console.log('\n━━━ Cortado (ID: 844) ━━━');
    await this.removeAttributeFromProduct(844, 'size');
    await this.removeAttributeFromProduct(844, 'Size');
    await this.setSugarLevel(844, 'Cortado');
    await this.verifyProduct(844, 'Cortado');
  }

  async fixFlatWhite() {
    console.log('\n━━━ Flat White (ID: 845) ━━━');
    await this.removeAttributeFromProduct(845, 'size');
    await this.removeAttributeFromProduct(845, 'Size');
    await this.setSugarLevel(845, 'Flat White');
    await this.verifyProduct(845, 'Flat White');
  }

  async fixTurkishCoffee() {
    console.log('\n━━━ Turkish Coffee (ID: 846) ━━━');
    await this.removeAttributeFromProduct(846, 'size');
    await this.removeAttributeFromProduct(846, 'Size');
    await this.setSugarLevel(846, 'Turkish Coffee');
    // Keep Shots attribute
    await this.verifyProduct(846, 'Turkish Coffee');
  }

  async fixFrenchCoffee() {
    console.log('\n━━━ French Coffee (ID: 847) ━━━');
    await this.removeAttributeFromProduct(847, 'size');
    await this.removeAttributeFromProduct(847, 'Size');
    await this.setSugarLevel(847, 'French Coffee');
    await this.verifyProduct(847, 'French Coffee');
  }

  async fixCafeLatte() {
    console.log('\n━━━ Café Latte (ID: 690) ━━━');
    await this.removeAttributeFromProduct(690, 'size'); // Remove lowercase
    await this.setSize(690, 'Café Latte');
    await this.setSugarLevel(690, 'Café Latte');
    await this.verifyProduct(690, 'Café Latte');
  }

  async fixCappuccino() {
    console.log('\n━━━ Cappuccino (ID: 691) ━━━');
    await this.removeAttributeFromProduct(691, 'size'); // Remove lowercase
    await this.setSize(691, 'Cappuccino');
    await this.setSugarLevel(691, 'Cappuccino');
    await this.verifyProduct(691, 'Cappuccino');
  }

  async fixCaffeMocha() {
    console.log('\n━━━ Caffè Mocha (ID: 768) ━━━');
    await this.removeAttributeFromProduct(768, 'size'); // Remove lowercase
    await this.setSize(768, 'Caffè Mocha');
    await this.setSugarLevel(768, 'Caffè Mocha');
    // Keep Chocolate Type attribute
    await this.verifyProduct(768, 'Caffè Mocha');
  }

  async fixCaramelMacchiato() {
    console.log('\n━━━ Caramel Macchiato (ID: 634) ━━━');
    await this.removeAttributeFromProduct(634, 'size'); // Remove lowercase
    await this.setSize(634, 'Caramel Macchiato');
    await this.setSugarLevel(634, 'Caramel Macchiato');
    await this.verifyProduct(634, 'Caramel Macchiato');
  }

  async fixEspresso() {
    console.log('\n━━━ Espresso (ID: 766) ━━━');
    await this.removeAttributeFromProduct(766, 'size');
    await this.removeAttributeFromProduct(766, 'Size');
    await this.setSugarLevel(766, 'Espresso');
    // Keep Shots attribute
    await this.verifyProduct(766, 'Espresso');
  }

  async fixSpanishLatte() {
    console.log('\n━━━ Spanish Latte (ID: 692) ━━━');
    await this.removeAttributeFromProduct(692, 'size'); // Remove lowercase
    await this.setSize(692, 'Spanish Latte');
    await this.setSugarLevel(692, 'Spanish Latte');
    await this.verifyProduct(692, 'Spanish Latte');
  }

  async fixHotChocolate() {
    console.log('\n━━━ Hot Chocolate (ID: 801) ━━━');
    await this.removeAttributeFromProduct(801, 'size'); // Remove lowercase
    await this.setSize(801, 'Hot Chocolate');
    await this.setSugarLevel(801, 'Hot Chocolate');
    // Keep Chocolate Type, Marshmallow attributes
    await this.verifyProduct(801, 'Hot Chocolate');
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('☕ COFFEE CATEGORY - COMPLETE REFINEMENT');
  console.log('═══════════════════════════════════════════════════════════════════');

  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');

  const client = new OdooClient(config);
  const refiner = new CoffeeRefinement(client);

  console.log('\n📋 PHASE 1: Single-Size Coffee Items (Remove Size, Add Sugar)');
  console.log('━'.repeat(70));
  await refiner.fixAmericano();
  await refiner.fixCortado();
  await refiner.fixFlatWhite();
  await refiner.fixTurkishCoffee();
  await refiner.fixFrenchCoffee();
  await refiner.fixEspresso();

  console.log('\n📋 PHASE 2: Multi-Size Coffee Items (Fix Size, Add/Fix Sugar)');
  console.log('━'.repeat(70));
  await refiner.fixCafeLatte();
  await refiner.fixCappuccino();
  await refiner.fixCaffeMocha();
  await refiner.fixCaramelMacchiato();
  await refiner.fixSpanishLatte();
  await refiner.fixHotChocolate();

  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('✅ COFFEE CATEGORY REFINEMENT COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════════');
}

main().catch(console.error);

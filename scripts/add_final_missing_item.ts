import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient.js';
dotenv.config();

async function addFinalMissingItem() {
  const config = getOdooConfigFromEnv();
  if (!config) {
    throw new Error('Odoo configuration not found in environment variables');
  }
  const odoo = new OdooClient(config);

  console.log('🔍 Adding final missing item: Mango Passion Milkshake\n');

  // Get Milkshake categories
  const milkshakeCateg = await odoo.searchRead('product.category', [
    ['name', '=', 'Milkshake'],
  ], ['id', 'name']);

  const milkshakePosCateg = await odoo.searchRead('pos.category', [
    ['name', '=', 'Milkshake'],
  ], ['id', 'name']);

  if (!milkshakeCateg.length || !milkshakePosCateg.length) {
    console.log('❌ Milkshake category not found');
    return;
  }

  console.log(`✓ Found Milkshake category: ${milkshakeCateg[0].id}`);
  console.log(`✓ Found Milkshake POS category: ${milkshakePosCateg[0].id}\n`);

  // Check if product already exists
  const existing = await odoo.searchRead('product.template', [
    ['name', 'ilike', 'Mango Passion'],
    ['categ_id', '=', milkshakeCateg[0].id],
  ], ['id', 'name']);

  if (existing.length > 0) {
    console.log(`⚠️  Product already exists: ${existing[0].name} (ID: ${existing[0].id})`);
    return;
  }

  // Create the product
  const productData = {
    name: 'Milkshake [Mango Passion Fruit]',
    list_price: 80,
    default_code: 'MS008',
    type: 'consu',
    categ_id: milkshakeCateg[0].id,
    available_in_pos: true,
    pos_categ_ids: [[6, 0, [milkshakePosCateg[0].id]]],
    sale_ok: true,
    purchase_ok: false,
  };

  const productId = await odoo.create('product.template', productData);

  console.log(`✅ Created: Milkshake [Mango Passion Fruit] (ID: ${productId})`);
  console.log(`   Price: 80 EGP`);
  console.log(`   SKU: MS008`);
  console.log(`   Category: Milkshake`);
  console.log(`   Available in POS: Yes`);

  console.log('\n✅ Final product addition complete!');
  console.log('📊 Total products should now be: 108');
}

addFinalMissingItem().catch(console.error);

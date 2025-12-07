import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient.js';
dotenv.config();

async function addMilkshakeAttributes() {
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  config.timeoutMs = 180000;
  const odoo = new OdooClient(config);

  console.log('🥤 Adding Attributes to Milkshakes...\n');

  // Get Milkshake category
  const milkshakeCategory = await odoo.searchRead('product.category',
    [['name', '=', 'Milkshake']],
    ['id', 'name']
  );

  if (milkshakeCategory.length === 0) {
    console.log('❌ Milkshake category not found!');
    return;
  }

  const milkshakeCategoryId = milkshakeCategory[0].id;
  console.log(`✓ Found Milkshake category (ID: ${milkshakeCategoryId})`);

  // Get all milkshake products
  const milkshakes = await odoo.searchRead('product.template',
    [['categ_id', '=', milkshakeCategoryId], ['active', '=', true]],
    ['id', 'name']
  );

  console.log(`✓ Found ${milkshakes.length} milkshake products\n`);

  // Helper function to get or create attribute
  async function getOrCreateAttribute(name: string, displayType: 'radio' | 'multi', values: string[]) {
    let attr = await odoo.searchRead('product.attribute',
      [['name', '=', name]],
      ['id']
    );

    let attrId: number;

    if (attr.length === 0) {
      attrId = await odoo.rpc('product.attribute', 'create', [{
        name: name,
        display_type: displayType,
        create_variant: 'no_variant',
      }]);
      console.log(`  ✓ Created attribute: ${name}`);

      // Create values
      for (const value of values) {
        await odoo.rpc('product.attribute.value', 'create', [{
          attribute_id: attrId,
          name: value,
        }]);
      }
      console.log(`    Added ${values.length} values`);
    } else {
      attrId = attr[0].id;
      console.log(`  ℹ️  Attribute '${name}' already exists`);
    }

    return attrId;
  }

  // Helper function to apply attribute to product
  async function applyAttribute(productId: number, productName: string, attrId: number, attrName: string) {
    // Check if already applied
    const existingLine = await odoo.searchRead('product.template.attribute.line',
      [['product_tmpl_id', '=', productId], ['attribute_id', '=', attrId]],
      ['id']
    );

    if (existingLine.length > 0) {
      return false; // Already applied
    }

    // Get all values
    const values = await odoo.searchRead('product.attribute.value',
      [['attribute_id', '=', attrId]],
      ['id']
    );

    if (values.length === 0) return false;

    await odoo.rpc('product.template.attribute.line', 'create', [{
      product_tmpl_id: productId,
      attribute_id: attrId,
      value_ids: [[6, 0, values.map(v => v.id)]],
    }]);

    return true; // Applied
  }

  // 1. Get or create Size attribute
  console.log('1️⃣  Setting up Size attribute...');
  const sizeAttrId = await getOrCreateAttribute('Size', 'radio', [
    'Small',
    'Medium',
    'Large'
  ]);

  // 2. Create Premium Toppings attribute
  console.log('\n2️⃣  Setting up Premium Toppings attribute...');
  const toppingsAttrId = await getOrCreateAttribute('Premium Toppings', 'multi', [
    'Oreo Crumbles (+10 EGP)',
    'Chocolate Chips (+10 EGP)',
    'Caramel Drizzle (+8 EGP)',
    'Chocolate Sauce (+8 EGP)',
    'Whipped Cream (+8 EGP)',
    'Sprinkles (+5 EGP)',
    'Crushed Nuts (+12 EGP)',
    'Fresh Strawberries (+15 EGP)',
    'Brownie Pieces (+15 EGP)',
    'Cookie Dough (+15 EGP)'
  ]);

  // Set pricing for premium toppings
  const toppingValues = await odoo.searchRead('product.attribute.value',
    [['attribute_id', '=', toppingsAttrId]],
    ['id', 'name']
  );

  const toppingPricing: { [key: string]: number } = {
    'Oreo Crumbles (+10 EGP)': 10,
    'Chocolate Chips (+10 EGP)': 10,
    'Caramel Drizzle (+8 EGP)': 8,
    'Chocolate Sauce (+8 EGP)': 8,
    'Whipped Cream (+8 EGP)': 8,
    'Sprinkles (+5 EGP)': 5,
    'Crushed Nuts (+12 EGP)': 12,
    'Fresh Strawberries (+15 EGP)': 15,
    'Brownie Pieces (+15 EGP)': 15,
    'Cookie Dough (+15 EGP)': 15
  };

  // 3. Get Whipped Cream Amount attribute (if exists)
  console.log('\n3️⃣  Setting up Whipped Cream attribute...');
  const whippedCreamAttrId = await getOrCreateAttribute('Whipped Cream Amount', 'radio', [
    'No Whipped Cream',
    'Regular',
    'Extra (+5 EGP)'
  ]);

  // Set pricing for whipped cream
  const whippedValues = await odoo.searchRead('product.attribute.value',
    [['attribute_id', '=', whippedCreamAttrId]],
    ['id', 'name']
  );

  // 4. Apply attributes to all milkshakes
  console.log('\n4️⃣  Applying attributes to milkshakes...');
  console.log('='.repeat(70));

  let appliedCount = 0;

  for (const milkshake of milkshakes) {
    console.log(`\n  ${milkshake.name}:`);
    
    // Apply Size
    const sizeApplied = await applyAttribute(milkshake.id, milkshake.name, sizeAttrId, 'Size');
    if (sizeApplied) {
      console.log(`    ✓ Added Size`);
      appliedCount++;
    } else {
      console.log(`    ℹ️  Size already exists`);
    }

    // Apply Premium Toppings
    const toppingsApplied = await applyAttribute(milkshake.id, milkshake.name, toppingsAttrId, 'Premium Toppings');
    if (toppingsApplied) {
      console.log(`    ✓ Added Premium Toppings`);
      
      // Set pricing for each topping value on this product
      for (const topping of toppingValues) {
        const price = toppingPricing[topping.name] || 0;
        
        const ptavs = await odoo.searchRead('product.template.attribute.value',
          [['product_tmpl_id', '=', milkshake.id], ['product_attribute_value_id', '=', topping.id]],
          ['id']
        );

        if (ptavs.length > 0) {
          await odoo.rpc('product.template.attribute.value', 'write', [[ptavs[0].id], {
            price_extra: price,
          }]);
        }
      }
    } else {
      console.log(`    ℹ️  Premium Toppings already exist`);
    }

    // Apply Whipped Cream Amount
    const whippedApplied = await applyAttribute(milkshake.id, milkshake.name, whippedCreamAttrId, 'Whipped Cream Amount');
    if (whippedApplied) {
      console.log(`    ✓ Added Whipped Cream Amount`);
      
      // Set pricing for Extra whipped cream
      for (const whipped of whippedValues) {
        if (whipped.name === 'Extra (+5 EGP)') {
          const ptavs = await odoo.searchRead('product.template.attribute.value',
            [['product_tmpl_id', '=', milkshake.id], ['product_attribute_value_id', '=', whipped.id]],
            ['id']
          );

          if (ptavs.length > 0) {
            await odoo.rpc('product.template.attribute.value', 'write', [[ptavs[0].id], {
              price_extra: 5,
            }]);
          }
        }
      }
    } else {
      console.log(`    ℹ️  Whipped Cream Amount already exists`);
    }
  }

  console.log('\n✅ Milkshake attributes configured!\n');
  console.log('📊 Summary:');
  console.log('='.repeat(70));
  console.log(`  Milkshakes found:          ${milkshakes.length}`);
  console.log(`  Attributes applied:        Size, Premium Toppings, Whipped Cream`);
  console.log('='.repeat(70));

  console.log('\n🎯 Attribute Details:');
  console.log('\n  Size (Single Choice):');
  console.log('    • Small');
  console.log('    • Medium');
  console.log('    • Large');

  console.log('\n  Premium Toppings (Multiple Choice):');
  console.log('    • Oreo Crumbles (+10 EGP)');
  console.log('    • Chocolate Chips (+10 EGP)');
  console.log('    • Caramel Drizzle (+8 EGP)');
  console.log('    • Chocolate Sauce (+8 EGP)');
  console.log('    • Whipped Cream (+8 EGP)');
  console.log('    • Sprinkles (+5 EGP)');
  console.log('    • Crushed Nuts (+12 EGP)');
  console.log('    • Fresh Strawberries (+15 EGP)');
  console.log('    • Brownie Pieces (+15 EGP)');
  console.log('    • Cookie Dough (+15 EGP)');

  console.log('\n  Whipped Cream Amount (Single Choice):');
  console.log('    • No Whipped Cream');
  console.log('    • Regular');
  console.log('    • Extra (+5 EGP)');
}

addMilkshakeAttributes().catch(console.error);

import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient.js';
dotenv.config();

async function fixProductIssues() {
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  config.timeoutMs = 180000;
  const odoo = new OdooClient(config);

  console.log('🔧 Fixing Product Issues...\n');

  // Helper function to remove all attributes from a product
  async function removeAllAttributes(productId: number, productName: string) {
    const lines = await odoo.searchRead('product.template.attribute.line',
      [['product_tmpl_id', '=', productId]],
      ['id']
    );
    
    if (lines.length > 0) {
      await odoo.rpc('product.template.attribute.line', 'unlink', [lines.map(l => l.id)]);
      console.log(`  ✓ Removed ${lines.length} attributes from ${productName}`);
    }
  }

  // Helper function to apply specific attributes
  async function applyAttributes(productId: number, productName: string, attributeNames: string[]) {
    for (const attrName of attributeNames) {
      const attr = await odoo.searchRead('product.attribute',
        [['name', '=', attrName]],
        ['id']
      );

      if (attr.length === 0) {
        console.log(`  ⚠️  Attribute '${attrName}' not found`);
        continue;
      }

      const attrId = attr[0].id;

      // Check if already applied
      const existingLine = await odoo.searchRead('product.template.attribute.line',
        [['product_tmpl_id', '=', productId], ['attribute_id', '=', attrId]],
        ['id']
      );

      if (existingLine.length > 0) {
        console.log(`  ℹ️  '${attrName}' already on ${productName}`);
        continue;
      }

      // Get all values
      const values = await odoo.searchRead('product.attribute.value',
        [['attribute_id', '=', attrId]],
        ['id']
      );

      if (values.length === 0) continue;

      await odoo.rpc('product.template.attribute.line', 'create', [{
        product_tmpl_id: productId,
        attribute_id: attrId,
        value_ids: [[6, 0, values.map(v => v.id)]],
      }]);

      console.log(`  ✓ Applied '${attrName}' to ${productName}`);
    }
  }

  // 1. Black Cat - Move to Soda, remove milk option
  console.log('1️⃣  Fixing Black Cat...');
  console.log('='.repeat(70));
  
  const blackCat = await odoo.searchRead('product.template',
    [['name', 'ilike', 'black cat']],
    ['id', 'name', 'categ_id']
  );

  if (blackCat.length > 0) {
    const sodaCategory = await odoo.searchRead('product.category',
      [['name', '=', 'Soda']],
      ['id']
    );

    if (sodaCategory.length > 0) {
      await odoo.rpc('product.template', 'write', [[blackCat[0].id], {
        categ_id: sodaCategory[0].id
      }]);
      console.log(`  ✓ Moved Black Cat to Soda category`);
    }

    // Remove milk option
    const milkAttr = await odoo.searchRead('product.attribute',
      [['name', '=', 'Milk Options']],
      ['id']
    );

    if (milkAttr.length > 0) {
      const milkLine = await odoo.searchRead('product.template.attribute.line',
        [['product_tmpl_id', '=', blackCat[0].id], ['attribute_id', '=', milkAttr[0].id]],
        ['id']
      );

      if (milkLine.length > 0) {
        await odoo.rpc('product.template.attribute.line', 'unlink', [milkLine.map(l => l.id)]);
        console.log(`  ✓ Removed Milk Options from Black Cat`);
      }
    }
  } else {
    console.log(`  ⚠️  Black Cat not found`);
  }

  // 2. Iced Macchiato - Keep only Size attribute
  console.log('\n2️⃣  Fixing Iced Macchiato...');
  console.log('='.repeat(70));
  
  const icedMacchiato = await odoo.searchRead('product.template',
    [['name', 'ilike', 'iced macchiato'], ['name', 'not ilike', 'caramel']],
    ['id', 'name']
  );

  if (icedMacchiato.length > 0) {
    await removeAllAttributes(icedMacchiato[0].id, icedMacchiato[0].name);
    await applyAttributes(icedMacchiato[0].id, icedMacchiato[0].name, ['Size', 'Milk Options', 'Shots', 'Ice Level']);
  }

  // 3. Ice Mocha - Add chocolate option
  console.log('\n3️⃣  Fixing Ice Mocha...');
  console.log('='.repeat(70));
  
  const iceMocha = await odoo.searchRead('product.template',
    [['name', 'ilike', 'ice mocha']],
    ['id', 'name']
  );

  if (iceMocha.length > 0) {
    await applyAttributes(iceMocha[0].id, iceMocha[0].name, ['Chocolate Type']);
  }

  // 4. Iced Chai Latte - Add extra flavours
  console.log('\n4️⃣  Fixing Iced Chai Latte...');
  console.log('='.repeat(70));
  
  const icedChaiLatte = await odoo.searchRead('product.template',
    [['name', 'ilike', 'iced chai latte']],
    ['id', 'name']
  );

  if (icedChaiLatte.length > 0) {
    await applyAttributes(icedChaiLatte[0].id, icedChaiLatte[0].name, ['Flavor Type']);
  }

  // 5. Iced Chocolate - Add chocolate option
  console.log('\n5️⃣  Fixing Iced Chocolate...');
  console.log('='.repeat(70));
  
  const icedChocolate = await odoo.searchRead('product.template',
    [['name', 'ilike', 'iced chocolate']],
    ['id', 'name']
  );

  if (icedChocolate.length > 0) {
    // Keep only the first one if duplicates exist
    if (icedChocolate.length > 1) {
      console.log(`  ⚠️  Found ${icedChocolate.length} Iced Chocolate products`);
      for (let i = 1; i < icedChocolate.length; i++) {
        await odoo.rpc('product.template', 'write', [[icedChocolate[i].id], { active: false }]);
        console.log(`  ✓ Archived duplicate: ${icedChocolate[i].name}`);
      }
    }
    await applyAttributes(icedChocolate[0].id, icedChocolate[0].name, ['Chocolate Type']);
  }

  // 6. Remove Iced Caramel Macchiato
  console.log('\n6️⃣  Removing Iced Caramel Macchiato...');
  console.log('='.repeat(70));
  
  const icedCaramelMacchiato = await odoo.searchRead('product.template',
    [['name', 'ilike', 'iced caramel macchiato']],
    ['id', 'name']
  );

  if (icedCaramelMacchiato.length > 0) {
    for (const product of icedCaramelMacchiato) {
      await odoo.rpc('product.template', 'write', [[product.id], { active: false }]);
      console.log(`  ✓ Archived: ${product.name}`);
    }
  }

  // 7. Frappe items - Add extra shots
  console.log('\n7️⃣  Adding shots to Frappe items...');
  console.log('='.repeat(70));
  
  const frappeCategory = await odoo.searchRead('product.category',
    [['name', '=', 'Frappe']],
    ['id']
  );

  if (frappeCategory.length > 0) {
    const frappeItems = await odoo.searchRead('product.template',
      [['categ_id', '=', frappeCategory[0].id]],
      ['id', 'name']
    );

    for (const item of frappeItems) {
      await applyAttributes(item.id, item.name, ['Shots']);
    }
    console.log(`  ✓ Added shots to ${frappeItems.length} Frappe items`);
  }

  // 8. French Coffee - Sugar level, milk option, sizes only
  console.log('\n8️⃣  Fixing French Coffee...');
  console.log('='.repeat(70));
  
  const frenchCoffee = await odoo.searchRead('product.template',
    [['name', 'ilike', 'french coffee']],
    ['id', 'name']
  );

  if (frenchCoffee.length > 0) {
    await removeAllAttributes(frenchCoffee[0].id, frenchCoffee[0].name);
    await applyAttributes(frenchCoffee[0].id, frenchCoffee[0].name, ['Size', 'Milk Options', 'Sugar Level']);
  }

  // 9. Turkish Coffee - Keep only one size attribute
  console.log('\n9️⃣  Fixing Turkish Coffee sizes...');
  console.log('='.repeat(70));
  
  const turkishCoffee = await odoo.searchRead('product.template',
    [['name', 'ilike', 'turkish coffee']],
    ['id', 'name']
  );

  if (turkishCoffee.length > 0) {
    for (const tc of turkishCoffee) {
      await removeAllAttributes(tc.id, tc.name);
      await applyAttributes(tc.id, tc.name, ['Size', 'Sugar Level']);
    }

    // Archive all but one if there are duplicates (single/double)
    if (turkishCoffee.length > 1) {
      console.log(`  ⚠️  Found ${turkishCoffee.length} Turkish Coffee products, keeping first one`);
      for (let i = 1; i < turkishCoffee.length; i++) {
        await odoo.rpc('product.template', 'write', [[turkishCoffee[i].id], { active: false }]);
        console.log(`  ✓ Archived: ${turkishCoffee[i].name}`);
      }
      // Update the remaining one to just "Turkish Coffee"
      await odoo.rpc('product.template', 'write', [[turkishCoffee[0].id], { 
        name: 'Turkish Coffee',
        description_sale: 'Traditional Turkish coffee with sugar level and size options'
      }]);
      console.log(`  ✓ Renamed to "Turkish Coffee"`);
    }
  }

  // 10. Espresso Avocado - Ice cream flavor + shots only
  console.log('\n🔟 Fixing Espresso Avocado...');
  console.log('='.repeat(70));
  
  const espressoAvocado = await odoo.searchRead('product.template',
    [['name', 'ilike', 'espresso avocado']],
    ['id', 'name']
  );

  if (espressoAvocado.length > 0) {
    await removeAllAttributes(espressoAvocado[0].id, espressoAvocado[0].name);
    await applyAttributes(espressoAvocado[0].id, espressoAvocado[0].name, ['Ice Cream Scoop Flavor', 'Shots']);
  }

  // 11. Hazelnut Coffee - Like French Coffee
  console.log('\n1️⃣1️⃣  Fixing Hazelnut Coffee...');
  console.log('='.repeat(70));
  
  const hazelnutCoffee = await odoo.searchRead('product.template',
    [['name', 'ilike', 'hazelnut coffee']],
    ['id', 'name']
  );

  if (hazelnutCoffee.length > 0) {
    await removeAllAttributes(hazelnutCoffee[0].id, hazelnutCoffee[0].name);
    await applyAttributes(hazelnutCoffee[0].id, hazelnutCoffee[0].name, ['Size', 'Milk Options', 'Sugar Level']);
  }

  // 12. Hot Chocolate - Add dark/white chocolate option
  console.log('\n1️⃣2️⃣  Fixing Hot Chocolate...');
  console.log('='.repeat(70));
  
  const hotChocolate = await odoo.searchRead('product.template',
    [['name', 'ilike', 'hot chocolate']],
    ['id', 'name']
  );

  if (hotChocolate.length > 0) {
    await applyAttributes(hotChocolate[0].id, hotChocolate[0].name, ['Chocolate Type']);
  }

  console.log('\n✅ All fixes complete!\n');
}

fixProductIssues().catch(console.error);

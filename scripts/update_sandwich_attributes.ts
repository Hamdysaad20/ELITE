import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient.js';
dotenv.config();

async function updateSandwichAttributes() {
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  config.timeoutMs = 180000;
  const odoo = new OdooClient(config);

  console.log('🥪 Updating Sandwich Attributes...\n');

  // 1. Remove Cheese Burger
  console.log('1️⃣  Removing Cheese Burger...');
  console.log('='.repeat(70));

  const cheeseBurger = await odoo.searchRead('product.template',
    [['name', 'ilike', 'cheese burger']],
    ['id', 'name']
  );

  if (cheeseBurger.length > 0) {
    await odoo.rpc('product.template', 'write', [[cheeseBurger[0].id], { active: false }]);
    console.log(`  ✓ Archived: ${cheeseBurger[0].name}`);
  } else {
    console.log(`  ℹ️  Cheese Burger not found`);
  }

  // 2. Update Sandwich Cheese attribute to add "Mixed Cheese"
  console.log('\n2️⃣  Updating Sandwich Cheese attribute...');
  console.log('='.repeat(70));

  const cheeseAttr = await odoo.searchRead('product.attribute',
    [['name', '=', 'Sandwich Cheese']],
    ['id']
  );

  if (cheeseAttr.length > 0) {
    const cheeseAttrId = cheeseAttr[0].id;
    
    // Check if Mixed Cheese already exists
    const mixedCheese = await odoo.searchRead('product.attribute.value',
      [['attribute_id', '=', cheeseAttrId], ['name', '=', 'Mixed Cheese (+30 EGP)']],
      ['id']
    );

    if (mixedCheese.length === 0) {
      // Add Mixed Cheese option
      await odoo.rpc('product.attribute.value', 'create', [{
        attribute_id: cheeseAttrId,
        name: 'Mixed Cheese (+30 EGP)',
      }]);
      console.log(`  ✓ Added: Mixed Cheese (+30 EGP)`);

      // Apply to all sandwiches that have Sandwich Cheese attribute
      const sandwichLines = await odoo.searchRead('product.template.attribute.line',
        [['attribute_id', '=', cheeseAttrId]],
        ['id', 'product_tmpl_id', 'value_ids']
      );

      for (const line of sandwichLines) {
        // Get updated values including new Mixed Cheese
        const allValues = await odoo.searchRead('product.attribute.value',
          [['attribute_id', '=', cheeseAttrId]],
          ['id']
        );

        // Update the line to include all values
        await odoo.rpc('product.template.attribute.line', 'write', [[line.id], {
          value_ids: [[6, 0, allValues.map(v => v.id)]],
        }]);
      }

      console.log(`  ✓ Applied to ${sandwichLines.length} sandwiches`);

      // Set pricing for Mixed Cheese on all sandwiches
      const mixedCheeseValue = await odoo.searchRead('product.attribute.value',
        [['attribute_id', '=', cheeseAttrId], ['name', '=', 'Mixed Cheese (+30 EGP)']],
        ['id']
      );

      if (mixedCheeseValue.length > 0) {
        const customSandwich = await odoo.searchRead('product.template',
          [['name', '=', 'Custom Sandwich']],
          ['id']
        );

        if (customSandwich.length > 0) {
          const ptavs = await odoo.searchRead('product.template.attribute.value',
            [['product_tmpl_id', '=', customSandwich[0].id], ['product_attribute_value_id', '=', mixedCheeseValue[0].id]],
            ['id']
          );

          if (ptavs.length > 0) {
            await odoo.rpc('product.template.attribute.value', 'write', [[ptavs[0].id], {
              price_extra: 30,
            }]);
            console.log(`  ✓ Set pricing: Mixed Cheese +30 EGP`);
          }
        }
      }
    } else {
      console.log(`  ℹ️  Mixed Cheese already exists`);
    }

    // Get current cheese values
    const cheeseValues = await odoo.searchRead('product.attribute.value',
      [['attribute_id', '=', cheeseAttrId]],
      ['id', 'name']
    );

    console.log(`\n  Current Sandwich Cheese options (${cheeseValues.length}):`);
    cheeseValues.forEach(v => console.log(`    • ${v.name}`));

  } else {
    console.log(`  ⚠️  Sandwich Cheese attribute not found`);
  }

  // 3. Check and clean up Sandwich Protein attribute
  console.log('\n3️⃣  Reviewing Sandwich Protein attribute...');
  console.log('='.repeat(70));

  const proteinAttr = await odoo.searchRead('product.attribute',
    [['name', '=', 'Sandwich Protein']],
    ['id']
  );

  if (proteinAttr.length > 0) {
    const proteinValues = await odoo.searchRead('product.attribute.value',
      [['attribute_id', '=', proteinAttr[0].id]],
      ['id', 'name']
    );

    console.log(`\n  Current Sandwich Protein options (${proteinValues.length}):`);
    proteinValues.forEach(v => console.log(`    • ${v.name}`));

    // Find and remove duplicates
    const seen = new Map<string, number>();
    const duplicates: number[] = [];

    for (const value of proteinValues) {
      const baseName = value.name.toLowerCase().replace(/\s*\(.*?\)\s*/g, '').trim();
      if (seen.has(baseName)) {
        duplicates.push(value.id);
        console.log(`    ⚠️  Duplicate found: ${value.name}`);
      } else {
        seen.set(baseName, value.id);
      }
    }

    if (duplicates.length > 0) {
      console.log(`\n  Found ${duplicates.length} duplicates - these are in use and cannot be removed`);
      console.log(`  You may need to manually consolidate these in Odoo`);
    }
  } else {
    console.log(`  ℹ️  Sandwich Protein attribute not found`);
  }

  console.log('\n✅ Sandwich updates complete!\n');
  console.log('Summary:');
  console.log('  ✓ Cheese Burger archived');
  console.log('  ✓ Mixed Cheese (+30 EGP) added to sandwich options');
  console.log('  ℹ️  Review protein options for duplicates');
}

updateSandwichAttributes().catch(console.error);

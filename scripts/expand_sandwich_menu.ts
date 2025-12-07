import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient.js';
dotenv.config();

async function expandSandwichMenu() {
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  config.timeoutMs = 180000;
  const odoo = new OdooClient(config);

  console.log('🥪 Expanding Sandwich Menu for Elite Coffee...\n');

  // Get Food category
  const foodCategory = await odoo.searchRead('product.category',
    [['name', '=', 'Food']],
    ['id', 'name']
  );

  if (foodCategory.length === 0) {
    console.log('❌ Food category not found!');
    return;
  }

  const foodCategoryId = foodCategory[0].id;

  // Premium sandwich menu (using existing ingredients)
  const premiumSandwiches = [
    {
      name: 'Grilled Chicken Supreme',
      price: 95,
      sku: 'SAND-GRILL-CHK',
      description: 'Grilled chicken breast, mozzarella, lettuce, tomato, mayo'
    },
    {
      name: 'Turkey & Cheese Classic',
      price: 85,
      sku: 'SAND-TURKEY',
      description: 'Sliced turkey, cheddar cheese, lettuce, tomato, mustard'
    },
    {
      name: 'Italian Supreme',
      price: 110,
      sku: 'SAND-ITALIAN',
      description: 'Salami, mozzarella, olives, tomato, basil, olive oil'
    },
    {
      name: 'Smoked Salmon Deluxe',
      price: 145,
      sku: 'SAND-SALMON',
      description: 'Smoked salmon, cream cheese, cucumber, capers, dill'
    },
    {
      name: 'Veggie Mediterranean',
      price: 75,
      sku: 'SAND-VEGGIE',
      description: 'Grilled vegetables, feta cheese, hummus, olives'
    },
    {
      name: 'BBQ Chicken Ranch',
      price: 100,
      sku: 'SAND-BBQ-CHK',
      description: 'BBQ chicken, cheddar, lettuce, tomato, ranch sauce'
    },
    {
      name: 'Philadelphia Steak',
      price: 135,
      sku: 'SAND-PHILLY',
      description: 'Sliced steak, caramelized onions, bell peppers, cheese'
    },
    {
      name: 'Caprese Panini',
      price: 90,
      sku: 'SAND-CAPRESE',
      description: 'Fresh mozzarella, tomato, basil, balsamic glaze'
    },
    {
      name: 'Chicken Caesar Wrap',
      price: 85,
      sku: 'SAND-CAESAR',
      description: 'Grilled chicken, romaine, parmesan, caesar dressing'
    },
    {
      name: 'Elite Signature Club',
      price: 120,
      sku: 'SAND-SIGNATURE',
      description: 'Triple decker: turkey, bacon, chicken, cheese, lettuce, tomato'
    },
  ];

  console.log('📝 Step 1: Creating premium sandwich menu...');
  console.log('='.repeat(70));

  let createdCount = 0;
  let existingCount = 0;

  for (const sandwich of premiumSandwiches) {
    // Check if exists
    const existing = await odoo.searchRead('product.template',
      [['name', '=', sandwich.name]],
      ['id']
    );

    if (existing.length > 0) {
      console.log(`  ℹ️  ${sandwich.name} already exists`);
      existingCount++;
      continue;
    }

    // Create sandwich
    const productId = await odoo.rpc('product.template', 'create', [{
      name: sandwich.name,
      list_price: sandwich.price,
      default_code: sandwich.sku,
      categ_id: foodCategoryId,
      type: 'consu',
      available_in_pos: true,
      sale_ok: true,
      purchase_ok: false,
      description_sale: sandwich.description,
    }]);

    console.log(`  ✓ Created: ${sandwich.name} (${sandwich.price} EGP)`);
    createdCount++;
  }

  console.log(`\n  Created: ${createdCount}, Already Exists: ${existingCount}`);

  // Step 2: Create sandwich ingredients as extras
  console.log('\n📝 Step 2: Creating sandwich ingredient extras...');
  console.log('='.repeat(70));

  const ingredients = [
    // Proteins
    { name: 'Extra Grilled Chicken', price: 25, category: 'Protein' },
    { name: 'Extra Turkey Slices', price: 20, category: 'Protein' },
    { name: 'Extra Smoked Salmon', price: 40, category: 'Protein' },
    { name: 'Extra Beef Slices', price: 30, category: 'Protein' },
    { name: 'Extra Bacon', price: 20, category: 'Protein' },
    { name: 'Extra Tuna', price: 18, category: 'Protein' },
    
    // Cheese
    { name: 'Extra Mozzarella', price: 12, category: 'Cheese' },
    { name: 'Extra Cheddar', price: 12, category: 'Cheese' },
    { name: 'Extra Feta Cheese', price: 15, category: 'Cheese' },
    { name: 'Extra Cream Cheese', price: 10, category: 'Cheese' },
    { name: 'Extra Parmesan', price: 15, category: 'Cheese' },
    
    // Vegetables
    { name: 'Extra Lettuce', price: 5, category: 'Vegetables' },
    { name: 'Extra Tomato', price: 5, category: 'Vegetables' },
    { name: 'Extra Cucumber', price: 5, category: 'Vegetables' },
    { name: 'Extra Onions', price: 5, category: 'Vegetables' },
    { name: 'Extra Bell Peppers', price: 8, category: 'Vegetables' },
    { name: 'Extra Olives', price: 8, category: 'Vegetables' },
    { name: 'Extra Pickles', price: 5, category: 'Vegetables' },
    { name: 'Extra Jalapeños', price: 8, category: 'Vegetables' },
    { name: 'Extra Mushrooms', price: 10, category: 'Vegetables' },
    { name: 'Extra Avocado', price: 15, category: 'Vegetables' },
    
    // Sauces
    { name: 'Extra Mayo', price: 5, category: 'Sauce' },
    { name: 'Extra Mustard', price: 5, category: 'Sauce' },
    { name: 'Extra Ketchup', price: 5, category: 'Sauce' },
    { name: 'Extra Ranch Sauce', price: 8, category: 'Sauce' },
    { name: 'Extra BBQ Sauce', price: 8, category: 'Sauce' },
    { name: 'Extra Caesar Dressing', price: 8, category: 'Sauce' },
    { name: 'Extra Hummus', price: 10, category: 'Sauce' },
    { name: 'Extra Pesto', price: 12, category: 'Sauce' },
    
    // Bread
    { name: 'White Bread', price: 0, category: 'Bread' },
    { name: 'Whole Wheat Bread', price: 5, category: 'Bread' },
    { name: 'Ciabatta', price: 8, category: 'Bread' },
    { name: 'Baguette', price: 8, category: 'Bread' },
    { name: 'Wrap', price: 5, category: 'Bread' },
  ];

  // Get or create Extras category
  let extrasCategory = await odoo.searchRead('product.category',
    [['name', '=', 'Extras']],
    ['id']
  );

  let extrasCategoryId: number;
  if (extrasCategory.length === 0) {
    extrasCategoryId = await odoo.rpc('product.category', 'create', [{
      name: 'Extras'
    }]);
    console.log(`  ✓ Created Extras category`);
  } else {
    extrasCategoryId = extrasCategory[0].id;
  }

  let ingredientsCreated = 0;
  let ingredientsExist = 0;

  for (const ingredient of ingredients) {
    const existing = await odoo.searchRead('product.template',
      [['name', '=', ingredient.name]],
      ['id']
    );

    if (existing.length > 0) {
      ingredientsExist++;
      continue;
    }

    await odoo.rpc('product.template', 'create', [{
      name: ingredient.name,
      list_price: ingredient.price,
      categ_id: extrasCategoryId,
      type: 'consu',
      available_in_pos: true,
      sale_ok: true,
      purchase_ok: false,
    }]);

    ingredientsCreated++;
  }

  console.log(`  ✓ Created ${ingredientsCreated} new ingredients`);
  console.log(`  ℹ️  ${ingredientsExist} ingredients already exist`);

  // Step 3: Configure Custom Sandwich with multi-select attributes
  console.log('\n📝 Step 3: Configuring Custom Sandwich with ingredients...');
  console.log('='.repeat(70));

  const customSandwich = await odoo.searchRead('product.template',
    [['name', '=', 'Custom Sandwich']],
    ['id', 'name']
  );

  if (customSandwich.length === 0) {
    console.log('  ⚠️  Custom Sandwich not found!');
  } else {
    const customSandwichId = customSandwich[0].id;

    // Update Custom Sandwich pricing
    await odoo.rpc('product.template', 'write', [[customSandwichId], {
      list_price: 60, // Base price
      description_sale: 'Build your own sandwich with choice of bread, protein, cheese, vegetables, and sauces',
    }]);

    console.log(`  ✓ Updated Custom Sandwich base price: 60 EGP`);

    // Create attribute groups for multi-selection
    const attributeGroups = [
      {
        name: 'Sandwich Bread Type',
        display_type: 'radio', // Single selection
        values: ['White Bread', 'Whole Wheat Bread (+5 EGP)', 'Ciabatta (+8 EGP)', 'Baguette (+8 EGP)', 'Wrap (+5 EGP)'],
        pricing: { 'White Bread': 0, 'Whole Wheat Bread (+5 EGP)': 5, 'Ciabatta (+8 EGP)': 8, 'Baguette (+8 EGP)': 8, 'Wrap (+5 EGP)': 5 }
      },
      {
        name: 'Sandwich Protein',
        display_type: 'multi', // Multi selection
        values: ['Grilled Chicken (+25 EGP)', 'Turkey (+20 EGP)', 'Smoked Salmon (+40 EGP)', 'Beef (+30 EGP)', 'Bacon (+20 EGP)', 'Tuna (+18 EGP)'],
        pricing: { 'Grilled Chicken (+25 EGP)': 25, 'Turkey (+20 EGP)': 20, 'Smoked Salmon (+40 EGP)': 40, 'Beef (+30 EGP)': 30, 'Bacon (+20 EGP)': 20, 'Tuna (+18 EGP)': 18 }
      },
      {
        name: 'Sandwich Cheese',
        display_type: 'multi', // Multi selection
        values: ['Mozzarella (+12 EGP)', 'Cheddar (+12 EGP)', 'Feta (+15 EGP)', 'Cream Cheese (+10 EGP)', 'Parmesan (+15 EGP)'],
        pricing: { 'Mozzarella (+12 EGP)': 12, 'Cheddar (+12 EGP)': 12, 'Feta (+15 EGP)': 15, 'Cream Cheese (+10 EGP)': 10, 'Parmesan (+15 EGP)': 15 }
      },
      {
        name: 'Sandwich Vegetables',
        display_type: 'multi', // Multi selection
        values: ['Lettuce', 'Tomato', 'Cucumber', 'Onions', 'Bell Peppers (+8 EGP)', 'Olives (+8 EGP)', 'Pickles', 'Jalapeños (+8 EGP)', 'Mushrooms (+10 EGP)', 'Avocado (+15 EGP)'],
        pricing: { 'Lettuce': 0, 'Tomato': 0, 'Cucumber': 0, 'Onions': 0, 'Bell Peppers (+8 EGP)': 8, 'Olives (+8 EGP)': 8, 'Pickles': 0, 'Jalapeños (+8 EGP)': 8, 'Mushrooms (+10 EGP)': 10, 'Avocado (+15 EGP)': 15 }
      },
      {
        name: 'Sandwich Sauces',
        display_type: 'multi', // Multi selection
        values: ['Mayo', 'Mustard', 'Ketchup', 'Ranch (+8 EGP)', 'BBQ (+8 EGP)', 'Caesar (+8 EGP)', 'Hummus (+10 EGP)', 'Pesto (+12 EGP)'],
        pricing: { 'Mayo': 0, 'Mustard': 0, 'Ketchup': 0, 'Ranch (+8 EGP)': 8, 'BBQ (+8 EGP)': 8, 'Caesar (+8 EGP)': 8, 'Hummus (+10 EGP)': 10, 'Pesto (+12 EGP)': 12 }
      },
    ];

    for (const group of attributeGroups) {
      // Check if attribute exists
      let attribute = await odoo.searchRead('product.attribute',
        [['name', '=', group.name]],
        ['id']
      );

      let attrId: number;

      if (attribute.length === 0) {
        // Create attribute
        attrId = await odoo.rpc('product.attribute', 'create', [{
          name: group.name,
          display_type: group.display_type,
          create_variant: 'no_variant',
        }]);
        console.log(`  ✓ Created attribute: ${group.name}`);

        // Create values
        for (const value of group.values) {
          await odoo.rpc('product.attribute.value', 'create', [{
            attribute_id: attrId,
            name: value,
          }]);
        }
      } else {
        attrId = attribute[0].id;
        console.log(`  ℹ️  Attribute '${group.name}' already exists`);
      }

      // Check if already applied to Custom Sandwich
      const existingLine = await odoo.searchRead('product.template.attribute.line',
        [['product_tmpl_id', '=', customSandwichId], ['attribute_id', '=', attrId]],
        ['id']
      );

      if (existingLine.length > 0) {
        console.log(`  ℹ️  '${group.name}' already applied to Custom Sandwich`);
        continue;
      }

      // Get all values for this attribute
      const attrValues = await odoo.searchRead('product.attribute.value',
        [['attribute_id', '=', attrId]],
        ['id', 'name']
      );

      const valueIds = attrValues.map(v => v.id);

      // Apply to Custom Sandwich
      const lineId = await odoo.rpc('product.template.attribute.line', 'create', [{
        product_tmpl_id: customSandwichId,
        attribute_id: attrId,
        value_ids: [[6, 0, valueIds]],
      }]);

      console.log(`  ✓ Applied '${group.name}' to Custom Sandwich`);

      // Set pricing for each value
      for (const attrValue of attrValues) {
        const price = group.pricing[attrValue.name] || 0;

        const ptavs = await odoo.searchRead('product.template.attribute.value',
          [['product_tmpl_id', '=', customSandwichId], ['product_attribute_value_id', '=', attrValue.id]],
          ['id']
        );

        if (ptavs.length > 0) {
          await odoo.rpc('product.template.attribute.value', 'write', [[ptavs[0].id], {
            price_extra: price,
          }]);
        }
      }

      console.log(`  ✓ Set pricing for '${group.name}'`);
    }
  }

  // Sync to POS
  console.log('\n📝 Step 4: Syncing all food items to POS...');
  const posCategories = await odoo.searchRead('pos.category',
    [['name', '=', 'Food']],
    ['id']
  );

  let posFoodCategoryId: number;
  if (posCategories.length === 0) {
    posFoodCategoryId = await odoo.rpc('pos.category', 'create', [{ name: 'Food' }]);
  } else {
    posFoodCategoryId = posCategories[0].id;
  }

  const allFood = await odoo.searchRead('product.template',
    [['categ_id', '=', foodCategoryId]],
    ['id']
  );

  for (const item of allFood) {
    await odoo.rpc('product.template', 'write', [[item.id], {
      available_in_pos: true,
      pos_categ_ids: [[6, 0, [posFoodCategoryId]]],
    }]);
  }

  console.log(`  ✓ Synced ${allFood.length} food items to POS`);

  console.log('\n✅ Sandwich Menu Expansion Complete!\n');
  console.log('📊 Summary:');
  console.log('='.repeat(70));
  console.log(`  Premium Sandwiches Created:    ${createdCount}`);
  console.log(`  Ingredients Created:           ${ingredientsCreated}`);
  console.log(`  Total Food Items:              ${allFood.length}`);
  console.log(`  Custom Sandwich Configured:    ✓`);
  console.log(`  Multi-Select Attributes:       5 groups`);
  console.log('='.repeat(70));

  console.log('\n🥪 Sandwich Menu (60-145 EGP):');
  console.log('  • Veggie Mediterranean (75 EGP)');
  console.log('  • Turkey & Cheese Classic (85 EGP)');
  console.log('  • Chicken Caesar Wrap (85 EGP)');
  console.log('  • Caprese Panini (90 EGP)');
  console.log('  • Grilled Chicken Supreme (95 EGP)');
  console.log('  • BBQ Chicken Ranch (100 EGP)');
  console.log('  • Italian Supreme (110 EGP)');
  console.log('  • Elite Signature Club (120 EGP)');
  console.log('  • Philadelphia Steak (135 EGP)');
  console.log('  • Smoked Salmon Deluxe (145 EGP)');

  console.log('\n🔧 Custom Sandwich:');
  console.log('  Base: 60 EGP');
  console.log('  + Choose Bread (0-8 EGP)');
  console.log('  + Add Proteins (18-40 EGP each)');
  console.log('  + Add Cheese (10-15 EGP each)');
  console.log('  + Add Vegetables (0-15 EGP each)');
  console.log('  + Add Sauces (0-12 EGP each)');
  console.log('  Range: 60-200+ EGP');

  console.log('\n💡 Next Steps:');
  console.log('   1. Close and reopen POS session');
  console.log('   2. Test Custom Sandwich multi-selection');
  console.log('   3. Sync to website');
}

expandSandwichMenu().catch(console.error);

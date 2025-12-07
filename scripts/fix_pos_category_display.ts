import { createOdooClient } from '../src/server/utils/odooClient';

// Our desired short categories for POS display
const DESIRED_POS_CATEGORIES = [
  'Coffee',
  'Tea',
  'Iced',
  'Frappe',
  'Milkshake',
  'Smoothie',
  'Soda',
  'Food',
  'Extras',
  'Services',
  'Offers',
];

// Categories to hide/deactivate in POS
const CATEGORIES_TO_HIDE = [
  'Elite Essentials',
  'Hot Drinks / Tea',
  'Hot Drinks / Coffee',
  'Hot Drinks',
  'Iced Drinks',
  'Drinks',
  'Specialty Drinks / Frappe',
  'Specialty Drinks / Milkshake',
  'Soda & Refreshers',
  'Crushes & Purees',
  'Boba',
  'ELITE SPECIAL',
  'Expenses',
  'Sauces',
  'Sides',
  'Toppings',
];

async function main() {
  const client = createOdooClient();
  if (!client) {
    console.error('[ERROR] Odoo client could not be created. Check env credentials.');
    return;
  }

  console.log('[INFO] Step 1: Fetching all pos.category records...');
  const posCategories = await client.searchRead(
    'pos.category',
    [],
    ['id', 'name'],
    { limit: 1000 }
  );

  console.log(`[INFO] Found ${posCategories.length} pos.category records`);

  // Step 1: Archive unwanted categories
  console.log('\n[INFO] Step 2: Hiding unwanted POS categories...');
  let hiddenCount = 0;
  for (const cat of posCategories) {
    const name = cat.name as string;
    const id = cat.id as number;

    if (CATEGORIES_TO_HIDE.includes(name)) {
      try {
        await (client as any).rpc('pos.category', 'write', [[id], { active: false }]);
        console.log(`  ✓ Hidden: ${name}`);
        hiddenCount++;
      } catch (e) {
        console.error(`  ✗ Failed to hide ${name}:`, (e as Error).message);
      }
    }
  }

  // Step 2: Ensure our desired categories exist and are active
  console.log('\n[INFO] Step 3: Ensuring short categories exist and are active...');
  const existingNames = new Set(posCategories.map(c => c.name as string));
  let createdCount = 0;
  let activatedCount = 0;

  for (const categoryName of DESIRED_POS_CATEGORIES) {
    if (!existingNames.has(categoryName)) {
      try {
        await (client as any).rpc('pos.category', 'create', [[{ name: categoryName, active: true }]], {});
        console.log(`  ✓ Created: ${categoryName}`);
        createdCount++;
      } catch (e) {
        console.error(`  ✗ Failed to create ${categoryName}:`, (e as Error).message);
      }
    } else {
      // Make sure it's active
      const existing = posCategories.find((c: any) => c.name === categoryName);
      if (existing) {
        try {
          await (client as any).rpc('pos.category', 'write', [[existing.id], { active: true }]);
          console.log(`  ✓ Activated: ${categoryName}`);
          activatedCount++;
        } catch (e) {
          // Might already be active, that's fine
        }
      }
    }
  }

  console.log('\n[RESULT]');
  console.log(`Hidden: ${hiddenCount} old categories`);
  console.log(`Created: ${createdCount} new categories`);
  console.log(`Activated: ${activatedCount} existing categories`);

  console.log('\n[INFO] Step 4: Linking products to POS categories...');
  // Now link products based on their internal category
  const productTemplates = await client.searchRead(
    'product.template',
    [['available_in_pos', '=', true]],
    ['id', 'name', 'categ_id'],
    { limit: 1000 }
  );

  console.log(`[INFO] Found ${productTemplates.length} products available in POS`);

  // Get fresh pos.category list
  const activePosCategories = await client.searchRead(
    'pos.category',
    [['active', '=', true]],
    ['id', 'name'],
    { limit: 1000 }
  );

  const posCatMap = new Map<string, number>();
  activePosCategories.forEach((c: any) => {
    posCatMap.set(c.name as string, c.id as number);
  });

  let linkedCount = 0;
  let skippedCount = 0;

  for (const prod of productTemplates) {
    const prodId = prod.id as number;
    const prodName = prod.name as string;
    const categId = prod.categ_id as [number, string] | false;

    if (!categId) {
      skippedCount++;
      continue;
    }

    const internalCategName = categId[1];
    
    // Find matching POS category
    let posCategId: number | null = null;
    if (posCatMap.has(internalCategName)) {
      posCategId = posCatMap.get(internalCategName)!;
    }

    if (!posCategId) {
      // Category doesn't exist in our short list, skip
      skippedCount++;
      continue;
    }

    try {
      // Try to link via pos_categ_ids (many2many field that might be available)
      await (client as any).rpc('product.template', 'write', [
        [prodId],
        { pos_categ_ids: [[6, 0, [posCategId]]] }
      ]);
      console.log(`  ✓ Linked ${prodName} to ${internalCategName}`);
      linkedCount++;
    } catch (e) {
      // Field might not be writable, that's okay
      // The POS will use the internal category for display
      skippedCount++;
    }
  }

  console.log('\n[PRODUCT LINKING]');
  console.log(`Linked: ${linkedCount}`);
  console.log(`Skipped: ${skippedCount}`);

  console.log('\n✅ POS category configuration complete!');
  console.log('Please refresh your POS interface to see the changes.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

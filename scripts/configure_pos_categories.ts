import { createOdooClient } from '../src/server/utils/odooClient';

// Categories we want visible in POS (our short categories)
const POS_VISIBLE_CATEGORIES = [
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

// Categories to hide from POS (old/long categories)
const POS_HIDDEN_CATEGORIES = [
  'Hot Drinks',
  'Hot Drinks / Coffee',
  'Hot Drinks / Tea',
  'Iced Drinks',
  'Specialty Drinks / Frappe',
  'Specialty Drinks / Milkshake',
  'Soda & Refreshers',
  'Crushes & Purees',
  'Boba',
  'ELITE SPECIAL',
  'Elite Essentials',
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

  console.log('[INFO] Fetching all product categories...');
  const allCategories = await client.searchRead(
    'product.category',
    [],
    ['id', 'name'],
    { limit: 1000 }
  );

  console.log(`[INFO] Found ${allCategories.length} categories in total`);

  const toShow: Array<{ id: number; name: string }> = [];
  const toHide: Array<{ id: number; name: string }> = [];
  const unchanged: Array<{ id: number; name: string }> = [];

  for (const cat of allCategories) {
    const name = cat.name as string;
    const id = cat.id as number;
    
    if (POS_VISIBLE_CATEGORIES.includes(name)) {
      toShow.push({ id, name });
    } else if (POS_HIDDEN_CATEGORIES.includes(name)) {
      toHide.push({ id, name });
    } else {
      unchanged.push({ id, name });
    }
  }

  console.log('\n[PLAN]');
  console.log(`Categories to SHOW in POS (${toShow.length}):`);
  toShow.forEach(c => console.log(`  ✓ ${c.name} (${c.id})`));
  
  console.log(`\nCategories to HIDE from POS (${toHide.length}):`);
  toHide.forEach(c => console.log(`  ✗ ${c.name} (${c.id})`));
  
  console.log(`\nCategories UNCHANGED (${unchanged.length}):`);
  unchanged.forEach(c => console.log(`  - ${c.name} (${c.id})`));

  // Note: product.category doesn't have a POS-specific visibility field in standard Odoo
  // We'll create pos.category records for the ones we want visible
  console.log('\n[INFO] Checking pos.category records...');
  
  const posCategories = await client.searchRead(
    'pos.category',
    [],
    ['id', 'name'],
    { limit: 1000 }
  );
  
  console.log(`[INFO] Found ${posCategories.length} existing pos.category records`);
  
  const existingPosNames = new Set(posCategories.map((c: any) => c.name as string));
  const created: string[] = [];
  const skipped: string[] = [];

  for (const cat of toShow) {
    if (existingPosNames.has(cat.name)) {
      skipped.push(cat.name);
    } else {
      try {
        await (client as any).rpc('pos.category', 'create', [[{ name: cat.name }]], {});
        created.push(cat.name);
        console.log(`[SUCCESS] Created pos.category: ${cat.name}`);
      } catch (e) {
        console.error(`[ERROR] Failed to create pos.category ${cat.name}:`, (e as Error).message);
      }
    }
  }

  console.log('\n[RESULT]');
  console.log(`Created ${created.length} new pos.category records`);
  console.log(`Skipped ${skipped.length} (already exist)`);
  
  if (created.length > 0) {
    console.log('\nCreated categories:');
    created.forEach(name => console.log(`  ✓ ${name}`));
  }

  console.log('\n[NEXT STEPS]');
  console.log('1. Products are already assigned to internal categories via categ_id');
  console.log('2. POS categories created for your short categories');
  console.log('3. You may need to manually link products to pos.category in Odoo UI if needed');
  console.log('4. Or run the product assignment script to set available_in_pos=true on products');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

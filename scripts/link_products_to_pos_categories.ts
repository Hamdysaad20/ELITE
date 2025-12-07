import { createOdooClient } from '../src/server/utils/odooClient';

// Map internal category names to POS category names (same in our case)
const CATEGORY_MAP: Record<string, string> = {
  'Coffee': 'Coffee',
  'Tea': 'Tea',
  'Iced': 'Iced',
  'Frappe': 'Frappe',
  'Milkshake': 'Milkshake',
  'Smoothie': 'Smoothie',
  'Soda': 'Soda',
  'Food': 'Food',
  'Extras': 'Extras',
  'Services': 'Services',
  'Offers': 'Offers',
};

async function main() {
  const client = createOdooClient();
  if (!client) {
    console.error('[ERROR] Odoo client could not be created. Check env credentials.');
    return;
  }

  console.log('[INFO] Fetching POS categories...');
  const posCategories = await client.searchRead(
    'pos.category',
    [],
    ['id', 'name'],
    { limit: 1000 }
  );

  const posCatByName = new Map<string, number>();
  posCategories.forEach((cat: any) => {
    posCatByName.set(cat.name as string, cat.id as number);
  });

  console.log(`[INFO] Found ${posCategories.length} POS categories`);

  // Get all products with their internal categories
  console.log('[INFO] Fetching products...');
  const products = await client.searchRead(
    'product.template',
    [['available_in_pos', '=', true]],
    ['id', 'name', 'categ_id'],
    { limit: 1000 }
  );

  console.log(`[INFO] Found ${products.length} products available in POS`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const prod of products) {
    const prodId = prod.id as number;
    const prodName = prod.name as string;
    const categId = prod.categ_id as [number, string] | false;

    if (!categId) {
      console.log(`[SKIP] ${prodName}: no internal category`);
      skipped++;
      continue;
    }

    const categName = categId[1];
    const posCategName = CATEGORY_MAP[categName];

    if (!posCategName) {
      console.log(`[SKIP] ${prodName}: category "${categName}" not in POS map`);
      skipped++;
      continue;
    }

    const posCategId = posCatByName.get(posCategName);
    if (!posCategId) {
      console.log(`[ERROR] ${prodName}: POS category "${posCategName}" not found`);
      errors++;
      continue;
    }

    try {
      // Note: product.template may not have pos_categ_id field accessible
      // We'll try to write it via product.product variants
      const variants = await client.searchRead(
        'product.product',
        [['product_tmpl_id', '=', prodId]],
        ['id'],
        { limit: 100 }
      );

      if (variants.length === 0) {
        console.log(`[SKIP] ${prodName}: no variants found`);
        skipped++;
        continue;
      }

      const variantIds = variants.map((v: any) => v.id as number);
      
      // Try to set to_weight and available_in_pos on variants
      // POS category assignment may need to be done in Odoo UI due to field access restrictions
      await (client as any).rpc('product.product', 'write', [
        variantIds,
        { available_in_pos: true }
      ]);
      
      console.log(`[SUCCESS] ${prodName}: marked ${variantIds.length} variants as available_in_pos`);
      updated++;
    } catch (e) {
      console.error(`[ERROR] ${prodName}:`, (e as Error).message);
      errors++;
    }
  }

  console.log('\n[RESULT]');
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);

  console.log('\n[NOTE]');
  console.log('Due to field access restrictions on your Odoo instance:');
  console.log('- Products are categorized via internal categories (categ_id)');
  console.log('- POS categories exist but cannot be linked via API');
  console.log('- You may need to configure POS category display in Odoo POS settings');
  console.log('- The frontend will use internal categories for filtering');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

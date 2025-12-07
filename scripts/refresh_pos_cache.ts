import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient.js';
dotenv.config();

async function refreshPosCache() {
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  config.timeoutMs = 120000;
  const odoo = new OdooClient(config);

  console.log('🔄 Refreshing POS Cache and Sessions...\n');

  // Step 1: Check for open POS sessions
  console.log('📝 Step 1: Checking POS Sessions...');
  const openSessions = await odoo.searchRead('pos.session',
    [['state', '=', 'opened']],
    ['id', 'name', 'config_id', 'start_at', 'user_id']
  );

  if (openSessions.length > 0) {
    console.log(`  ⚠️  Found ${openSessions.length} open POS session(s):`);
    for (const session of openSessions) {
      const configName = Array.isArray(session.config_id) ? session.config_id[1] : 'Unknown';
      const userName = Array.isArray(session.user_id) ? session.user_id[1] : 'Unknown';
      console.log(`     - Session: ${session.name}`);
      console.log(`       Config: ${configName}`);
      console.log(`       User: ${userName}`);
      console.log(`       Started: ${session.start_at}`);
    }
    console.log(`\n  ⚠️  IMPORTANT: You need to close and reopen the POS session to see changes!`);
    console.log(`     Go to: Point of Sale > Dashboard > Close Session\n`);
  } else {
    console.log(`  ✓ No open POS sessions found\n`);
  }

  // Step 2: Verify all extras are available
  console.log('📝 Step 2: Verifying Extras Availability...');
  const extrasProducts = await odoo.searchRead('product.template',
    [['categ_id.name', '=', 'Extras']],
    ['id', 'name', 'available_in_pos', 'list_price']
  );

  const notAvailable = extrasProducts.filter(p => !p.available_in_pos);
  
  if (notAvailable.length > 0) {
    console.log(`  ⚠️  Found ${notAvailable.length} extras NOT available in POS:`);
    for (const product of notAvailable.slice(0, 10)) {
      console.log(`     - ${product.name} (${product.list_price} EGP)`);
    }
    if (notAvailable.length > 10) {
      console.log(`     ... and ${notAvailable.length - 10} more`);
    }
  } else {
    console.log(`  ✓ All ${extrasProducts.length} extras are available in POS`);
  }

  // Step 3: Show product counts by category
  console.log('\n📝 Step 3: Product Distribution by Category...');
  const categories = await odoo.searchRead('product.category',
    [],
    ['id', 'name']
  );

  const categoryCounts: Record<string, { total: number; available: number }> = {};

  for (const category of categories) {
    const products = await odoo.searchRead('product.template',
      [['categ_id', '=', category.id]],
      ['id', 'available_in_pos']
    );

    const available = products.filter(p => p.available_in_pos).length;
    
    if (products.length > 0) {
      categoryCounts[category.name] = {
        total: products.length,
        available: available
      };
    }
  }

  console.log('\n  Category Distribution:');
  console.log('  ' + '='.repeat(60));
  
  const sortedCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1].total - a[1].total);

  for (const [name, counts] of sortedCategories) {
    const status = counts.available === counts.total ? '✓' : '⚠️';
    console.log(`  ${status} ${name.padEnd(30)} : ${counts.available}/${counts.total} in POS`);
  }

  // Step 4: Get product attributes info
  console.log('\n📝 Step 4: Checking Product Attributes...');
  const attributeLines = await odoo.searchRead('product.template.attribute.line',
    [],
    ['id', 'product_tmpl_id', 'attribute_id']
  );

  console.log(`  ✓ Found ${attributeLines.length} attribute configurations`);

  // Get unique products with attributes
  const productsWithAttrs = new Set(
    attributeLines.map(line => 
      Array.isArray(line.product_tmpl_id) ? line.product_tmpl_id[0] : line.product_tmpl_id
    )
  );

  console.log(`  ✓ ${productsWithAttrs.size} products have customization attributes`);

  // Sample some products with attributes
  const sampleProducts = await odoo.searchRead('product.template',
    [['id', 'in', Array.from(productsWithAttrs).slice(0, 10)]],
    ['id', 'name', 'categ_id']
  );

  console.log('\n  Sample products with attributes:');
  for (const product of sampleProducts) {
    const categoryName = Array.isArray(product.categ_id) ? product.categ_id[1] : 'Unknown';
    console.log(`     - ${product.name} (${categoryName})`);
  }

  console.log('\n✅ POS Cache Refresh Complete!\n');
  console.log('📊 Summary:');
  console.log('='.repeat(70));
  console.log(`  Total Products in POS:         ${extrasProducts.length + Object.values(categoryCounts).reduce((sum, c) => sum + c.total, 0) - extrasProducts.length}`);
  console.log(`  Extras Available:              ${extrasProducts.length}`);
  console.log(`  Products with Attributes:      ${productsWithAttrs.size}`);
  console.log(`  Open POS Sessions:             ${openSessions.length}`);
  console.log('='.repeat(70));

  if (openSessions.length > 0) {
    console.log('\n⚠️  ACTION REQUIRED:');
    console.log('   Your POS session is still open with old cached data.');
    console.log('   To see the new changes:');
    console.log('   1. Go to Point of Sale > Dashboard');
    console.log('   2. Click "Close Session" button');
    console.log('   3. Click "New Session" to start fresh');
    console.log('   4. All new products and extras will be loaded!\n');
  } else {
    console.log('\n✅ Ready! Open a new POS session to see all changes!\n');
  }
}

refreshPosCache().catch(console.error);

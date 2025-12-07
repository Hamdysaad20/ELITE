/**
 * Get COMPLETE picture of all products including archived
 */

import { createOdooClient } from '../src/server/utils/odooClient';

async function main() {
  const odoo = createOdooClient();
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  COMPLETE PRODUCT INVENTORY');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  // Get ALL products
  const allProducts = await odoo.searchRead(
    'product.template',
    [],
    ['id', 'name', 'active', 'categ_id', 'list_price', 'default_code'],
    { limit: 5000, order: 'id' }
  );
  
  console.log(`Total products in database: ${allProducts.length}\n`);
  
  const active = allProducts.filter(p => p.active);
  const archived = allProducts.filter(p => !p.active);
  
  console.log(`Active: ${active.length}`);
  console.log(`Archived: ${archived.length}\n`);
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ACTIVE PRODUCTS (Should show in POS)');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const byCategory = new Map<string, any[]>();
  active.forEach(p => {
    const categ = p.categ_id ? p.categ_id[1] : 'NO CATEGORY';
    if (!byCategory.has(categ)) {
      byCategory.set(categ, []);
    }
    byCategory.get(categ)!.push(p);
  });
  
  Array.from(byCategory.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([category, products]) => {
      console.log(`\n${category} (${products.length} products):`);
      products.forEach(p => {
        console.log(`  [${p.id}] ${p.name} - ${p.list_price} SAR (SKU: ${p.default_code || 'N/A'})`);
      });
    });
  
  console.log('\n\n═══════════════════════════════════════════════════════════');
  console.log('  ARCHIVED PRODUCTS (Hidden from POS)');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  if (archived.length > 0) {
    console.log('Sample archived products (first 50):');
    archived.slice(0, 50).forEach(p => {
      const categ = p.categ_id ? p.categ_id[1] : 'NO CATEGORY';
      console.log(`  [${p.id}] ${p.name} - ${p.list_price} SAR (${categ})`);
    });
    
    if (archived.length > 50) {
      console.log(`\n  ... and ${archived.length - 50} more archived products\n`);
    }
    
    // Show what types of products are archived
    const archivedByName = new Map<string, number>();
    archived.forEach(p => {
      const name = p.name.toLowerCase();
      if (name.includes('latte')) archivedByName.set('Latte variations', (archivedByName.get('Latte variations') || 0) + 1);
      else if (name.includes('cappuccino')) archivedByName.set('Cappuccino variations', (archivedByName.get('Cappuccino variations') || 0) + 1);
      else if (name.includes('americano')) archivedByName.set('Americano variations', (archivedByName.get('Americano variations') || 0) + 1);
      else if (name.includes('mocha')) archivedByName.set('Mocha variations', (archivedByName.get('Mocha variations') || 0) + 1);
      else if (name.includes('frappe') || name.includes('frappé')) archivedByName.set('Frappé variations', (archivedByName.get('Frappé variations') || 0) + 1);
      else if (name.includes('smoothie')) archivedByName.set('Smoothie variations', (archivedByName.get('Smoothie variations') || 0) + 1);
      else if (name.includes('milkshake')) archivedByName.set('Milkshake variations', (archivedByName.get('Milkshake variations') || 0) + 1);
      else if (name.includes('soda')) archivedByName.set('Soda variations', (archivedByName.get('Soda variations') || 0) + 1);
      else if (name.includes('tea') || name.includes('chai')) archivedByName.set('Tea variations', (archivedByName.get('Tea variations') || 0) + 1);
      else if (name.includes('cake') || name.includes('cookie')) archivedByName.set('Food items', (archivedByName.get('Food items') || 0) + 1);
      else archivedByName.set('Other', (archivedByName.get('Other') || 0) + 1);
    });
    
    console.log('\nArchived products by type:');
    Array.from(archivedByName.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
  }
  
  console.log('\n\n═══════════════════════════════════════════════════════════');
  console.log('  SUMMARY & RECOMMENDATIONS');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log(`You have ${archived.length} archived products that could potentially be restored.`);
  console.log(`Currently only ${active.length} products are active and available.\n`);
  
  if (archived.length > 300) {
    console.log('⚠️  WARNING: Many products are archived!');
    console.log('This might have happened during cleanup/consolidation.\n');
    console.log('Options:');
    console.log('  1. Keep current state (36 active products only)');
    console.log('  2. Selectively restore important products');
    console.log('  3. Restore all archived products\n');
  }
}

main().catch(console.error);

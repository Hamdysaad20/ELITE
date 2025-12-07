/**
 * Match products from file with Odoo by name and restore/recategorize
 */

import { createOdooClient } from '../src/server/utils/odooClient';
import * as fs from 'fs';
import * as path from 'path';

interface ProductFromFile {
  id: string;
  name: string;
  price: number;
  category: string;
  sku: string;
}

// Map old categories to new short categories
function mapToShortCategory(oldCategory: string, name: string): string {
  const nameLower = name.toLowerCase();
  
  // Iced drinks get priority
  if (nameLower.includes('iced') || nameLower.includes('ice ')) {
    if (!nameLower.includes('service')) {
      return 'Iced';
    }
  }
  
  // Specific patterns
  if (nameLower.includes('frappé') || nameLower.includes('frappe')) return 'Frappe';
  if (nameLower.includes('milkshake')) return 'Milkshake';
  if (nameLower.includes('smoothie')) return 'Smoothie';
  if (nameLower.includes('soda') || (nameLower.includes('lemon') && !nameLower.includes('lemon cake'))) return 'Soda';
  
  if (nameLower.includes('tea') || nameLower.includes('chai') || nameLower.includes('hibiscus') || nameLower.includes('karak')) {
    if (!nameLower.includes('iced')) return 'Tea';
  }
  
  if (nameLower.includes('espresso') || nameLower.includes('americano') ||
      nameLower.includes('latte') || nameLower.includes('cappuccino') ||
      nameLower.includes('mocha') || nameLower.includes('macchiato') ||
      nameLower.includes('cortado') || nameLower.includes('flat white') ||
      nameLower.includes('turkish coffee') || nameLower.includes('french coffee')) {
    if (!nameLower.includes('iced')) return 'Coffee';
  }
  
  if (nameLower.includes('cake') || nameLower.includes('brownie') ||
      nameLower.includes('cookie') || nameLower.includes('burger') ||
      nameLower.includes('sandwich')) return 'Food';
  
  if (nameLower.includes('extra') || nameLower.includes('topping') ||
      (nameLower.includes('boba') && !nameLower.includes('bestie')) ||
      nameLower.includes('shot') || nameLower.includes('cream') ||
      nameLower.includes('honey') || nameLower.includes('marshmello') ||
      nameLower.includes('coconut milk') || nameLower.includes('flavor')) return 'Extras';
  
  if (nameLower.includes('offer') || nameLower.includes('bestie') ||
      nameLower.includes('discount') || nameLower.includes('morning bird')) return 'Offers';
  
  if (nameLower.includes('gift card') || nameLower.includes('e-wallet') ||
      nameLower.includes('ewallet') || nameLower.includes('top-up') ||
      nameLower.includes('regester') || nameLower.includes('register')) return 'Services';
  
  // Default based on old category
  if (oldCategory.includes('Coffee')) return 'Coffee';
  if (oldCategory.includes('Tea')) return 'Tea';
  if (oldCategory.includes('Iced')) return 'Iced';
  if (oldCategory.includes('Frappe')) return 'Frappe';
  if (oldCategory.includes('Milkshake')) return 'Milkshake';
  if (oldCategory.includes('Smoothie')) return 'Smoothie';
  if (oldCategory.includes('Soda')) return 'Soda';
  if (oldCategory.includes('Food')) return 'Food';
  
  return 'Coffee'; // Default
}

async function main() {
  const odoo = createOdooClient();
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  COMPREHENSIVE PRODUCT ANALYSIS & FIX');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  // Load reference file
  const filePath = path.join(process.cwd(), 'data/all_products_list.json');
  const fileProducts: ProductFromFile[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  // Get unique names from file (deduplicate)
  const uniqueFileProducts = new Map<string, ProductFromFile>();
  fileProducts.forEach(p => {
    const key = p.name.toLowerCase().trim();
    if (!uniqueFileProducts.has(key) || p.category !== 'Uncategorized') {
      uniqueFileProducts.set(key, p);
    }
  });
  
  console.log(`[INFO] Reference file has ${uniqueFileProducts.size} unique products\n`);
  
  // Get all products from Odoo (including archived)
  const odooProducts = await odoo.searchRead(
    'product.template',
    [],
    ['id', 'name', 'active', 'categ_id'],
    { limit: 5000 }
  );
  
  // Create name-based map
  const odooByName = new Map<string, any>();
  odooProducts.forEach(p => {
    const key = p.name.toLowerCase().trim();
    odooByName.set(key, p);
  });
  
  console.log(`[INFO] Odoo has ${odooProducts.length} products\n`);
  
  //Analysis
  const results = {
    inBoth: [] as Array<{file: ProductFromFile, odoo: any}>,
    onlyInFile: [] as ProductFromFile[],
    onlyInOdoo: [] as any[],
    archivedNeedRestore: [] as any[],
    needsRecategorization: [] as Array<{odoo: any, current: string, suggested: string}>
  };
  
  // Check each file product
  uniqueFileProducts.forEach((fileProduct, name) => {
    const odooProduct = odooByName.get(name);
    
    if (odooProduct) {
      results.inBoth.push({ file: fileProduct, odoo: odooProduct });
      
      // Check if archived
      if (!odooProduct.active) {
        results.archivedNeedRestore.push(odooProduct);
      } else {
        // Check categorization
        const currentCateg = odooProduct.categ_id ? odooProduct.categ_id[1] : 'NO CATEGORY';
        const suggestedCateg = mapToShortCategory(fileProduct.category, fileProduct.name);
        
        if (currentCateg !== suggestedCateg) {
          results.needsRecategorization.push({
            odoo: odooProduct,
            current: currentCateg,
            suggested: suggestedCateg
          });
        }
      }
    } else {
      results.onlyInFile.push(fileProduct);
    }
  });
  
  // Check for products only in Odoo
  odooProducts.forEach(p => {
    const name = p.name.toLowerCase().trim();
    if (!uniqueFileProducts.has(name)) {
      results.onlyInOdoo.push(p);
    }
  });
  
  // Report
  console.log(`[1] PRODUCTS IN BOTH (${results.inBoth.length})`);
  console.log(`[2] ONLY IN FILE - MISSING FROM ODOO (${results.onlyInFile.length})`);
  console.log(`[3] ONLY IN ODOO - NOT IN FILE (${results.onlyInOdoo.length})`);
  console.log(`[4] ARCHIVED - NEED RESTORE (${results.archivedNeedRestore.length})`);
  console.log(`[5] NEEDS RECATEGORIZATION (${results.needsRecategorization.length})\n`);
  
  console.log('═══════════════════════════════════════════════════════════\n');
  
  if (results.onlyInFile.length > 0) {
    console.log(`❌ WARNING: ${results.onlyInFile.length} products from file are completely missing from Odoo!`);
    console.log('These products need to be recreated.\n');
    console.log('Sample missing products:');
    results.onlyInFile.slice(0, 20).forEach(p => {
      console.log(`  • ${p.name} (${p.category}) - ${p.price} SAR`);
    });
    if (results.onlyInFile.length > 20) {
      console.log(`  ... and ${results.onlyInFile.length - 20} more\n`);
    }
  }
  
  if (results.archivedNeedRestore.length > 0) {
    console.log(`\n[ACTION NEEDED] Restore ${results.archivedNeedRestore.length} archived products\n`);
  }
  
  if (results.needsRecategorization.length > 0) {
    console.log(`\n[ACTION NEEDED] Fix ${results.needsRecategorization.length} categorization issues`);
    console.log('\nSample issues:');
    results.needsRecategorization.slice(0, 10).forEach(issue => {
      console.log(`  • ${issue.odoo.name}: ${issue.current} → ${issue.suggested}`);
    });
    if (results.needsRecategorization.length > 10) {
      console.log(`  ... and ${results.needsRecategorization.length - 10} more\n`);
    }
  }
}

main().catch(console.error);

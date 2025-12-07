/**
 * Comprehensive analysis of product categorization issues
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

async function main() {
  const odoo = createOdooClient();
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  PRODUCT CATEGORIZATION ANALYSIS');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  // Load the file list
  const filePath = path.join(process.cwd(), 'data/all_products_list.json');
  const fileProducts: ProductFromFile[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  console.log(`[INFO] Loaded ${fileProducts.length} products from file\n`);
  
  // Get all products from Odoo
  const odooProducts = await odoo.searchRead(
    'product.template',
    [['active', '=', true]],
    ['id', 'name', 'categ_id', 'list_price', 'default_code'],
    { limit: 2000, order: 'name' }
  );
  
  console.log(`[INFO] Found ${odooProducts.length} active products in Odoo\n`);
  
  // Create maps for comparison
  const fileProductsByName = new Map<string, ProductFromFile[]>();
  fileProducts.forEach(p => {
    const key = p.name.toLowerCase().trim();
    if (!fileProductsByName.has(key)) {
      fileProductsByName.set(key, []);
    }
    fileProductsByName.get(key)!.push(p);
  });
  
  const odooProductsByName = new Map<string, any[]>();
  odooProducts.forEach(p => {
    const key = p.name.toLowerCase().trim();
    if (!odooProductsByName.has(key)) {
      odooProductsByName.set(key, []);
    }
    odooProductsByName.get(key)!.push(p);
  });
  
  // Analysis 1: Products in file but not in Odoo (MISSING)
  console.log('[1] MISSING PRODUCTS (in file but not in Odoo):');
  console.log('─────────────────────────────────────────────────────────\n');
  
  const missingProducts: ProductFromFile[] = [];
  fileProducts.forEach(fileProduct => {
    const key = fileProduct.name.toLowerCase().trim();
    if (!odooProductsByName.has(key)) {
      missingProducts.push(fileProduct);
    }
  });
  
  if (missingProducts.length > 0) {
    console.log(`Found ${missingProducts.length} missing products:\n`);
    
    // Group by original category
    const byCategory = new Map<string, ProductFromFile[]>();
    missingProducts.forEach(p => {
      if (!byCategory.has(p.category)) {
        byCategory.set(p.category, []);
      }
      byCategory.get(p.category)!.push(p);
    });
    
    Array.from(byCategory.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .forEach(([category, products]) => {
        console.log(`  ${category} (${products.length} products):`);
        products.forEach(p => {
          console.log(`    • [${p.id}] ${p.name} - ${p.price} SAR (${p.sku})`);
        });
        console.log();
      });
  } else {
    console.log('  ✅ No missing products\n');
  }
  
  // Analysis 2: Categorization issues
  console.log('[2] CATEGORIZATION ISSUES:');
  console.log('─────────────────────────────────────────────────────────\n');
  
  const categorizationIssues: Array<{
    name: string;
    odooId: number;
    currentCategory: string;
    suggestedCategory: string;
    reason: string;
  }> = [];
  
  odooProducts.forEach(odooProduct => {
    const name = odooProduct.name;
    const currentCateg = odooProduct.categ_id ? odooProduct.categ_id[1] : 'NO CATEGORY';
    let suggestedCateg = currentCateg;
    let reason = '';
    
    const nameLower = name.toLowerCase();
    
    // Iced drinks should be in "Iced" category
    if ((nameLower.includes('iced') || nameLower.includes('ice ')) && 
        !nameLower.includes('service') && 
        currentCateg !== 'Iced' &&
        !nameLower.includes('icee') && // Icee Chocolate is different
        !nameLower.includes('iced lemon')) { // These might be different
      suggestedCateg = 'Iced';
      reason = 'Contains "iced" in name';
    }
    
    // Frappés should be in "Frappe" category
    else if (nameLower.includes('frappé') || nameLower.includes('frappe')) {
      if (currentCateg !== 'Frappe') {
        suggestedCateg = 'Frappe';
        reason = 'Contains "frappe" in name';
      }
    }
    
    // Milkshakes should be in "Milkshake" category
    else if (nameLower.includes('milkshake')) {
      if (currentCateg !== 'Milkshake') {
        suggestedCateg = 'Milkshake';
        reason = 'Contains "milkshake" in name';
      }
    }
    
    // Smoothies should be in "Smoothie" category
    else if (nameLower.includes('smoothie')) {
      if (currentCateg !== 'Smoothie') {
        suggestedCateg = 'Smoothie';
        reason = 'Contains "smoothie" in name';
      }
    }
    
    // Sodas should be in "Soda" category
    else if (nameLower.includes('soda') || nameLower.includes('lemon')) {
      if (currentCateg !== 'Soda') {
        suggestedCateg = 'Soda';
        reason = 'Contains "soda" or "lemon" in name';
      }
    }
    
    // Tea items should be in "Tea" category
    else if (nameLower.includes('tea') || nameLower.includes('chai') || 
             nameLower.includes('hibiscus') || nameLower.includes('karak')) {
      if (currentCateg !== 'Tea' && currentCateg !== 'Iced') { // Iced chai can stay in Iced
        suggestedCateg = 'Tea';
        reason = 'Tea-related item';
      }
    }
    
    // Coffee items should be in "Coffee" category
    else if (nameLower.includes('espresso') || nameLower.includes('americano') ||
             nameLower.includes('latte') || nameLower.includes('cappuccino') ||
             nameLower.includes('mocha') || nameLower.includes('macchiato') ||
             nameLower.includes('cortado') || nameLower.includes('flat white') ||
             nameLower.includes('turkish coffee') || nameLower.includes('french coffee')) {
      if (currentCateg !== 'Coffee' && currentCateg !== 'Iced') { // Iced coffee can stay in Iced
        suggestedCateg = 'Coffee';
        reason = 'Coffee-related item';
      }
    }
    
    // Food items
    else if (nameLower.includes('cake') || nameLower.includes('brownie') ||
             nameLower.includes('cookie') || nameLower.includes('burger') ||
             nameLower.includes('sandwich')) {
      if (currentCateg !== 'Food') {
        suggestedCateg = 'Food';
        reason = 'Food item';
      }
    }
    
    // Extras/Toppings
    else if (nameLower.includes('extra') || nameLower.includes('topping') ||
             nameLower.includes('boba') && !nameLower.includes('bestie') ||
             nameLower.includes('shot') || nameLower.includes('cream') ||
             nameLower.includes('honey') || nameLower.includes('marshmello')) {
      if (currentCateg !== 'Extras') {
        suggestedCateg = 'Extras';
        reason = 'Extra/topping item';
      }
    }
    
    // Offers
    else if (nameLower.includes('offer') || nameLower.includes('bestie') ||
             nameLower.includes('discount')) {
      if (currentCateg !== 'Offers') {
        suggestedCateg = 'Offers';
        reason = 'Promotional offer';
      }
    }
    
    // Services
    else if (nameLower.includes('gift card') || nameLower.includes('e-wallet') ||
             nameLower.includes('ewallet') || nameLower.includes('top-up') ||
             nameLower.includes('regester') || nameLower.includes('register')) {
      if (currentCateg !== 'Services') {
        suggestedCateg = 'Services';
        reason = 'Service item';
      }
    }
    
    if (suggestedCateg !== currentCateg) {
      categorizationIssues.push({
        name,
        odooId: odooProduct.id,
        currentCategory: currentCateg,
        suggestedCategory: suggestedCateg,
        reason
      });
    }
  });
  
  if (categorizationIssues.length > 0) {
    console.log(`Found ${categorizationIssues.length} categorization issues:\n`);
    
    // Group by suggested category
    const bySuggested = new Map<string, typeof categorizationIssues>();
    categorizationIssues.forEach(issue => {
      if (!bySuggested.has(issue.suggestedCategory)) {
        bySuggested.set(issue.suggestedCategory, []);
      }
      bySuggested.get(issue.suggestedCategory)!.push(issue);
    });
    
    Array.from(bySuggested.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .forEach(([category, issues]) => {
        console.log(`  → Should be in "${category}" (${issues.length} items):`);
        issues.forEach(issue => {
          console.log(`    • [${issue.odooId}] ${issue.name}`);
          console.log(`      Current: ${issue.currentCategory} | Reason: ${issue.reason}`);
        });
        console.log();
      });
  } else {
    console.log('  ✅ No categorization issues found\n');
  }
  
  // Analysis 3: Products with "Uncategorized"
  console.log('[3] UNCATEGORIZED PRODUCTS:');
  console.log('─────────────────────────────────────────────────────────\n');
  
  const uncategorized = odooProducts.filter(p => {
    const categ = p.categ_id ? p.categ_id[1] : '';
    return categ === 'Uncategorized' || categ === 'All' || categ === '';
  });
  
  console.log(`Found ${uncategorized.length} uncategorized products\n`);
  
  // Analysis 4: Old category products
  console.log('[4] PRODUCTS STILL IN OLD CATEGORIES:');
  console.log('─────────────────────────────────────────────────────────\n');
  
  const oldCategories = [
    'Hot Drinks / Coffee',
    'Hot Drinks / Tea',
    'Hot Drinks',
    'Iced Drinks',
    'Specialty Drinks / Frappe',
    'Specialty Drinks / Milkshake',
    'Specialty Drinks / Smoothies',
    'Soda & Refreshers',
    'Elite Essentials',
    'Crushes & Purees',
    'Toppings',
    'Sauces'
  ];
  
  const inOldCategories = odooProducts.filter(p => {
    const categ = p.categ_id ? p.categ_id[1] : '';
    return oldCategories.includes(categ);
  });
  
  if (inOldCategories.length > 0) {
    console.log(`Found ${inOldCategories.length} products in old categories:\n`);
    
    const byOldCategory = new Map<string, any[]>();
    inOldCategories.forEach(p => {
      const categ = p.categ_id[1];
      if (!byOldCategory.has(categ)) {
        byOldCategory.set(categ, []);
      }
      byOldCategory.get(categ)!.push(p);
    });
    
    Array.from(byOldCategory.entries()).forEach(([category, products]) => {
      console.log(`  ${category} (${products.length} products):`);
      products.forEach(p => {
        console.log(`    • [${p.id}] ${p.name}`);
      });
      console.log();
    });
  } else {
    console.log('  ✅ No products in old categories\n');
  }
  
  // Summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log(`Total products in file: ${fileProducts.length}`);
  console.log(`Total products in Odoo: ${odooProducts.length}`);
  console.log(`Missing products: ${missingProducts.length}`);
  console.log(`Categorization issues: ${categorizationIssues.length}`);
  console.log(`Uncategorized: ${uncategorized.length}`);
  console.log(`In old categories: ${inOldCategories.length}`);
  
  console.log('\n═══════════════════════════════════════════════════════════\n');
}

main().catch(console.error);

/**
 * POS System Analysis - Find All Issues
 * Analyzes all categories and items for inconsistencies and problems
 */

import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient';
import * as fs from 'fs';

dotenv.config();

let client: any;
const FRANCO_SUGAR = ['Sada', 'Alriha', 'Mazboot', 'Mano', 'Zeyada', 'Seryaosy'];
const STANDARD_SIZES = ['Small', 'Medium', 'Large'];

interface Issue {
  category: string;
  item: string;
  itemId: number;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  type: string;
  description: string;
}

const issues: Issue[] = [];

async function analyzeItem(categoryName: string, item: any) {
  const attrLines = await client.searchRead(
    'product.template.attribute.line',
    [['product_tmpl_id', '=', item.id]],
    ['attribute_id', 'value_ids']
  );

  let hasSugar = false;
  let hasCorrectSugar = false;
  let hasSize = false;
  let hasLowercaseSize = false;
  let hasCorrectSize = false;
  let hasDuplicateSize = false;
  let wrongSugarValues: string[] = [];
  let wrongSizeValues: string[] = [];
  let allAttributes: string[] = [];

  for (const line of attrLines) {
    const attr = await client.searchRead('product.attribute', [['id', '=', line.attribute_id[0]]], ['name']);
    const attrName = attr[0]?.name;
    allAttributes.push(attrName);

    const values = await client.searchRead('product.attribute.value', [['id', 'in', line.value_ids]], ['name']);
    const valueNames = values.map((v: any) => v.name);

    if (attrName === 'Sugar Level') {
      hasSugar = true;
      const hasAllFranco = FRANCO_SUGAR.every(fs => valueNames.includes(fs));
      if (hasAllFranco) {
        hasCorrectSugar = true;
      } else {
        wrongSugarValues = valueNames;
      }
    }

    if (attrName === 'Size') {
      hasSize = true;
      const hasStandardSizes = STANDARD_SIZES.every(ss => valueNames.includes(ss));
      if (hasStandardSizes) {
        hasCorrectSize = true;
      } else {
        wrongSizeValues = valueNames;
      }
    }

    if (attrName === 'size') {
      hasLowercaseSize = true;
    }
  }

  hasDuplicateSize = hasSize && hasLowercaseSize;

  // Check for issues
  if (hasDuplicateSize) {
    issues.push({
      category: categoryName,
      item: item.name,
      itemId: item.id,
      severity: 'ERROR',
      type: 'Duplicate Size Attributes',
      description: 'Has both "Size" and "size" attributes - lowercase should be removed'
    });
  }

  if (hasSugar && !hasCorrectSugar) {
    issues.push({
      category: categoryName,
      item: item.name,
      itemId: item.id,
      severity: 'ERROR',
      type: 'Corrupted Sugar Level',
      description: `Sugar values: [${wrongSugarValues.join(', ')}] - Should be Franco-style: [${FRANCO_SUGAR.join(', ')}]`
    });
  }

  if (hasSize && !hasCorrectSize) {
    issues.push({
      category: categoryName,
      item: item.name,
      itemId: item.id,
      severity: 'WARNING',
      type: 'Non-Standard Size Values',
      description: `Size values: [${wrongSizeValues.join(', ')}] - Should be: [${STANDARD_SIZES.join(', ')}]`
    });
  }

  // Category-specific checks
  if (['Coffee', 'Iced', 'Tea'].includes(categoryName)) {
    if (!hasSugar) {
      issues.push({
        category: categoryName,
        item: item.name,
        itemId: item.id,
        severity: 'ERROR',
        type: 'Missing Sugar Level',
        description: `${categoryName} items must have Sugar Level attribute`
      });
    }
  }

  // Check for unusual attribute combinations
  const unusualAttrs = ['Temperature', 'Boba Toppings', 'KINDER Quantity'];
  for (const attr of unusualAttrs) {
    if (allAttributes.includes(attr)) {
      if (categoryName !== 'Offers' && categoryName !== 'Extras') {
        issues.push({
          category: categoryName,
          item: item.name,
          itemId: item.id,
          severity: 'INFO',
          type: 'Unusual Attribute',
          description: `Has "${attr}" attribute - verify if needed`
        });
      }
    }
  }

  // Check for missing Size where expected
  if (['Iced', 'Frappe', 'Smoothie', 'Milkshake'].includes(categoryName)) {
    if (!hasSize) {
      issues.push({
        category: categoryName,
        item: item.name,
        itemId: item.id,
        severity: 'WARNING',
        type: 'Missing Size',
        description: `${categoryName} items typically have Size attribute`
      });
    }
  }

  // Check for single-size coffee items that shouldn't have Size
  const singleSizeCoffees = ['Americano', 'Cortado', 'Flat White', 'Turkish Coffee', 'French Coffee', 'Espresso'];
  if (categoryName === 'Coffee' && singleSizeCoffees.some(name => item.name.includes(name))) {
    if (hasSize) {
      issues.push({
        category: categoryName,
        item: item.name,
        itemId: item.id,
        severity: 'WARNING',
        type: 'Unexpected Size Attribute',
        description: 'This item should be single-size only (no Size attribute)'
      });
    }
  }
}

async function main() {
  console.log('🔍 Analyzing POS System for Issues...\n');

  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo config not found');
  config.timeoutMs = 300000;
  client = new OdooClient(config) as any;

  const categories = [
    { id: 15, name: 'Coffee' },
    { id: 18, name: 'Iced' },
    { id: 19, name: 'Frappe' },
    { id: 21, name: 'Smoothie' },
    { id: 23, name: 'Soda' },
    { id: 36, name: 'Soda' },
    { id: 14, name: 'Tea' },
    { id: 20, name: 'Milkshake' },
    { id: 26, name: 'Food' },
    { id: 27, name: 'Extras' },
    { id: 39, name: 'Offers' },
  ];

  for (const category of categories) {
    console.log(`Analyzing ${category.name} category...`);
    
    const items = await client.searchRead(
      'product.template',
      [['pos_categ_ids', 'in', [category.id]], ['available_in_pos', '=', true]],
      ['id', 'name']
    );

    for (const item of items) {
      await analyzeItem(category.name, item);
    }
  }

  // Generate markdown report
  let markdown = `# POS System Issues Report\n\n`;
  markdown += `**Generated:** ${new Date().toLocaleString()}\n\n`;
  markdown += `**Total Issues Found:** ${issues.length}\n\n`;

  // Summary by severity
  const errors = issues.filter(i => i.severity === 'ERROR').length;
  const warnings = issues.filter(i => i.severity === 'WARNING').length;
  const info = issues.filter(i => i.severity === 'INFO').length;

  markdown += `## Summary by Severity\n\n`;
  markdown += `- 🔴 **ERRORS:** ${errors}\n`;
  markdown += `- 🟡 **WARNINGS:** ${warnings}\n`;
  markdown += `- 🔵 **INFO:** ${info}\n\n`;

  // Group by category
  const categoriesWithIssues = [...new Set(issues.map(i => i.category))];
  
  for (const category of categoriesWithIssues) {
    const categoryIssues = issues.filter(i => i.category === category);
    markdown += `## ${category} Category (${categoryIssues.length} issues)\n\n`;

    // Group by severity
    const errorIssues = categoryIssues.filter(i => i.severity === 'ERROR');
    const warningIssues = categoryIssues.filter(i => i.severity === 'WARNING');
    const infoIssues = categoryIssues.filter(i => i.severity === 'INFO');

    if (errorIssues.length > 0) {
      markdown += `### 🔴 Errors\n\n`;
      for (const issue of errorIssues) {
        markdown += `#### ${issue.item} (ID: ${issue.itemId})\n`;
        markdown += `- **Type:** ${issue.type}\n`;
        markdown += `- **Description:** ${issue.description}\n\n`;
      }
    }

    if (warningIssues.length > 0) {
      markdown += `### 🟡 Warnings\n\n`;
      for (const issue of warningIssues) {
        markdown += `#### ${issue.item} (ID: ${issue.itemId})\n`;
        markdown += `- **Type:** ${issue.type}\n`;
        markdown += `- **Description:** ${issue.description}\n\n`;
      }
    }

    if (infoIssues.length > 0) {
      markdown += `### 🔵 Info\n\n`;
      for (const issue of infoIssues) {
        markdown += `#### ${issue.item} (ID: ${issue.itemId})\n`;
        markdown += `- **Type:** ${issue.type}\n`;
        markdown += `- **Description:** ${issue.description}\n\n`;
      }
    }
  }

  // Add recommendations section
  markdown += `## Recommendations\n\n`;
  markdown += `### High Priority\n`;
  markdown += `1. Fix all duplicate size attributes (remove lowercase "size")\n`;
  markdown += `2. Correct corrupted Sugar Level values to Franco-style\n`;
  markdown += `3. Add missing Sugar Level to Coffee, Iced, and Tea items\n\n`;
  markdown += `### Medium Priority\n`;
  markdown += `1. Standardize Size values to Small/Medium/Large\n`;
  markdown += `2. Remove Size attribute from single-size coffee items\n`;
  markdown += `3. Add Size to items that typically need it\n\n`;
  markdown += `### Low Priority\n`;
  markdown += `1. Review unusual attributes for relevance\n`;
  markdown += `2. Clean up legacy attributes from old menu structure\n\n`;

  // Write to file
  fs.writeFileSync('/Users/hamdysaad/ELITE/POS_ISSUES_REPORT.md', markdown);

  console.log('\n✅ Analysis Complete!');
  console.log(`\n📊 Found ${issues.length} issues:`);
  console.log(`   - Errors: ${errors}`);
  console.log(`   - Warnings: ${warnings}`);
  console.log(`   - Info: ${info}`);
  console.log(`\n📄 Report saved to: POS_ISSUES_REPORT.md\n`);
}

main().catch(console.error);

/**
 * Script to replace /images/menu references with /Old Items images in menuData.ts
 */

const fs = require('fs');
const path = require('path');

// Mapping of menu item names to their Old Items filenames
const imageMapping = {
  'Americano': 'americano-1.png',
  'Espresso (Single)': 'Espresso-1.png',
  'Espresso (Double)': 'Espresso-1.png',
  'Espresso Macchiato': 'Espresso Macchiato-1.png',
  'Cortado': 'Cortado-1.png',
  'Flat White': 'Flat White-1.png',
  'Cappuccino': 'Cappuccino-1.png',
  'Mocha': 'Mocha-1.png',
  'Latte': 'Latte-1.png',
  'Spanish Latte': 'Spanish Latte-1.png',
  'Frappuccino': 'Coffee Frappé-1.png',
  'Chocolate': 'Chocolate-1.png',
  'Matcha Latte': 'Matcha Latte-1.png',
  'Turkish Coffee': 'Turkish Coffee-1.png',
  'Classic Teas': 'Classic Tea-1.png',
  'Karak Chai': 'Karak Chai-1.png'
};

// Path to menuData.ts
const menuDataPath = path.join(__dirname, 'src', 'lib', 'menuData.ts');

// Read the file
let content = fs.readFileSync(menuDataPath, 'utf8');

// Track replacements
let replacements = [];

// Replace each image reference
Object.entries(imageMapping).forEach(([itemName, newFilename]) => {
  // Find all occurrences of images array for this item
  const oldPattern = /images:\s*\["\/images\/menu\/drinks\/[^"]+"\]/g;
  
  // We need to be more precise - match the item block
  const itemPattern = new RegExp(
    `(name:\\s*"${itemName.replace(/[()]/g, '\\$&')}",[\\s\\S]*?)images:\\s*\\["([^"]+)"\\]`,
    'g'
  );
  
  content = content.replace(itemPattern, (match, prefix, oldImage) => {
    const newImage = `/Old Items/${newFilename}`;
    replacements.push({
      item: itemName,
      old: oldImage,
      new: newImage
    });
    return `${prefix}images: ["${newImage}"]`;
  });
});

// Write the updated content
fs.writeFileSync(menuDataPath, content, 'utf8');

// Print summary
console.log('\n✅ Image replacement complete!\n');
console.log('Replacements made:');
replacements.forEach(({ item, old, new: newPath }) => {
  console.log(`  ${item}:`);
  console.log(`    OLD: ${old}`);
  console.log(`    NEW: ${newPath}`);
});

console.log(`\nTotal replacements: ${replacements.length}`);

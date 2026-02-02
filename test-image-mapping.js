const { getOldItemImage } = require('./src/server/utils/oldItemsMapping.ts');

console.log('Testing Old Items Mapping...');

const testCases = [
  { input: 'Cappuccino', expected: '/Old Items/Cappuccino-1.png' },
  { input: 'Caramel Frappé', expected: null }, // No -1.png for this one in the list? Let's check listing
  { input: 'Chai Latte', expected: '/Old Items/Chai Latte-1.png' },
  { input: 'Chocolate Milkshake', expected: '/Old Items/Chocolate Milkshake-1.png' },
  { input: 'Invalid Product', expected: null },
];

// Note: I need to check my assumption about "Caramel Frappé" having a -1.png.
// Based on file listing: "Caramel Frappé.png" exists, but "Caramel Frappé-1.png" was NOT in list?
// Wait, looking at file list from Step 17:
// "Caramel Frappé.png" -> Yes
// "Caramel Frappé-1.png" -> NO. So for this specific one, it should return null per strict rules.

testCases.forEach(test => {
  const result = getOldItemImage(test.input);
  const status = result === test.expected ? 'PASS' : 'FAIL';
  console.log(`[${status}] Input: "${test.input}" => Expected: ${test.expected}, Got: ${result}`);
});

console.log('Done.');

import { createOdooClient } from '../src/server/utils/odooClient';
import dotenv from 'dotenv';

dotenv.config();

const ATTRIBUTES = {
  FLAVOR: 14,
  MILK: 27,
  ESPRESSO_SHOTS: 12,
  ICE_LEVEL: 31
};

async function fixDuplicatesAndIce() {
  const odoo = createOdooClient();
  console.log("🔧 Starting Complex Fixes (Merge Values & Ice Level)...\n");

  // --- Helper: Merge Values ---
  const mergeValues = async (attrId: number, oldName: string, newName: string) => {
    console.log(`\n   🔄 Merging "${oldName}" -> "${newName}"...`);
    
    // 1. Get IDs
    const oldVal = await (odoo as any).searchRead('product.attribute.value', [['attribute_id', '=', attrId], ['name', '=', oldName]], ['id']);
    const newVal = await (odoo as any).searchRead('product.attribute.value', [['attribute_id', '=', attrId], ['name', '=', newName]], ['id']);

    if (oldVal.length === 0) {
      console.log(`      (Old value "${oldName}" not found, skipping)`);
      return;
    }
    if (newVal.length === 0) {
      console.log(`      (New value "${newName}" not found, skipping)`);
      return;
    }

    const oldId = oldVal[0].id;
    const newId = newVal[0].id;

    // 2. Find lines using old value
    // We need to find lines where value_ids contains oldId
    const lines = await (odoo as any).searchRead('product.template.attribute.line', 
      [['attribute_id', '=', attrId], ['value_ids', 'in', [oldId]]], 
      ['id', 'product_tmpl_id', 'value_ids']
    );

    console.log(`      Found ${lines.length} products using "${oldName}". Updating...`);

    for (const line of lines) {
      const currentIds = line.value_ids;
      // Remove oldId, Add newId
      const updatedIds = currentIds.filter((id: number) => id !== oldId);
      if (!updatedIds.includes(newId)) updatedIds.push(newId);

      await (odoo as any).rpc('product.template.attribute.line', 'write', [[line.id], { value_ids: [[6, 0, updatedIds]] }]);
    }

    // 3. Delete old value
    console.log(`      🗑️  Deleting old value "${oldName}"...`);
    try {
      await (odoo as any).rpc('product.attribute.value', 'unlink', [[oldId]]);
    } catch (e) {
      console.log(`      ⚠️ Could not delete "${oldName}" (might be used in archived products or history).`);
    }
  };

  // --- Part A: Merge Duplicates ---
  const merges = [
    // Flavor
    { attr: ATTRIBUTES.FLAVOR, old: "cola", new: "Cola" },
    { attr: ATTRIBUTES.FLAVOR, old: "coconut", new: "Coconut" },
    { attr: ATTRIBUTES.FLAVOR, old: "green apple", new: "Green Apple" },
    { attr: ATTRIBUTES.FLAVOR, old: "passion fruit", new: "Passion Fruit" },
    { attr: ATTRIBUTES.FLAVOR, old: "chocolate", new: "Chocolate" },
    { attr: ATTRIBUTES.FLAVOR, old: "caramel", new: "Caramel" },
    // Milk
    { attr: ATTRIBUTES.MILK, old: "milk", new: "Whole Milk" },
    // Shots
    { attr: ATTRIBUTES.ESPRESSO_SHOTS, old: "no", new: "No Shot" },
    { attr: ATTRIBUTES.ESPRESSO_SHOTS, old: "shot", new: "Single Shot" },
    { attr: ATTRIBUTES.ESPRESSO_SHOTS, old: "double  shot", new: "Double Shot" },
  ];

  for (const m of merges) {
    await mergeValues(m.attr, m.old, m.new);
  }

  // --- Part B: Fix Ice Level ---
  console.log("\n❄️  Fixing Ice Level Attribute...");
  
  // 1. Find all lines using Ice Level
  const iceLines = await (odoo as any).searchRead('product.template.attribute.line', 
    [['attribute_id', '=', ATTRIBUTES.ICE_LEVEL]], 
    ['id', 'product_tmpl_id', 'value_ids']
  );

  if (iceLines.length > 0) {
    console.log(`   Found ${iceLines.length} products with Ice Level. Temporarily removing...`);
    
    // Store backup data: { productId: [valueIds] }
    const backup = iceLines.map((l: any) => ({
      productId: l.product_tmpl_id[0],
      valueIds: l.value_ids
    }));

    // 2. Delete lines
    const lineIds = iceLines.map((l: any) => l.id);
    await (odoo as any).rpc('product.template.attribute.line', 'unlink', [lineIds]);

    // 3. Change Attribute Mode
    console.log("   🔄 Changing Ice Level to 'no_variant'...");
    await (odoo as any).rpc('product.attribute', 'write', [[ATTRIBUTES.ICE_LEVEL], { create_variant: 'no_variant' }]);

    // 4. Restore Lines
    console.log("   Restoring Ice Level to products...");
    for (const item of backup) {
      await (odoo as any).rpc('product.template.attribute.line', 'create', [{
        product_tmpl_id: item.productId,
        attribute_id: ATTRIBUTES.ICE_LEVEL,
        value_ids: [[6, 0, item.valueIds]]
      }]);
    }
    console.log("   ✅ Ice Level fixed!");
  } else {
    console.log("   (No products with Ice Level found, just updating mode)");
    await (odoo as any).rpc('product.attribute', 'write', [[ATTRIBUTES.ICE_LEVEL], { create_variant: 'no_variant' }]);
  }

  console.log("\n✨ All Complex Fixes Completed.");
}

fixDuplicatesAndIce().catch(console.error);

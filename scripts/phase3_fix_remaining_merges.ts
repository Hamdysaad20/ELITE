import { createOdooClient } from '../src/server/utils/odooClient';
import dotenv from 'dotenv';

dotenv.config();

const ATTRIBUTES = {
  FLAVOR: 14,
  MILK: 27,
  ESPRESSO_SHOTS: 12,
  ICE_LEVEL: 31
};

async function fixRemainingMerges() {
  const odoo = createOdooClient();
  console.log("🔧 Fixing Remaining Merges...\n");

  // --- Helper: Ensure Value Exists ---
  const ensureValue = async (attrId: number, name: string) => {
    const existing = await (odoo as any).searchRead('product.attribute.value', [['attribute_id', '=', attrId], ['name', '=', name]], ['id']);
    if (existing.length > 0) return existing[0].id;
    
    console.log(`   ➕ Creating missing target value "${name}"...`);
    const id = await (odoo as any).rpc('product.attribute.value', 'create', [{
      attribute_id: attrId,
      name: name
    }]);
    return id;
  };

  // --- Helper: Merge Values ---
  const mergeValues = async (attrId: number, oldName: string, newName: string) => {
    console.log(`\n   🔄 Merging "${oldName}" -> "${newName}"...`);
    
    // Ensure target exists first!
    const newId = await ensureValue(attrId, newName);
    
    const oldVal = await (odoo as any).searchRead('product.attribute.value', [['attribute_id', '=', attrId], ['name', '=', oldName]], ['id']);
    if (oldVal.length === 0) {
      console.log(`      (Old value "${oldName}" not found, skipping)`);
      return;
    }
    const oldId = oldVal[0].id;

    // Find lines using old value
    const lines = await (odoo as any).searchRead('product.template.attribute.line', 
      [['attribute_id', '=', attrId], ['value_ids', 'in', [oldId]]], 
      ['id', 'product_tmpl_id', 'value_ids']
    );

    console.log(`      Found ${lines.length} products using "${oldName}". Updating...`);

    for (const line of lines) {
      const currentIds = line.value_ids;
      const updatedIds = currentIds.filter((id: number) => id !== oldId);
      if (!updatedIds.includes(newId)) updatedIds.push(newId);

      await (odoo as any).rpc('product.template.attribute.line', 'write', [[line.id], { value_ids: [[6, 0, updatedIds]] }]);
    }

    // Delete old value
    console.log(`      🗑️  Deleting old value "${oldName}"...`);
    try {
      await (odoo as any).rpc('product.attribute.value', 'unlink', [[oldId]]);
    } catch (e) {
      console.log(`      ⚠️ Could not delete "${oldName}" (might be used in archived products).`);
    }
  };

  // --- Remaining Merges ---
  const merges = [
    { attr: ATTRIBUTES.FLAVOR, old: "cola", new: "Cola" },
    { attr: ATTRIBUTES.FLAVOR, old: "coconut", new: "Coconut" },
    { attr: ATTRIBUTES.FLAVOR, old: "green apple", new: "Green Apple" },
    { attr: ATTRIBUTES.FLAVOR, old: "passion fruit", new: "Passion Fruit" },
    { attr: ATTRIBUTES.FLAVOR, old: "chocolate", new: "Chocolate" },
  ];

  for (const m of merges) {
    await mergeValues(m.attr, m.old, m.new);
  }

  console.log("\n✨ Remaining Merges Completed.");
}

fixRemainingMerges().catch(console.error);

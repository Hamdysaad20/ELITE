import { createOdooClient } from '../src/server/utils/odooClient';
import dotenv from 'dotenv';

dotenv.config();

const ATTRIBUTES = {
  FLAVOR: 14,
  MILK: 27,
  ESPRESSO_SHOTS: 12,
  ICE_LEVEL: 31
};

async function standardizeValues() {
  const odoo = createOdooClient();
  console.log("🧹 Starting Attribute Value Standardization...\n");

  // --- Helper to find value by name ---
  const findValue = async (attrId: number, name: string) => {
    const res = await (odoo as any).searchRead('product.attribute.value', 
      [['attribute_id', '=', attrId], ['name', 'ilike', name]], 
      ['id', 'name']
    );
    return res.find((r: any) => r.name.toLowerCase() === name.toLowerCase());
  };

  // --- Helper to create value if missing ---
  const ensureValue = async (attrId: number, name: string) => {
    let val = await findValue(attrId, name);
    if (!val) {
      console.log(`   ➕ Creating "${name}" for Attribute ${attrId}`);
      const id = await (odoo as any).rpc('product.attribute.value', 'create', [{
        attribute_id: attrId,
        name: name,
        sequence: 1 // Put "No X" at top usually
      }]);
      return id;
    }
    console.log(`   ✅ "${name}" already exists (ID: ${val.id})`);
    return val.id;
  };

  // --- Helper to rename value ---
  const renameValue = async (attrId: number, oldName: string, newName: string) => {
    // Check if target name already exists to avoid duplicates
    const target = await findValue(attrId, newName);
    if (target) {
      console.log(`   ⚠️ Cannot rename "${oldName}" to "${newName}" because "${newName}" already exists (ID: ${target.id}). Manual merge required.`);
      return;
    }

    const source = await findValue(attrId, oldName);
    if (source) {
      console.log(`   ✏️ Renaming "${source.name}" (ID: ${source.id}) -> "${newName}"`);
      await (odoo as any).rpc('product.attribute.value', 'write', [[source.id], { name: newName }]);
    } else {
      console.log(`   ℹ️ Value "${oldName}" not found to rename.`);
    }
  };

  // 1. Standardize FLAVORS (ID 14)
  console.log("\n--- Standardizing Flavors ---");
  await ensureValue(ATTRIBUTES.FLAVOR, "No Flavor");
  await renameValue(ATTRIBUTES.FLAVOR, "pinaple", "Pineapple");
  await renameValue(ATTRIBUTES.FLAVOR, "cola", "Cola");
  await renameValue(ATTRIBUTES.FLAVOR, "coconut", "Coconut");
  await renameValue(ATTRIBUTES.FLAVOR, "green apple", "Green Apple");
  await renameValue(ATTRIBUTES.FLAVOR, "passion fruit", "Passion Fruit");
  await renameValue(ATTRIBUTES.FLAVOR, "chocolate", "Chocolate"); // Lowercase to Title
  await renameValue(ATTRIBUTES.FLAVOR, "caramel", "Caramel"); // Lowercase to Title (might conflict if Title exists)

  // 2. Standardize MILK (ID 27)
  console.log("\n--- Standardizing Milk ---");
  await ensureValue(ATTRIBUTES.MILK, "No Milk");
  await renameValue(ATTRIBUTES.MILK, "milk", "Whole Milk");

  // 3. Standardize SHOTS (ID 12)
  console.log("\n--- Standardizing Espresso Shots ---");
  await renameValue(ATTRIBUTES.ESPRESSO_SHOTS, "no", "No Shot");
  await renameValue(ATTRIBUTES.ESPRESSO_SHOTS, "shot", "Single Shot");
  await renameValue(ATTRIBUTES.ESPRESSO_SHOTS, "double  shot", "Double Shot"); // Fix double space

  // 4. Fix ICE LEVEL (ID 31) Configuration
  console.log("\n--- Fixing Ice Level Configuration ---");
  // Change create_variant from 'always' to 'no_variant'
  await (odoo as any).rpc('product.attribute', 'write', [[ATTRIBUTES.ICE_LEVEL], { create_variant: 'no_variant' }]);
  console.log("   ✅ Changed Ice Level to 'no_variant'");

  console.log("\n✨ Standardization Complete.");
}

standardizeValues().catch(console.error);

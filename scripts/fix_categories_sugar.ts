import { createOdooClient, OdooClient } from "../src/server/utils/odooClient";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Fix Categories and Sugar Levels
 * 
 * 1. Rename categories to short, unique names
 * 2. Update sugar levels to friendly names
 */

interface OdooClientWithRpc extends OdooClient {
  rpc<T = any>(model: string, method: string, args?: any[], kwargs?: Record<string, unknown>): Promise<T>;
}

// Category renames: old name -> new name
const CATEGORY_RENAMES: Record<number, string> = {
  13: "Coffee",           // Was "Hot Drinks / Coffee"
  14: "Tea",              // Was "Hot Drinks / Tea"
  18: "Iced",             // Was "Iced Drinks"
  19: "Frappe",           // Was "Specialty Drinks / Frappe"
  20: "Milkshake",        // Was "Specialty Drinks / Milkshakes"
  21: "Smoothie",         // Was "Specialty Drinks / Smoothies"
  26: "Food",             // Already "Food"
  23: "Refreshers",       // Was "Goods" - for sodas, water, etc.
};

// Sugar level updates: create new friendly values
const SUGAR_VALUES = [
  { name: "No Sugar", sequence: 1 },
  { name: "Less Sugar", sequence: 2 },
  { name: "Half Sugar", sequence: 3 },
  { name: "Regular Sugar", sequence: 4 },
  { name: "Extra Sugar", sequence: 5 },
];

async function main() {
  const odoo = createOdooClient() as OdooClientWithRpc | null;
  if (!odoo) {
    console.error("Odoo not configured");
    process.exit(1);
  }

  console.log("🔧 Updating categories and sugar levels...\n");

  // 1. Rename categories
  console.log("1️⃣ Renaming categories to short names...\n");
  
  for (const [catId, newName] of Object.entries(CATEGORY_RENAMES)) {
    try {
      // Get current name
      const cats = await odoo.searchRead(
        "product.category",
        [["id", "=", parseInt(catId)]],
        ["id", "name"]
      );
      
      if (cats.length > 0) {
        const oldName = cats[0].name;
        await odoo.rpc("product.category", "write", [[parseInt(catId)], { name: newName }]);
        console.log(`   ✅ "${oldName}" → "${newName}"`);
      }
    } catch (err: any) {
      console.error(`   ❌ Failed to rename category ${catId}: ${err.message}`);
    }
  }

  // 2. Update Sugar Level attribute values
  console.log("\n2️⃣ Updating Sugar Level values...\n");
  
  // Find Sugar Level attribute
  const sugarAttr = await odoo.searchRead(
    "product.attribute",
    [["name", "=", "Sugar Level"]],
    ["id", "name"]
  );
  
  if (sugarAttr.length === 0) {
    console.error("   ❌ Sugar Level attribute not found!");
    return;
  }
  
  const sugarAttrId = sugarAttr[0].id;
  console.log(`   Found Sugar Level attribute (ID: ${sugarAttrId})`);
  
  // Get existing sugar values
  const existingValues = await odoo.searchRead(
    "product.attribute.value",
    [["attribute_id", "=", sugarAttrId]],
    ["id", "name"]
  );
  
  console.log(`   Current values: ${existingValues.map(v => v.name).join(", ")}`);
  
  // Create new values
  const existingNames = new Set(existingValues.map(v => v.name.toLowerCase()));
  
  for (const val of SUGAR_VALUES) {
    if (!existingNames.has(val.name.toLowerCase())) {
      try {
        const newId = await odoo.rpc("product.attribute.value", "create", [{
          name: val.name,
          attribute_id: sugarAttrId,
          sequence: val.sequence,
        }]);
        console.log(`   ✅ Created: "${val.name}" (ID: ${newId})`);
      } catch (err: any) {
        console.error(`   ❌ Failed to create "${val.name}": ${err.message}`);
      }
    } else {
      console.log(`   ⚠️  "${val.name}" already exists`);
    }
  }

  // 3. Print final state
  console.log("\n📋 Final Categories:");
  const finalCats = await odoo.searchRead(
    "product.category",
    [["id", "in", Object.keys(CATEGORY_RENAMES).map(Number)]],
    ["id", "name"]
  );
  for (const cat of finalCats) {
    console.log(`   ${cat.id}: ${cat.name}`);
  }

  console.log("\n📋 Final Sugar Values:");
  const finalSugar = await odoo.searchRead(
    "product.attribute.value",
    [["attribute_id", "=", sugarAttrId]],
    ["id", "name", "sequence"]
  );
  finalSugar.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
  for (const val of finalSugar) {
    console.log(`   ${val.id}: ${val.name}`);
  }

  console.log("\n✅ Done!");
}

main().catch(console.error);

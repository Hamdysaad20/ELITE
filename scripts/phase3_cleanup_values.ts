import { createOdooClient, OdooClient } from "../src/server/utils/odooClient";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Phase 3: Clean up attribute values
 * 
 * Fixes:
 * - Typos (e.g., "Mmedium" -> "Medium", "double  shot" -> "Double Shot")
 * - Standardizes naming conventions
 * - Archives duplicate/unused values
 */

interface OdooClientWithRpc extends OdooClient {
  rpc<T = any>(model: string, method: string, args?: any[], kwargs?: Record<string, unknown>): Promise<T>;
}

// Value renames: { attribute_name: { old_name: new_name } }
const VALUE_RENAMES: Record<string, Record<string, string>> = {
  "suger": {
    "Mmedium": "50%",
    "hint of sugar": "25%",
    // Normalize to percentages
  },
  "coffee": {
    "double  shot": "Double Shot",
    "triple  shot": "Triple Shot",
    "single  shot": "Single Shot",
    // Fix spacing issues
  },
};

// Values to archive (unused or duplicates)
const VALUES_TO_ARCHIVE: string[] = [
  // Add any values that should be removed
];

// Standardize attribute names themselves
const ATTRIBUTE_RENAMES: Record<string, string> = {
  "suger": "Sugar Level",
  "coffee": "Espresso Shots",
};

async function main() {
  const odoo = createOdooClient() as OdooClientWithRpc | null;
  if (!odoo) {
    console.error("Odoo not configured");
    process.exit(1);
  }

  console.log("🔧 Cleaning up attribute values...\n");

  // Get all attributes with their values
  const attributes = await odoo.searchRead(
    "product.attribute",
    [],
    ["id", "name", "value_ids"]
  );

  // Get all attribute values
  const allValues = await odoo.searchRead(
    "product.attribute.value",
    [],
    ["id", "name", "attribute_id"]
  );

  console.log(`Found ${attributes.length} attributes and ${allValues.length} values\n`);

  // 1. Rename attributes
  for (const [oldName, newName] of Object.entries(ATTRIBUTE_RENAMES)) {
    const attr = attributes.find(a => a.name.toLowerCase() === oldName.toLowerCase());
    if (attr) {
      console.log(`📝 Renaming attribute: "${attr.name}" -> "${newName}"`);
      try {
        await odoo.rpc("product.attribute", "write", [[attr.id], { name: newName }]);
        console.log(`   ✅ Renamed`);
      } catch (err: any) {
        console.error(`   ❌ Failed: ${err.message}`);
      }
    }
  }

  // 2. Rename values with typos
  for (const [attrName, renames] of Object.entries(VALUE_RENAMES)) {
    const attr = attributes.find(a => 
      a.name.toLowerCase() === attrName.toLowerCase() ||
      ATTRIBUTE_RENAMES[a.name.toLowerCase()]?.toLowerCase() === attrName.toLowerCase()
    );
    if (!attr) {
      console.log(`⚠️  Attribute "${attrName}" not found`);
      continue;
    }

    const attrValues = allValues.filter(v => v.attribute_id[0] === attr.id);
    console.log(`\n📋 Checking values for "${attr.name}":`);

    for (const [oldVal, newVal] of Object.entries(renames)) {
      const value = attrValues.find(v => 
        v.name.toLowerCase().trim() === oldVal.toLowerCase().trim() ||
        v.name.replace(/\s+/g, ' ').toLowerCase() === oldVal.replace(/\s+/g, ' ').toLowerCase()
      );
      if (value) {
        console.log(`   📝 Renaming value: "${value.name}" -> "${newVal}"`);
        try {
          await odoo.rpc("product.attribute.value", "write", [[value.id], { name: newVal }]);
          console.log(`   ✅ Renamed`);
        } catch (err: any) {
          console.error(`   ❌ Failed: ${err.message}`);
        }
      } else {
        console.log(`   ⚠️  Value "${oldVal}" not found in "${attr.name}"`);
      }
    }
  }

  // 3. Print current state for review
  console.log("\n\n📋 Current attribute values:");
  
  const updatedAttrs = await odoo.searchRead(
    "product.attribute",
    [["value_ids", "!=", false]],
    ["id", "name"]
  );
  
  for (const attr of updatedAttrs) {
    const values = await odoo.searchRead(
      "product.attribute.value",
      [["attribute_id", "=", attr.id]],
      ["id", "name"]
    );
    if (values.length > 0) {
      console.log(`\n   ${attr.id}: ${attr.name}`);
      for (const v of values) {
        console.log(`      - ${v.id}: "${v.name}"`);
      }
    }
  }

  console.log("\n✅ Phase 3 complete!");
}

main().catch(console.error);

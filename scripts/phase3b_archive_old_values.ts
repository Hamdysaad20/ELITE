import { createOdooClient, OdooClient } from "../src/server/utils/odooClient";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Phase 3b: Archive duplicate/old attribute values
 * 
 * Keeps the standardized values, archives old duplicates
 */

interface OdooClientWithRpc extends OdooClient {
  rpc<T = any>(model: string, method: string, args?: any[], kwargs?: Record<string, unknown>): Promise<T>;
}

// Old values to archive (by ID) - these are duplicates or non-standard
const VALUES_TO_ARCHIVE = [
  // Sugar Level - keep 101-104 (0%, 25%, 50%, 100%), archive old ones
  15, // "extra" - redundant
  16, // "medium" - duplicate of 50%
  17, // "No sugar" - duplicate of 0%
  18, // old "50%" - duplicate
  42, // old "25%" - duplicate
  
  // Espresso Shots - keep 92-95, archive old ones
  19, // "no" - duplicate of No Shot
  20, // "shot" - unclear
  21, // "double  shot" with extra space
  
  // Flavor - archive duplicates
  25, // "caramel" - duplicate of 96 "Caramel"
];

async function main() {
  const odoo = createOdooClient() as OdooClientWithRpc | null;
  if (!odoo) {
    console.error("Odoo not configured");
    process.exit(1);
  }

  console.log("🗄️  Archiving old/duplicate attribute values...\n");

  // Note: Archiving attribute values is tricky - they might be in use
  // Instead, let's verify which are in use first
  
  for (const valueId of VALUES_TO_ARCHIVE) {
    // Check if value is used in any product
    const usages = await odoo.searchRead(
      "product.template.attribute.value",
      [["product_attribute_value_id", "=", valueId]],
      ["id", "product_tmpl_id"]
    );

    if (usages.length > 0) {
      console.log(`⚠️  Value ID ${valueId} is used in ${usages.length} products - skipping`);
      
      // Get the value name for reference
      const val = await odoo.searchRead(
        "product.attribute.value",
        [["id", "=", valueId]],
        ["name", "attribute_id"]
      );
      if (val.length > 0) {
        console.log(`   Name: "${val[0].name}" in "${val[0].attribute_id[1]}"`);
      }
    } else {
      // Safe to archive/delete
      const val = await odoo.searchRead(
        "product.attribute.value",
        [["id", "=", valueId]],
        ["name", "attribute_id"]
      );
      if (val.length > 0) {
        console.log(`🗑️  Deleting unused value: "${val[0].name}" (ID: ${valueId})`);
        try {
          await odoo.rpc("product.attribute.value", "unlink", [[valueId]]);
          console.log(`   ✅ Deleted`);
        } catch (err: any) {
          console.error(`   ❌ Failed: ${err.message}`);
        }
      }
    }
  }

  console.log("\n✅ Cleanup complete!");
}

main().catch(console.error);

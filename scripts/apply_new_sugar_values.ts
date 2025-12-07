import { createOdooClient, OdooClient } from "../src/server/utils/odooClient";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Apply new Sugar Level values to products and clean up old values
 */

interface OdooClientWithRpc extends OdooClient {
  rpc<T = any>(model: string, method: string, args?: any[], kwargs?: Record<string, unknown>): Promise<T>;
}

// New sugar value IDs (from previous script)
const NEW_SUGAR_VALUES = [17, 123, 124, 125, 126]; // No sugar, Less Sugar, Half Sugar, Regular Sugar, Extra Sugar

// Old sugar values to remove from products
const OLD_SUGAR_VALUES = [15, 16, 18, 42, 101, 102, 103, 104]; // extra, medium, 50%, 25%, 0%, 25%, 50%, 100%

async function main() {
  const odoo = createOdooClient() as OdooClientWithRpc | null;
  if (!odoo) {
    console.error("Odoo not configured");
    process.exit(1);
  }

  console.log("🔧 Applying new Sugar Level values to products...\n");

  // Find Sugar Level attribute
  const sugarAttr = await odoo.searchRead(
    "product.attribute",
    [["name", "=", "Sugar Level"]],
    ["id"]
  );
  
  if (sugarAttr.length === 0) {
    console.error("Sugar Level attribute not found!");
    return;
  }
  
  const sugarAttrId = sugarAttr[0].id;

  // Find all products with Sugar Level attribute lines
  const attrLines = await odoo.searchRead(
    "product.template.attribute.line",
    [["attribute_id", "=", sugarAttrId]],
    ["id", "product_tmpl_id", "value_ids"]
  );

  console.log(`Found ${attrLines.length} products with Sugar Level attribute\n`);

  let updated = 0;
  for (const line of attrLines) {
    const productName = line.product_tmpl_id[1];
    
    try {
      // Update to use only new values
      await odoo.rpc("product.template.attribute.line", "write", [[line.id], {
        value_ids: [[6, 0, NEW_SUGAR_VALUES]] // Replace with new values
      }]);
      console.log(`   ✅ Updated: ${productName}`);
      updated++;
    } catch (err: any) {
      console.error(`   ❌ Failed: ${productName}: ${err.message}`);
    }
  }

  console.log(`\n✅ Updated ${updated} products with new Sugar Level values`);

  // Verify a sample product
  console.log("\n📋 Sample product Sugar values:");
  const sampleLine = attrLines[0];
  if (sampleLine) {
    const templateValues = await odoo.searchRead(
      "product.template.attribute.value",
      [["product_tmpl_id", "=", sampleLine.product_tmpl_id[0]], ["attribute_id", "=", sugarAttrId]],
      ["id", "name", "product_attribute_value_id", "price_extra"]
    );
    
    console.log(`   Product: ${sampleLine.product_tmpl_id[1]}`);
    for (const tv of templateValues) {
      console.log(`   - ${tv.product_attribute_value_id[1]} (+${tv.price_extra} EGP)`);
    }
  }

  console.log("\n✅ Done!");
}

main().catch(console.error);

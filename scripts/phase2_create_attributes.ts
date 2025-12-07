import { createOdooClient, OdooClient } from "../src/server/utils/odooClient";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Phase 2: Create missing attributes
 * 
 * Creates:
 * - Temperature (Hot/Iced) for drinks that come in both variants
 * - Whipped Cream (None/Regular/Extra) for frappes
 * - Drizzle (None/Caramel/Chocolate/Both) for specialty drinks
 */

interface OdooClientWithRpc extends OdooClient {
  rpc<T = any>(model: string, method: string, args?: any[], kwargs?: Record<string, unknown>): Promise<T>;
}

// Attributes to create
const NEW_ATTRIBUTES = [
  {
    name: "Temperature",
    values: [
      { name: "Hot", price: 0 },
      { name: "Iced", price: 5 }, // Iced usually costs a bit more
    ],
    display_type: "radio", // radio buttons for single select
    create_variant: "no_variant", // Don't create product variants
  },
  {
    name: "Whipped Cream",
    values: [
      { name: "No Whip", price: 0 },
      { name: "Light Whip", price: 0 },
      { name: "Regular Whip", price: 0 },
      { name: "Extra Whip", price: 10 },
    ],
    display_type: "radio",
    create_variant: "no_variant",
  },
  {
    name: "Drizzle",
    values: [
      { name: "No Drizzle", price: 0 },
      { name: "Caramel Drizzle", price: 10 },
      { name: "Chocolate Drizzle", price: 10 },
      { name: "Both Drizzles", price: 15 },
    ],
    display_type: "radio",
    create_variant: "no_variant",
  },
  {
    name: "Foam",
    values: [
      { name: "No Foam", price: 0 },
      { name: "Light Foam", price: 0 },
      { name: "Regular Foam", price: 0 },
      { name: "Extra Foam", price: 0 },
    ],
    display_type: "radio",
    create_variant: "no_variant",
  },
];

async function main() {
  const odoo = createOdooClient() as OdooClientWithRpc | null;
  if (!odoo) {
    console.error("Odoo not configured");
    process.exit(1);
  }

  console.log("🔧 Creating missing attributes...\n");

  // First, check existing attributes
  const existingAttrs = await odoo.searchRead(
    "product.attribute",
    [],
    ["id", "name"]
  );
  const existingNames = new Set(existingAttrs.map(a => a.name.toLowerCase()));

  console.log("Existing attributes:", existingAttrs.map(a => a.name).join(", "));
  console.log();

  for (const attr of NEW_ATTRIBUTES) {
    // Check if already exists
    if (existingNames.has(attr.name.toLowerCase())) {
      console.log(`⚠️  "${attr.name}" already exists - skipping creation`);
      
      // But let's verify/update values
      const existing = existingAttrs.find(a => a.name.toLowerCase() === attr.name.toLowerCase());
      if (existing) {
        await ensureAttributeValues(odoo, existing.id, attr.name, attr.values);
      }
      continue;
    }

    console.log(`📝 Creating attribute: "${attr.name}"`);

    try {
      // Create the attribute
      const attrId = await odoo.rpc("product.attribute", "create", [{
        name: attr.name,
        display_type: attr.display_type,
        create_variant: attr.create_variant,
      }]);

      console.log(`   ✅ Created attribute ID: ${attrId}`);

      // Create attribute values
      for (const val of attr.values) {
        const valueId = await odoo.rpc("product.attribute.value", "create", [{
          name: val.name,
          attribute_id: attrId,
          // Note: price_extra is on product.template.attribute.value, not here
        }]);
        console.log(`   ✅ Created value: "${val.name}" (ID: ${valueId})`);
      }
    } catch (err: any) {
      console.error(`   ❌ Failed to create "${attr.name}": ${err.message}`);
    }
  }

  console.log("\n✅ Phase 2 complete!");
  
  // Print final attribute list
  const finalAttrs = await odoo.searchRead(
    "product.attribute",
    [],
    ["id", "name", "value_ids"]
  );
  
  console.log("\n📋 Final attribute list:");
  for (const attr of finalAttrs) {
    console.log(`   ${attr.id}: ${attr.name} (${attr.value_ids?.length || 0} values)`);
  }
}

async function ensureAttributeValues(
  odoo: OdooClientWithRpc,
  attrId: number,
  attrName: string,
  expectedValues: Array<{ name: string; price: number }>
) {
  // Get existing values
  const existingValues = await odoo.searchRead(
    "product.attribute.value",
    [["attribute_id", "=", attrId]],
    ["id", "name"]
  );
  const existingNames = new Set(existingValues.map(v => v.name.toLowerCase()));

  for (const val of expectedValues) {
    if (!existingNames.has(val.name.toLowerCase())) {
      try {
        const valueId = await odoo.rpc("product.attribute.value", "create", [{
          name: val.name,
          attribute_id: attrId,
        }]);
        console.log(`   ✅ Added missing value to "${attrName}": "${val.name}" (ID: ${valueId})`);
      } catch (err: any) {
        console.error(`   ❌ Failed to add value "${val.name}": ${err.message}`);
      }
    }
  }
}

main().catch(console.error);

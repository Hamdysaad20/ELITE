import { createOdooClient } from "../src/server/utils/odooClient";
import dotenv from "dotenv";

dotenv.config();

const BOBA_CATEGORY_NAME = "Boba";
const ATTRIBUTE_NAME = "Boba Toppings";
const TOPPING_VALUES = ["No Toppings", "Tapioca Pearls", "Coconut Jelly", "Popping Boba", "Cheese Foam"];

async function addBobaToppings() {
  const odoo = createOdooClient();
  if (!odoo) {
    console.error("Odoo not configured");
    process.exit(1);
  }

  console.log("🥥 Adding Boba toppings attribute...\n");

  // 1. Locate Boba category
  const bobaCategory = await (odoo as any).searchRead(
    "product.category",
    [["name", "=", BOBA_CATEGORY_NAME]],
    ["id", "name"]
  );

  if (bobaCategory.length === 0) {
    console.error("❌ Boba category not found. Run phase3_create_boba_category.ts first.");
    process.exit(1);
  }
  const bobaCategoryId = bobaCategory[0].id;

  // 2. Ensure attribute exists
  const existingAttribute = await (odoo as any).searchRead(
    "product.attribute",
    [["name", "=", ATTRIBUTE_NAME]],
    ["id", "create_variant", "display_type"]
  );

  let attributeId: number;
  if (existingAttribute.length > 0) {
    attributeId = existingAttribute[0].id;
    // ensure it's configured correctly
    await (odoo as any).rpc("product.attribute", "write", [[attributeId], { create_variant: "no_variant", display_type: "pills" }]);
    console.log(`✅ Attribute already exists (ID: ${attributeId})`);
  } else {
    attributeId = await (odoo as any).rpc("product.attribute", "create", [
      {
        name: ATTRIBUTE_NAME,
        create_variant: "no_variant",
        display_type: "pills",
      },
    ]);
    console.log(`➕ Created attribute "${ATTRIBUTE_NAME}" (ID: ${attributeId})`);
  }

  // 3. Ensure values exist
  const toppingValueIds: number[] = [];
  for (const value of TOPPING_VALUES) {
    const existingValue = await (odoo as any).searchRead(
      "product.attribute.value",
      [["attribute_id", "=", attributeId], ["name", "=", value]],
      ["id", "name"]
    );

    if (existingValue.length > 0) {
      toppingValueIds.push(existingValue[0].id);
    } else {
      const newId = await (odoo as any).rpc("product.attribute.value", "create", [
        {
          attribute_id: attributeId,
          name: value,
        },
      ]);
      toppingValueIds.push(newId);
    }
  }

  const noToppingsId = toppingValueIds[0];

  // 4. Attach attribute line to all Boba products
  const bobaProducts = await (odoo as any).searchRead(
    "product.template",
    [["categ_id", "=", bobaCategoryId]],
    ["id", "name", "attribute_line_ids"]
  );

  console.log(`📦 Found ${bobaProducts.length} Boba products.`);

  for (const product of bobaProducts) {
    const lines = await (odoo as any).searchRead(
      "product.template.attribute.line",
      [["product_tmpl_id", "=", product.id], ["attribute_id", "=", attributeId]],
      ["id", "value_ids"]
    );

    if (lines.length > 0) {
      // Ensure No Toppings is available and comes first
      const current = lines[0];
      const valueIds: number[] = current.value_ids ?? [];
      const updated = Array.from(new Set([noToppingsId, ...valueIds, ...toppingValueIds]));
      await (odoo as any).rpc("product.template.attribute.line", "write", [
        [current.id],
        { value_ids: [[6, 0, updated]] },
      ]);
      console.log(`   • Updated toppings for "${product.name}"`);
    } else {
      await (odoo as any).rpc("product.template.attribute.line", "create", [
        {
          product_tmpl_id: product.id,
          attribute_id: attributeId,
          value_ids: [[6, 0, toppingValueIds]],
        },
      ]);
      console.log(`   ➕ Added toppings to "${product.name}"`);
    }
  }

  console.log("\n✨ Boba toppings applied.");
}

addBobaToppings().catch((err) => {
  console.error(err);
  process.exit(1);
});

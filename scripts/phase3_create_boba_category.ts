import { createOdooClient } from "../src/server/utils/odooClient";
import dotenv from "dotenv";

dotenv.config();

const TARGET_PRODUCTS = [
  "BOBA Chocolate",
  "BOBA Spanish latte",
  "Brown Sugar BOBA/Bubble [Classic]",
  "[Taro] Boba/Bubble",
  "✨ Bestie Offer ✨ BOBA SPANISH LATTE",
  "✨ Bestie Offer ✨ BOBA CHOCOLATE",
];

async function createBobaCategory() {
  const odoo = createOdooClient();
  if (!odoo) {
    console.error("Odoo not configured");
    process.exit(1);
  }

  console.log("🧋 Creating Boba category and moving drinks...\n");

  // 1. Find parent category (use Iced's parent to keep same hierarchy if available)
  const icedCat = await (odoo as any).searchRead(
    "product.category",
    [["id", "=", 18]],
    ["id", "name", "parent_id"]
  );

  const icedParentId = icedCat?.[0]?.parent_id?.length
    ? icedCat[0].parent_id[0]
    : null;

  // 2. Ensure Boba category exists
  const existingBoba = await (odoo as any).searchRead(
    "product.category",
    [["name", "=", "Boba"]],
    ["id", "parent_id"]
  );

  let bobaCategoryId: number;

  if (existingBoba.length > 0) {
    bobaCategoryId = existingBoba[0].id;
    console.log(`✅ Boba category already exists (ID: ${bobaCategoryId})`);
  } else {
    const payload: Record<string, any> = { name: "Boba" };
    if (icedParentId) {
      payload.parent_id = icedParentId;
    }
    bobaCategoryId = await (odoo as any).rpc("product.category", "create", [payload]);
    console.log(`➕ Created Boba category (ID: ${bobaCategoryId})`);
  }

  // 3. Move target products
  for (const productName of TARGET_PRODUCTS) {
    const products = await (odoo as any).searchRead(
      "product.template",
      [["name", "=", productName]],
      ["id", "name", "categ_id"]
    );

    if (products.length === 0) {
      console.log(`⚠️ Product "${productName}" not found (maybe already renamed/archived)`);
      continue;
    }

    const product = products[0];
    if (product.categ_id[0] === bobaCategoryId) {
      console.log(`   • "${product.name}" already in Boba category`);
      continue;
    }

    await (odoo as any).rpc("product.template", "write", [[product.id], { categ_id: bobaCategoryId }]);
    console.log(`   ➜ Moved "${product.name}" to Boba`);
  }

  console.log("\n✨ Boba migration complete.");
}

createBobaCategory().catch((err) => {
  console.error(err);
  process.exit(1);
});

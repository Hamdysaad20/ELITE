import { createOdooClient } from "../src/server/utils/odooClient";
import dotenv from "dotenv";

dotenv.config();

async function consolidateAmericano() {
  const odoo = createOdooClient();
  if (!odoo) {
    console.error("Odoo not configured");
    process.exit(1);
  }

  console.log("☕ Consolidating Americano into single product with Size attribute...\n");

  // 1) Find candidates (exclude iced)
  const americanoCandidates = await (odoo as any).searchRead(
    "product.template",
    [["active", "=", true], ["name", "ilike", "Americano"], ["name", "not ilike", "Iced"]],
    ["id", "name", "list_price", "default_code", "categ_id"]
  );

  // Also include explicit AMERICANO - M if present
  const americanoM = await (odoo as any).searchRead(
    "product.template",
    [["active", "=", true], ["name", "=", "AMERICANO - M"]],
    ["id", "name", "list_price", "default_code", "categ_id"]
  );

  const products = [...americanoCandidates, ...americanoM].filter(
    (p: any, idx: number, arr: any[]) => arr.findIndex((q: any) => q.id === p.id) === idx
  );

  if (!products.length) {
    console.log("❌ No Americano products found.");
    return;
  }

  console.log(`📦 Found ${products.length} Americano entries:`);
  products.forEach((p: any) => console.log(`   • ID ${p.id} | ${p.name} | ${p.list_price}`));

  // 2) Choose primary template: prefer SKU EE001 or highest price
  let primary: any = null;
  primary = products.find((p: any) => (p.default_code || "").toUpperCase() === "EE001") || null;
  if (!primary) {
    primary = products.slice().sort((a: any, b: any) => Number(b.list_price) - Number(a.list_price))[0];
  }
  console.log(`\n🧭 Primary template: ID ${primary.id} | ${primary.name} | ${primary.list_price}`);

  // 3) Ensure category = Coffee (ID 13) if known, else keep
  try {
    const coffeeCats = await (odoo as any).searchRead("product.category", [["name", "=", "Coffee"]], ["id", "name"]);
    if (coffeeCats.length) {
      await (odoo as any).rpc("product.template", "write", [[primary.id], { categ_id: coffeeCats[0].id }]);
      console.log("   ✅ Set category to Coffee");
    }
  } catch (_) {}

  // 4) Ensure Size attribute with values Small/Medium exists (create_variant = 'always')
  const sizeAttrs = await (odoo as any).searchRead(
    "product.attribute",
    [["name", "=", "Size"]],
    ["id", "name", "create_variant", "display_type"]
  );
  let sizeAttrId: number;
  if (sizeAttrs.length) {
    sizeAttrId = sizeAttrs[0].id;
    await (odoo as any).rpc("product.attribute", "write", [[sizeAttrId], { create_variant: "always", display_type: "select" }]);
    console.log(`   ✅ Using existing Size attribute (ID ${sizeAttrId})`);
  } else {
    sizeAttrId = await (odoo as any).rpc("product.attribute", "create", [{ name: "Size", create_variant: "always", display_type: "select" }]);
    console.log(`   ➕ Created Size attribute (ID ${sizeAttrId})`);
  }

  // Ensure values Small, Medium exist
  const ensureValue = async (name: string) => {
    const vals = await (odoo as any).searchRead(
      "product.attribute.value",
      [["attribute_id", "=", sizeAttrId], ["name", "=", name]],
      ["id", "name"]
    );
    if (vals.length) return vals[0].id as number;
    const id = await (odoo as any).rpc("product.attribute.value", "create", [{ attribute_id: sizeAttrId, name }]);
    console.log(`     ➕ Added Size value ${name} (ID ${id})`);
    return id;
  };

  const smallValId = await ensureValue("Small");
  const mediumValId = await ensureValue("Medium");

  // 5) Attach Size attribute line to primary template with Small + Medium
  const existingLine = await (odoo as any).searchRead(
    "product.template.attribute.line",
    [["product_tmpl_id", "=", primary.id], ["attribute_id", "=", sizeAttrId]],
    ["id", "value_ids", "product_tmpl_id"]
  );

  if (existingLine.length) {
    const valIds: number[] = existingLine[0].value_ids || [];
    const merged = Array.from(new Set([smallValId, mediumValId, ...valIds]));
    await (odoo as any).rpc("product.template.attribute.line", "write", [[existingLine[0].id], { value_ids: [[6, 0, merged]] }]);
    console.log("   ✏️ Updated Size line on primary template");
  } else {
    await (odoo as any).rpc("product.template.attribute.line", "create", [{ product_tmpl_id: primary.id, attribute_id: sizeAttrId, value_ids: [[6, 0, [smallValId, mediumValId]]] }]);
    console.log("   ➕ Added Size line (Small, Medium)");
  }

  // 6) Set price logic: base = Medium, Small = observed -10 if found
  const prices = products.map((p: any) => Number(p.list_price)).sort((a: number, b: number) => a - b);
  const uniquePrices = Array.from(new Set(prices));
  const mediumPrice = uniquePrices.includes(Number(primary.list_price)) ? Number(primary.list_price) : uniquePrices[uniquePrices.length - 1] || Number(primary.list_price);
  const smallPrice = uniquePrices.find((p) => p < mediumPrice) || mediumPrice;

  // Set primary template base price to mediumPrice
  await (odoo as any).rpc("product.template", "write", [[primary.id], { list_price: mediumPrice }]);
  console.log(`   💵 Set base list_price = Medium (${mediumPrice})`);

  // Find PTAVs to set price_extra per value
  const ptavs = await (odoo as any).searchRead(
    "product.template.attribute.value",
    [["product_tmpl_id", "=", primary.id], ["product_attribute_value_id", "in", [smallValId, mediumValId]]],
    ["id", "product_attribute_value_id", "price_extra"]
  );

  const findPtav = (valId: number) => ptavs.find((x: any) => x.product_attribute_value_id[0] === valId);

  const smallDelta = smallPrice - mediumPrice; // likely negative
  const mediumDelta = 0;

  const smallPtav = findPtav(smallValId);
  const mediumPtav = findPtav(mediumValId);

  if (smallPtav) {
    await (odoo as any).rpc("product.template.attribute.value", "write", [[smallPtav.id], { price_extra: smallDelta }]);
    console.log(`   💰 Small price_extra = ${smallDelta} (to reach ${smallPrice})`);
  }
  if (mediumPtav) {
    await (odoo as any).rpc("product.template.attribute.value", "write", [[mediumPtav.id], { price_extra: mediumDelta }]);
    console.log(`   💰 Medium price_extra = ${mediumDelta}`);
  }

  // 7) Archive duplicates (keep primary)
  const toArchive = products.filter((p: any) => p.id !== primary.id).map((p: any) => p.id);
  if (toArchive.length) {
    await (odoo as any).rpc("product.template", "write", [toArchive, { active: false }]);
    console.log(`   🗑️ Archived ${toArchive.length} duplicate Americano items`);
  }

  console.log("\n✅ Americano consolidation complete.");
}

consolidateAmericano().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { createOdooClient } from "../src/server/utils/odooClient";
import dotenv from "dotenv";

dotenv.config();

type OdooAny = any;

async function ensureSizeAttribute(odoo: OdooAny) {
  const attrs = await (odoo as any).searchRead(
    "product.attribute",
    [["name", "=", "Size"]],
    ["id", "name", "create_variant", "display_type"]
  );
  let sizeAttrId: number;
  if (attrs.length) {
    sizeAttrId = attrs[0].id;
    await (odoo as any).rpc("product.attribute", "write", [[sizeAttrId], { create_variant: "always", display_type: "select" }]);
  } else {
    sizeAttrId = await (odoo as any).rpc("product.attribute", "create", [{ name: "Size", create_variant: "always", display_type: "select" }]);
  }

  const ensureValue = async (name: string) => {
    const vals = await (odoo as any).searchRead(
      "product.attribute.value",
      [["attribute_id", "=", sizeAttrId], ["name", "=", name]],
      ["id", "name"]
    );
    if (vals.length) return vals[0].id as number;
    const id = await (odoo as any).rpc("product.attribute.value", "create", [{ attribute_id: sizeAttrId, name }]);
    return id;
  };

  const smallValId = await ensureValue("Small");
  const mediumValId = await ensureValue("Medium");

  return { sizeAttrId, smallValId, mediumValId };
}

async function setCoffeeCategory(odoo: OdooAny, productId: number) {
  const cats = await (odoo as any).searchRead("product.category", [["name", "=", "Coffee"]], ["id", "name"]);
  if (cats.length) {
    await (odoo as any).rpc("product.template", "write", [[productId], { categ_id: cats[0].id }]);
  }
}

async function consolidateDrink(odoo: OdooAny, options: {
  name: string;
  skuHint?: string; // prefer this default_code if found
  exclude?: string[]; // substrings to exclude from name
}) {
  const { name, skuHint, exclude = [] } = options;
  console.log(`\n☕ Consolidating ${name} into single product with Size attribute...`);

  // Build domain: active true, name ilike target, exclude substrings like "Iced", "Spanish", etc.
  const domain: any[] = [["active", "=", true], ["name", "ilike", name]];
  for (const ex of exclude) domain.push(["name", "not ilike", ex]);

  const candidates = await (odoo as any).searchRead(
    "product.template",
    domain,
    ["id", "name", "list_price", "default_code", "categ_id"]
  );

  if (!candidates.length) {
    console.log(`   ❌ No ${name} products found (after exclusions).`);
    return;
  }

  console.log(`   📦 Found ${candidates.length} ${name} entries:`);
  candidates.forEach((p: any) => console.log(`      • ID ${p.id} | ${p.name} | ${p.list_price} | ${p.default_code || ""}`));

  // Choose primary: prefer skuHint, else highest price
  let primary: any = null;
  if (skuHint) {
    primary = candidates.find((p: any) => (p.default_code || "").toUpperCase() === skuHint.toUpperCase()) || null;
  }
  if (!primary) {
    primary = candidates.slice().sort((a: any, b: any) => Number(b.list_price) - Number(a.list_price))[0];
  }
  console.log(`   🧭 Primary: ID ${primary.id} | ${primary.name} | ${primary.list_price}`);

  // Ensure category = Coffee
  await setCoffeeCategory(odoo, primary.id);

  // Ensure Size attribute and values
  const { sizeAttrId, smallValId, mediumValId } = await ensureSizeAttribute(odoo);

  // Attach or update size line
  const existingLine = await (odoo as any).searchRead(
    "product.template.attribute.line",
    [["product_tmpl_id", "=", primary.id], ["attribute_id", "=", sizeAttrId]],
    ["id", "value_ids"]
  );

  if (existingLine.length) {
    const valIds: number[] = existingLine[0].value_ids || [];
    const merged = Array.from(new Set([smallValId, mediumValId, ...valIds]));
    await (odoo as any).rpc("product.template.attribute.line", "write", [[existingLine[0].id], { value_ids: [[6, 0, merged]] }]);
  } else {
    await (odoo as any).rpc("product.template.attribute.line", "create", [{ product_tmpl_id: primary.id, attribute_id: sizeAttrId, value_ids: [[6, 0, [smallValId, mediumValId]]] }]);
  }

  // Price logic: base = Medium (highest observed), Small = next lower if exists
  const prices = candidates.map((p: any) => Number(p.list_price)).sort((a: number, b: number) => a - b);
  const unique = Array.from(new Set(prices));
  const mediumPrice = unique[unique.length - 1] || Number(primary.list_price);
  const smallPrice = unique.find((p) => p < mediumPrice) ?? mediumPrice;

  await (odoo as any).rpc("product.template", "write", [[primary.id], { list_price: mediumPrice }]);

  const ptavs = await (odoo as any).searchRead(
    "product.template.attribute.value",
    [["product_tmpl_id", "=", primary.id], ["product_attribute_value_id", "in", [smallValId, mediumValId]]],
    ["id", "product_attribute_value_id", "price_extra"]
  );

  const findPtav = (valId: number) => ptavs.find((x: any) => x.product_attribute_value_id[0] === valId);
  const smallPtav = findPtav(smallValId);
  const mediumPtav = findPtav(mediumValId);

  const smallDelta = smallPrice - mediumPrice; // negative or zero
  const mediumDelta = 0;

  if (smallPtav) await (odoo as any).rpc("product.template.attribute.value", "write", [[smallPtav.id], { price_extra: smallDelta }]);
  if (mediumPtav) await (odoo as any).rpc("product.template.attribute.value", "write", [[mediumPtav.id], { price_extra: mediumDelta }]);

  // Archive other duplicates
  const toArchive = candidates.filter((p: any) => p.id !== primary.id).map((p: any) => p.id);
  if (toArchive.length) {
    await (odoo as any).rpc("product.template", "write", [toArchive, { active: false }]);
    console.log(`   🗑️ Archived ${toArchive.length} duplicate ${name} items`);
  }

  console.log(`   ✅ ${name} consolidation complete.`);
}

async function main() {
  const odoo = createOdooClient();
  if (!odoo) {
    console.error("Odoo not configured");
    process.exit(1);
  }

  // Latte: exclude iced, spanish, matcha, chai
  await consolidateDrink(odoo, { name: "Latte", skuHint: "MC002", exclude: ["Iced", "Spanish", "Matcha", "Chai"] });
  // Cappuccino: exclude iced
  await consolidateDrink(odoo, { name: "Cappuccino", skuHint: "EE006", exclude: ["Iced"] });

  console.log("\n🎉 Consolidation tasks finished.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

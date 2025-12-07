import { createOdooClient } from "../src/server/utils/odooClient";
import dotenv from "dotenv";

dotenv.config();

async function ensureSizeAttribute(odoo: any) {
  const attrs = await (odoo as any).searchRead("product.attribute", [["name", "=", "Size"]], ["id", "name"]);
  if (attrs.length === 0) {
    const id = await (odoo as any).rpc("product.attribute", "create", [{ name: "Size", create_variant: "always", display_type: "select" }]);
    return id as number;
  }
  return attrs[0].id as number;
}

async function ensureValue(odoo: any, attributeId: number, name: string) {
  const vals = await (odoo as any).searchRead("product.attribute.value", [["attribute_id", "=", attributeId], ["name", "=", name]], ["id", "name"]);
  if (vals.length) return vals[0].id as number;
  const id = await (odoo as any).rpc("product.attribute.value", "create", [{ attribute_id: attributeId, name }]);
  return id as number;
}

async function addLargeToTemplate(odoo: any, tmplId: number, priceExtra: number) {
  const sizeAttrId = await ensureSizeAttribute(odoo);
  const largeValId = await ensureValue(odoo, sizeAttrId, "Large");

  const line = await (odoo as any).searchRead(
    "product.template.attribute.line",
    [["product_tmpl_id", "=", tmplId], ["attribute_id", "=", sizeAttrId]],
    ["id", "value_ids"]
  );
  if (line.length) {
    const current = line[0].value_ids || [];
    const merged = Array.from(new Set([...current, largeValId]));
    await (odoo as any).rpc("product.template.attribute.line", "write", [[line[0].id], { value_ids: [[6, 0, merged]] }]);
  } else {
    await (odoo as any).rpc("product.template.attribute.line", "create", [{ product_tmpl_id: tmplId, attribute_id: sizeAttrId, value_ids: [[6, 0, [largeValId]]] }]);
  }

  const ptavs = await (odoo as any).searchRead(
    "product.template.attribute.value",
    [["product_tmpl_id", "=", tmplId]],
    ["id", "name", "product_attribute_value_id", "price_extra"]
  );

  const largePtav = ptavs.find((v: any) => v.name === "Large" || (Array.isArray(v.product_attribute_value_id) && v.product_attribute_value_id[1] === "Large"));
  if (largePtav) {
    await (odoo as any).rpc("product.template.attribute.value", "write", [[largePtav.id], { price_extra: priceExtra }]);
  }
}

async function main() {
  const odoo = createOdooClient();
  if (!odoo) {
    console.error("Odoo not configured");
    process.exit(1);
  }

  // Find core drink templates (non-iced): Americano, Latte, Cappuccino
  const names = ["Americano", "Latte", "Cappuccino"];
  for (const name of names) {
    const tmpls = await (odoo as any).searchRead(
      "product.template",
      [["active", "=", true], ["name", "ilike", name], ["name", "not ilike", "Iced"]],
      ["id", "name", "list_price"]
    );
    if (!tmpls.length) {
      console.log(`❌ No templates found for ${name}`);
      continue;
    }
    // Use highest price as medium base; large = +20 by default
    const primary = tmpls.slice().sort((a: any, b: any) => Number(b.list_price) - Number(a.list_price))[0];
    await addLargeToTemplate(odoo, primary.id, 20);
    console.log(`✅ Added Large to ${name} (tmpl ${primary.id}) with +20 price extra`);
  }

  console.log("\n🎉 Large size added to core drinks.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

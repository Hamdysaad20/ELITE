import { createOdooClient } from "../src/server/utils/odooClient";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const odoo = createOdooClient();
  if (!odoo) {
    console.error("Odoo not configured");
    process.exit(1);
  }

  console.log("🔧 Fixing Americano Size pricing to Small -10 / Medium 0...");

  // Find Americano primary (non-iced) templates
  const products = await (odoo as any).searchRead(
    "product.template",
    [["active", "=", true], ["name", "ilike", "Americano"], ["name", "not ilike", "Iced"]],
    ["id", "name", "list_price"]
  );
  if (!products.length) {
    console.log("   ❌ No Americano templates found.");
    return;
  }

  // Choose the one with max price as Medium base (expected 70)
  const primary = products.slice().sort((a: any, b: any) => Number(b.list_price) - Number(a.list_price))[0];
  const mediumPrice = Number(primary.list_price) || 70;

  // Ensure base price is mediumPrice (70)
  await (odoo as any).rpc("product.template", "write", [[primary.id], { list_price: mediumPrice }]);

  // Look up Size attribute values on this template
  const sizeAttr = await (odoo as any).searchRead(
    "product.attribute",
    [["name", "=", "Size"]],
    ["id"]
  );
  if (!sizeAttr.length) {
    console.log("   ❌ Size attribute not found on system.");
    return;
  }
  const sizeAttrId = sizeAttr[0].id;

  // Find PTAVs for Small/Medium
  const ptavs = await (odoo as any).searchRead(
    "product.template.attribute.value",
    [["product_tmpl_id", "=", primary.id]],
    ["id", "name", "price_extra", "attribute_id", "product_attribute_value_id"]
  );

  const getByName = (n: string) => ptavs.find((v: any) => v.name === n || (Array.isArray(v.product_attribute_value_id) && v.product_attribute_value_id[1] === n));
  const small = getByName("Small");
  const medium = getByName("Medium");

  if (!small || !medium) {
    console.log("   ⚠️ Missing Small/Medium values on Americano; nothing changed.");
    return;
  }

  // Set deltas: Small -10, Medium 0
  await (odoo as any).rpc("product.template.attribute.value", "write", [[small.id], { price_extra: -10 }]);
  await (odoo as any).rpc("product.template.attribute.value", "write", [[medium.id], { price_extra: 0 }]);

  console.log(`   ✅ Updated Americano (tmpl ${primary.id}) -> base ${mediumPrice}, Small -10, Medium 0`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { createOdooClient } from "../src/server/utils/odooClient";
import dotenv from "dotenv";

dotenv.config();

// Target category names - must exist already (created earlier scripts)
const CATEGORIES = {
  EXTRAS: "Extras",
  BOBA: "Boba",
  ICED: "Iced",
  COFFEE: "Coffee",
  TEA: "Tea",
};

const TYPO_RENAMES: Array<{ from: RegExp; to: string }> = [
  { from: /^\s*espresso avocado\s*$/i, to: "Espresso Avocado" },
  { from: /^iced\s*macchiat$/i, to: "Iced Macchiato" },
  { from: /Amricano/i, to: "Americano" },
  { from: /HUNY CAKE\s*$/i, to: "Honey Cake" },
  { from: /^extra\s*Marshmello$/i, to: "Extra Marshmallow" },
  { from: /^ice\s*Flavours$/i, to: "Ice Flavors" },
  { from: /^AMERICANO\s*-\s*M$/i, to: "Americano (M)" },
];

const MOVE_TO_EXTRAS = [
  "Cup",
  "Water",
  "KINDER STEAK Single",
  "EXTRA BOBA",
  "EXTRA Flavor",
  "Extra Honey",
  "Extra Ice Cream Scoop",
  "Extra Shot",
  "Extra whip cream",
  "Premium topping",
  "[EXTRA]Coconut Milk",
  "Coconut Milk",
  "Chai Flavours",
  "Chai Flavors",
];

const MOVE_TO_BOBA = [
  "BOBA Spanish latte",
];

const MARSHMALLOW_ATTR = {
  name: "Marshmallow",
  values: ["No Marshmallow", "Marshmallow"],
};

const APPLY_MARSHMALLOW_TO = [
  "Chocolate (Hot)",
  "Hot Chocolate",
  "Mocha",
  "Iced Mocha",
  "Mocha Frappé",
];

const DRY_RUN = process.env.DRY_RUN === "true"; // set DRY_RUN=true to preview without changes

async function main() {
  const odoo = createOdooClient();
  if (!odoo) {
    console.error("Odoo not configured");
    process.exit(1);
  }

  console.log("🔧 Phase 4: Typos, Attributes, Moves, Duplicates\n");

  // 1) Build category name -> id map
  const categories = await (odoo as any).searchRead(
    "product.category",
    [],
    ["id", "name"]
  );
  const catByName: Record<string, number> = {};
  for (const c of categories) catByName[c.name] = c.id;

  const getCatId = (name: string) => {
    const id = catByName[name];
    if (!id) console.warn(`   ⚠️ Category not found: ${name}`);
    return id;
  };

  // 2) Fetch all active products with key fields
  const products = await (odoo as any).searchRead(
    "product.template",
    [["active", "=", true]],
    ["id", "name", "list_price", "default_code", "categ_id"]
  );
  console.log(`📦 Loaded ${products.length} active products`);

  // Helpers
  const writeProduct = async (id: number, vals: Record<string, any>, label: string) => {
    if (DRY_RUN) {
      console.log(`   [dry-run] ${label} ->`, vals);
      return;
    }
    await (odoo as any).rpc("product.template", "write", [[id], vals]);
  };

  // 3) Rename obvious typos
  console.log("\n✏️ Fixing product name typos...");
  for (const p of products) {
    const original = p.name as string;
    let fixed = original;
    for (const rule of TYPO_RENAMES) {
      if (rule.from.test(fixed)) fixed = fixed.replace(rule.from, rule.to);
    }
    if (fixed !== original) {
      console.log(`   • ${original} -> ${fixed}`);
      await writeProduct(p.id, { name: fixed }, "rename");
    }
  }

  // 4) Ensure Marshmallow attribute exists and attach to target products
  console.log("\n🍡 Ensuring Marshmallow attribute + values...");
  let marshAttr = await (odoo as any).searchRead(
    "product.attribute",
    [["name", "=", MARSHMALLOW_ATTR.name]],
    ["id", "name", "create_variant", "display_type"]
  );
  let marshAttrId: number;
  if (marshAttr.length) {
    marshAttrId = marshAttr[0].id;
    await (odoo as any).rpc("product.attribute", "write", [[marshAttrId], { create_variant: "no_variant", display_type: "pills" }]);
    console.log(`   ✅ Found Marshmallow attribute (ID ${marshAttrId})`);
  } else {
    marshAttrId = await (odoo as any).rpc("product.attribute", "create", [{ name: MARSHMALLOW_ATTR.name, create_variant: "no_variant", display_type: "pills" }]);
    console.log(`   ➕ Created Marshmallow attribute (ID ${marshAttrId})`);
  }

  const existingVals = await (odoo as any).searchRead(
    "product.attribute.value",
    [["attribute_id", "=", marshAttrId]],
    ["id", "name"]
  );
  const valByName: Record<string, number> = {};
  for (const v of existingVals) valByName[v.name] = v.id;
  for (const name of MARSHMALLOW_ATTR.values) {
    if (!valByName[name]) {
      const id = await (odoo as any).rpc("product.attribute.value", "create", [{ attribute_id: marshAttrId, name }]);
      valByName[name] = id;
      console.log(`   ➕ Added value: ${name} (ID ${id})`);
    }
  }

  // Attach to products by name
  console.log("   🔗 Attaching Marshmallow to target products...");
  for (const target of APPLY_MARSHMALLOW_TO) {
    const found = await (odoo as any).searchRead(
      "product.template",
      [["name", "=", target]],
      ["id", "name"]
    );
    if (!found.length) {
      console.log(`   ℹ️ Skip, product not found: ${target}`);
      continue;
    }
    const prod = found[0];
    const lines = await (odoo as any).searchRead(
      "product.template.attribute.line",
      [["product_tmpl_id", "=", prod.id], ["attribute_id", "=", marshAttrId]],
      ["id", "value_ids"]
    );
    const valueIds = [valByName["No Marshmallow"], valByName["Marshmallow"]];
    if (lines.length) {
      await (odoo as any).rpc("product.template.attribute.line", "write", [[lines[0].id], { value_ids: [[6, 0, valueIds]] }]);
      console.log(`     ✏️ Updated: ${prod.name}`);
    } else {
      await (odoo as any).rpc("product.template.attribute.line", "create", [{ product_tmpl_id: prod.id, attribute_id: marshAttrId, value_ids: [[6, 0, valueIds]] }]);
      console.log(`     ➕ Added: ${prod.name}`);
    }
  }

  // 5) Move miscategorized items
  console.log("\n📦 Moving miscategorized items...");
  const extrasCatId = getCatId(CATEGORIES.EXTRAS);
  const bobaCatId = getCatId(CATEGORIES.BOBA);
  const icedCatId = getCatId(CATEGORIES.ICED);
  if (!extrasCatId || !bobaCatId) {
    console.log("   ⚠️ Missing required categories; skipping moves.");
  } else {
    for (const name of MOVE_TO_EXTRAS) {
      const found = await (odoo as any).searchRead(
        "product.template",
        [["name", "=", name]],
        ["id", "name", "categ_id"]
      );
      for (const prod of found) {
        if (prod.categ_id?.[0] !== extrasCatId) {
          console.log(`   • ${prod.name}: ${prod.categ_id?.[1]} → Extras`);
          await writeProduct(prod.id, { categ_id: extrasCatId }, "move->extras");
        }
      }
    }

    for (const name of MOVE_TO_BOBA) {
      const found = await (odoo as any).searchRead(
        "product.template",
        [["name", "=", name]],
        ["id", "name", "categ_id"]
      );
      for (const prod of found) {
        if (prod.categ_id?.[0] !== bobaCatId) {
          console.log(`   • ${prod.name}: ${prod.categ_id?.[1]} → Boba`);
          await writeProduct(prod.id, { categ_id: bobaCatId }, "move->boba");
        }
      }
    }
  }

  // 6) Archive obvious duplicates (exact same name + price) keeping lowest ID
  console.log("\n🗂️ Archiving exact duplicates (same name + price)...");
  const byKey: Record<string, Array<{ id: number; name: string; price: number }>> = {};
  for (const p of products) {
    const key = `${(p.name || "").trim().toLowerCase()}|${Number(p.list_price)}`;
    if (!byKey[key]) byKey[key] = [];
    byKey[key].push({ id: p.id, name: p.name, price: p.list_price });
  }
  for (const [key, list] of Object.entries(byKey)) {
    if (list.length <= 1) continue;
    // keep the smallest id, archive others
    const sorted = list.sort((a, b) => a.id - b.id);
    const keep = sorted[0];
    const archive = sorted.slice(1);
    for (const item of archive) {
      if (DRY_RUN) {
        console.log(`   [dry-run] archive duplicate ${item.name} (ID ${item.id})`);
      } else {
        await (odoo as any).rpc("product.template", "write", [[item.id], { active: false }]);
        console.log(`   🗑️ Archived duplicate ${item.name} (ID ${item.id})`);
      }
    }
  }

  console.log("\n✅ Phase 4 complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { createOdooClient } from "../src/server/utils/odooClient";
import dotenv from "dotenv";

dotenv.config();

const SHORT_NAMES: Array<{ id?: number; name?: string; newName: string }> = [
  { id: 13, newName: "Coffee" },
  { id: 14, newName: "Tea" },
  { id: 18, newName: "Iced" },
  { id: 19, newName: "Frappe" },
  { id: 20, newName: "Milkshake" },
  { id: 21, newName: "Smoothie" },
  { id: 23, newName: "Soda" },
  { id: 26, newName: "Food" },
];

const EXTRAS_PATTERNS = [
  /\bextra\b/i,
  /^\[EXTRA]/i,
  /whip cream/i,
  /ice cream scoop/i,
  /premium topping/i,
  /^cup$/i,
  /^water$/i,
  /\bmilk\b/i, // Coconut Milk, etc.
  /EXTRA BOBA/i,
  /^Coconut Milk$/i,
  /^\[EXTRA]Coconut Milk$/i,
  /^Extra Shot$/i,
  /^Extra Honey\b/i,
  /^Extra Ice Cream Scoop$/i,
  /^Extra whip cream$/i,
  /^EXTRA Flavor\b/i,
];

async function ensureExtrasCategory(odoo: any) {
  const existing = await (odoo as any).searchRead(
    "product.category",
    [["name", "=", "Extras"]],
    ["id", "name"]
  );
  if (existing.length) return existing[0].id as number;
  const id = await (odoo as any).rpc("product.category", "create", [{ name: "Extras" }]);
  return id as number;
}

async function main() {
  const odoo = createOdooClient();
  if (!odoo) {
    console.error("Odoo not configured");
    process.exit(1);
  }

  console.log("🏷️ Renaming categories to short names...");
  for (const entry of SHORT_NAMES) {
    try {
      let cats: any[] = [];
      if (entry.id) {
        cats = await (odoo as any).searchRead("product.category", [["id", "=", entry.id]], ["id", "name"]);
      } else if (entry.name) {
        cats = await (odoo as any).searchRead("product.category", [["name", "=", entry.name]], ["id", "name"]);
      }
      if (cats.length) {
        const cat = cats[0];
        if (cat.name !== entry.newName) {
          await (odoo as any).rpc("product.category", "write", [[cat.id], { name: entry.newName }]);
          console.log(`   ✅ ${cat.name} -> ${entry.newName}`);
        } else {
          console.log(`   • ${entry.newName} already set`);
        }
      }
    } catch (e) {
      console.log(`   ⚠️ Unable to rename category id=${entry.id} to ${entry.newName}`);
    }
  }

  console.log("\n🧰 Ensuring Extras category and moving add-ons...");
  const extrasId = await ensureExtrasCategory(odoo);

  const products = await (odoo as any).searchRead(
    "product.template",
    [["active", "=", true]],
    ["id", "name", "categ_id"]
  );

  let moved = 0;
  for (const p of products) {
    const name: string = p.name || "";
    const isExtra = EXTRAS_PATTERNS.some((re) => re.test(name));
    if (!isExtra) continue;
    const currentCatId = Array.isArray(p.categ_id) ? p.categ_id[0] : p.categ_id;
    if (currentCatId === extrasId) continue;
    try {
      await (odoo as any).rpc("product.template", "write", [[p.id], { categ_id: extrasId }]);
      moved++;
      console.log(`   ➜ Moved "${name}" to Extras`);
    } catch (e) {
      console.log(`   ❌ Failed to move "${name}": ${(e as any)?.message || e}`);
    }
  }

  console.log(`\n✨ Done. Moved ${moved} products to Extras.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

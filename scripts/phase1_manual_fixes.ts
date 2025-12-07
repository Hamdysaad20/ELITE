import { createOdooClient, OdooClient } from "../src/server/utils/odooClient";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Phase 1.2b: Fix remaining uncategorized products (manual review)
 */

interface OdooClientWithRpc extends OdooClient {
  rpc<T = any>(model: string, method: string, args?: any[], kwargs?: Record<string, unknown>): Promise<T>;
}

const CATEGORIES = {
  HOT_COFFEE: 13,
  HOT_TEA: 14,
  ICED_DRINKS: 18,
  FRAPPE: 19,
  MILKSHAKE: 20,
  SMOOTHIE: 21,
  FOOD: 26,
  GOODS: 23,
  SERVICES: 29, // Services category
};

// Manual categorization for remaining products
const MANUAL_FIXES: Array<{ id: number; name: string; category: number }> = [
  { id: 677, name: "Chocolate (Hot)", category: CATEGORIES.HOT_COFFEE }, // Hot chocolate drink
  { id: 782, name: "Morning Bird Offer L/C", category: CATEGORIES.HOT_COFFEE }, // L/C = Latte/Cappuccino
  { id: 722, name: "Water", category: CATEGORIES.GOODS },
  { id: 796, name: "brownies", category: CATEGORIES.FOOD },
  { id: 629, name: "Icee Chocolate", category: CATEGORIES.ICED_DRINKS },
  // POS service items stay in Services
  { id: 788, name: "Cup", category: CATEGORIES.GOODS },
];

async function main() {
  const odoo = createOdooClient() as OdooClientWithRpc | null;
  if (!odoo) {
    console.error("Odoo not configured");
    process.exit(1);
  }

  console.log("🔧 Applying manual category fixes...\n");

  for (const fix of MANUAL_FIXES) {
    try {
      await odoo.rpc("product.template", "write", [[fix.id], { categ_id: fix.category }]);
      console.log(`   ✅ "${fix.name}" -> Category ${fix.category}`);
    } catch (err: any) {
      console.error(`   ❌ Failed: "${fix.name}": ${err.message}`);
    }
  }

  console.log("\n✅ Done!");
}

main().catch(console.error);

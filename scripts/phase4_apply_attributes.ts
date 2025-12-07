import { createOdooClient, OdooClient } from "../src/server/utils/odooClient";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Phase 4: Apply attributes to products based on category
 * 
 * This script:
 * 1. Maps attributes to categories
 * 2. Ensures each product has the correct attributes
 * 3. Sets proper pricing for attribute values
 */

interface OdooClientWithRpc extends OdooClient {
  rpc<T = any>(model: string, method: string, args?: any[], kwargs?: Record<string, unknown>): Promise<T>;
}

// Category IDs
const CATEGORIES = {
  HOT_COFFEE: 13,
  HOT_TEA: 14,
  ICED_DRINKS: 18,
  FRAPPE: 19,
  MILKSHAKE: 20,
  SMOOTHIE: 21,
  FOOD: 26,
  GOODS: 23,
};

// Attribute configuration - will be resolved dynamically
let ATTRS: Record<string, { id: number; name: string }> = {};

// Which attributes apply to which categories
const CATEGORY_ATTR_RULES: Record<number, string[]> = {
  [CATEGORIES.HOT_COFFEE]: ["size", "milk", "espresso shots", "flavor", "sugar level", "foam"],
  [CATEGORIES.HOT_TEA]: ["size", "sugar level"],
  [CATEGORIES.ICED_DRINKS]: ["size", "milk", "espresso shots", "flavor", "sugar level", "ice level", "temperature"],
  [CATEGORIES.FRAPPE]: ["size", "milk", "espresso shots", "flavor", "whipped cream", "drizzle"],
  [CATEGORIES.MILKSHAKE]: ["size", "milk", "flavor", "whipped cream"],
  [CATEGORIES.SMOOTHIE]: ["size", "extras"],
};

// Pricing rules per attribute value
const PRICING_RULES: Record<string, Record<string, number>> = {
  "size": {
    "S": 0,
    "M": 10,
    "L": 20,
  },
  "milk": {
    "Whole Milk": 0,
    "Oat Milk": 25,
    "Almond Milk": 25,
    "Coconut Milk": 25,
  },
  "espresso shots": {
    "No Shot": 0,
    "Single Shot": 20,
    "Double Shot": 35,
    "Triple Shot": 45,
  },
  "flavor": {
    "Vanilla": 15,
    "Caramel": 15,
    "Hazelnut": 15,
    "Pistachio": 15,
    "Cinnamon": 15,
    "Strawberry": 15,
    "Honey": 15,
    "Mint": 15,
  },
  "sugar level": {
    "0%": 0,
    "25%": 0,
    "50%": 0,
    "100%": 0,
  },
  "ice level": {
    "Regular Ice": 0,
    "No Ice": 10,
  },
  "temperature": {
    "Hot": 0,
    "Iced": 5,
  },
  "whipped cream": {
    "No Whip": 0,
    "Light Whip": 0,
    "Regular Whip": 0,
    "Extra Whip": 10,
  },
  "drizzle": {
    "No Drizzle": 0,
    "Caramel Drizzle": 10,
    "Chocolate Drizzle": 10,
    "Both Drizzles": 15,
  },
  "foam": {
    "No Foam": 0,
    "Light Foam": 0,
    "Regular Foam": 0,
    "Extra Foam": 0,
  },
  "extras": {
    "Tapioca Pearls": 30,
    "Boba Extra": 30,
  },
};

async function main() {
  const odoo = createOdooClient() as OdooClientWithRpc | null;
  if (!odoo) {
    console.error("Odoo not configured");
    process.exit(1);
  }

  console.log("🔧 Phase 4: Applying attributes to products...\n");

  // 1. Resolve attribute IDs
  console.log("1️⃣ Resolving attribute IDs...");
  const attributes = await odoo.searchRead("product.attribute", [], ["id", "name"]);
  for (const attr of attributes) {
    ATTRS[attr.name.toLowerCase()] = { id: attr.id, name: attr.name };
  }
  console.log(`   Found ${attributes.length} attributes\n`);

  // 2. Get all attribute values with their IDs
  console.log("2️⃣ Loading attribute values...");
  const allValues = await odoo.searchRead("product.attribute.value", [], ["id", "name", "attribute_id"]);
  const valuesByAttr: Record<number, Map<string, number>> = {};
  for (const v of allValues) {
    const attrId = v.attribute_id[0];
    if (!valuesByAttr[attrId]) valuesByAttr[attrId] = new Map();
    valuesByAttr[attrId].set(v.name.toLowerCase(), v.id);
  }
  console.log(`   Loaded ${allValues.length} values\n`);

  // 3. Get products by category
  console.log("3️⃣ Fetching products...");
  const products = await odoo.searchRead(
    "product.template",
    [["active", "=", true], ["sale_ok", "=", true]],
    ["id", "name", "categ_id", "attribute_line_ids"]
  );
  console.log(`   Found ${products.length} products\n`);

  // Group products by category
  const productsByCategory: Record<number, any[]> = {};
  for (const p of products) {
    const catId = p.categ_id?.[0] || 0;
    if (!productsByCategory[catId]) productsByCategory[catId] = [];
    productsByCategory[catId].push(p);
  }

  // 4. Process each category
  console.log("4️⃣ Applying attributes by category...\n");
  
  let totalUpdated = 0;
  let totalErrors = 0;

  for (const [catIdStr, catProducts] of Object.entries(productsByCategory)) {
    const catId = parseInt(catIdStr);
    const requiredAttrs = CATEGORY_ATTR_RULES[catId];
    
    if (!requiredAttrs || requiredAttrs.length === 0) {
      console.log(`⏭️  Category ${catId}: No attribute rules defined (${catProducts.length} products)`);
      continue;
    }

    const catName = catProducts[0]?.categ_id?.[1] || `Category ${catId}`;
    console.log(`📁 ${catName} (${catProducts.length} products)`);
    console.log(`   Required attrs: ${requiredAttrs.join(", ")}`);

    for (const product of catProducts) {
      const result = await applyAttributesToProduct(odoo, product, requiredAttrs, valuesByAttr);
      if (result.success) {
        totalUpdated++;
        if (result.changes > 0) {
          console.log(`   ✅ "${product.name}": ${result.changes} attributes updated`);
        }
      } else {
        totalErrors++;
        console.log(`   ❌ "${product.name}": ${result.error}`);
      }
    }
    console.log();
  }

  console.log(`\n✅ Phase 4 complete!`);
  console.log(`   Updated: ${totalUpdated} products`);
  console.log(`   Errors: ${totalErrors}`);
}

async function applyAttributesToProduct(
  odoo: OdooClientWithRpc,
  product: any,
  requiredAttrNames: string[],
  valuesByAttr: Record<number, Map<string, number>>
): Promise<{ success: boolean; changes: number; error?: string }> {
  let changes = 0;

  try {
    // Get existing attribute lines
    const existingLines = await odoo.searchRead(
      "product.template.attribute.line",
      [["product_tmpl_id", "=", product.id]],
      ["id", "attribute_id", "value_ids"]
    );
    const existingAttrIds = new Set(existingLines.map(l => l.attribute_id[0]));

    for (const attrName of requiredAttrNames) {
      const attrDef = ATTRS[attrName.toLowerCase()];
      if (!attrDef) {
        // console.log(`      ⚠️ Attribute "${attrName}" not found`);
        continue;
      }

      // Skip if already has this attribute
      if (existingAttrIds.has(attrDef.id)) {
        continue;
      }

      // Get value IDs for this attribute
      const pricingRules = PRICING_RULES[attrName.toLowerCase()];
      if (!pricingRules) {
        continue;
      }

      const attrValues = valuesByAttr[attrDef.id];
      if (!attrValues) {
        continue;
      }

      // Find matching value IDs
      const valueIds: number[] = [];
      for (const valueName of Object.keys(pricingRules)) {
        const valueId = attrValues.get(valueName.toLowerCase());
        if (valueId) {
          valueIds.push(valueId);
        }
      }

      if (valueIds.length === 0) {
        continue;
      }

      // Create attribute line
      const lineId = await odoo.rpc("product.template.attribute.line", "create", [{
        product_tmpl_id: product.id,
        attribute_id: attrDef.id,
        value_ids: [[6, 0, valueIds]], // Replace with these value IDs
      }]);

      // Set prices on the template attribute values
      const templateValues = await odoo.searchRead(
        "product.template.attribute.value",
        [["product_tmpl_id", "=", product.id], ["attribute_id", "=", attrDef.id]],
        ["id", "product_attribute_value_id", "price_extra"]
      );

      for (const tv of templateValues) {
        const valueName = tv.product_attribute_value_id[1];
        // Match loosely
        const price = Object.entries(pricingRules).find(
          ([name]) => valueName.toLowerCase().includes(name.toLowerCase()) ||
                       name.toLowerCase().includes(valueName.toLowerCase())
        )?.[1];

        if (price !== undefined && tv.price_extra !== price) {
          await odoo.rpc("product.template.attribute.value", "write", [[tv.id], { price_extra: price }]);
        }
      }

      changes++;
    }

    return { success: true, changes };
  } catch (err: any) {
    return { success: false, changes: 0, error: err.message };
  }
}

main().catch(console.error);

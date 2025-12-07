
import { createOdooClient } from "../src/server/utils/odooClient";
import * as dotenv from "dotenv";

dotenv.config();

// --- Master Configuration ---
const ATTRIBUTES = {
  SIZE: { id: 7, name: "Size" }, // Need to verify ID
  MILK: { id: 27, name: "Milk" },
  SHOTS: { id: 12, name: "Espresso Shot" }, // "coffee" in Odoo
  SYRUP: { id: 15, name: "Flavor" }, // "EXTRA Flavor" in Odoo? Need to check IDs
  BOBA: { id: 10, name: "Extras" }, // Using "Extras" for Boba for now, or create new
  ICE: { id: 31, name: "Ice Level" }, // New
  SUGAR: { id: 11, name: "Sugar Level" }, // "suger" in Odoo
};

// Pricing Rules (Extra Price)
const PRICING = {
  MILK: {
    "Whole Milk": 0,
    "Oat Milk": 25,
    "Almond Milk": 25,
    "Coconut Milk": 25,
  },
  SHOTS: {
    "No Shot": 0,
    "Single Shot": 20,
    "Double Shot": 35,
    "Triple Shot": 45,
  },
  SYRUP: {
    "Vanilla": 15,
    "Caramel": 15,
    "Hazelnut": 15,
    "Pistachio": 15,
    "Cinnamon": 15,
    "Strawberry": 15,
    "Honey": 15,
    "Mint": 15,
  },
  BOBA: {
    "Tapioca Pearls": 30,
    "Boba Extra": 30,
  },
  SIZE: {
    "S": 0,
    "M": 10,
    "L": 20,
  },
  ICE: {
    "Regular Ice": 0,
    "No Ice": 10,
  },
  SUGAR: {
    "0%": 0,
    "25%": 0,
    "50%": 0,
    "100%": 0,
  }
};

// Category Rules: Which attributes apply to which category?
const CATEGORY_RULES: Record<number, string[]> = {
  13: ["SIZE", "MILK", "SHOTS", "SYRUP"], // Hot Coffee
  18: ["SIZE", "MILK", "SHOTS", "SYRUP", "ICE", "SUGAR"], // Iced Drinks (Coffee/Boba)
  19: ["SIZE", "MILK", "SHOTS", "SYRUP"], // Frappe
  20: ["SIZE", "MILK"], // Milkshake
  14: ["SIZE", "SUGAR"], // Tea
};

// Helper to find attribute ID by name if hardcoded IDs are wrong
async function resolveAttributeIds(odoo: any) {
  const attributes = await odoo.searchRead("product.attribute", [], ["id", "name"]);
  const map: Record<string, number> = {};
  for (const attr of attributes) {
    map[attr.name.toLowerCase()] = attr.id;
  }
  console.log("Resolved Attributes:", map);
  return map;
}

async function main() {
  const odoo = createOdooClient();
  if (!odoo) {
    console.error("Odoo not configured");
    process.exit(1);
  }

  console.log("Connecting to Odoo...");
  
  // 1. Resolve Attribute IDs dynamically to be safe
  const attrMap = await resolveAttributeIds(odoo);
  
  // Update IDs based on map
  if (attrMap["size"]) ATTRIBUTES.SIZE.id = attrMap["size"];
  if (attrMap["milk"]) ATTRIBUTES.MILK.id = attrMap["milk"];
  if (attrMap["coffee"]) ATTRIBUTES.SHOTS.id = attrMap["coffee"]; // "coffee" seems to be shots
  if (attrMap["flavor"]) ATTRIBUTES.SYRUP.id = attrMap["flavor"];
  if (attrMap["suger"]) ATTRIBUTES.SUGAR.id = attrMap["suger"]; // typo in Odoo "suger"
  
  // Create missing attributes if needed
  if (!attrMap["ice level"]) {
      console.log("Creating 'Ice Level' attribute...");
      ATTRIBUTES.ICE.id = await odoo.rpc("product.attribute", "create", [{ name: "Ice Level", display_type: "radio" }]);
  } else {
      ATTRIBUTES.ICE.id = attrMap["ice level"];
  }

  // 2. Ensure Values Exist & Set Prices
  console.log("Syncing Attribute Values & Prices...");
  
  for (const [attrKey, rules] of Object.entries(PRICING)) {
      const attrDef = ATTRIBUTES[attrKey as keyof typeof ATTRIBUTES];
      if (!attrDef) continue;

      for (const [valueName, price] of Object.entries(rules)) {
          // Check if value exists
          const existing = await odoo.searchRead("product.attribute.value", 
              [["attribute_id", "=", attrDef.id], ["name", "=", valueName]], 
              ["id"]
          );
          
          let valueId;
          if (existing.length > 0) {
              valueId = existing[0].id;
          } else {
              console.log(`Creating value '${valueName}' for ${attrDef.name}...`);
              valueId = await odoo.rpc("product.attribute.value", "create", [{
                  name: valueName,
                  attribute_id: attrDef.id,
                  sequence: 10 // Default sequence
              }]);
          }
          
          // Note: We cannot set price_extra on the global value. 
          // price_extra is set on `product.template.attribute.value` (the combination).
          // However, we can try to set a default? No, Odoo doesn't work that way usually.
          // We must set it when applying to the product.
      }
  }

  // 3. Apply to Products
  console.log("Fetching active products...");
  const products = await odoo.searchRead("product.template", [["active", "=", true]], ["id", "name", "categ_id", "attribute_line_ids"]);

  for (const product of products) {
      const catId = product.categ_id[0];
      const applicableAttrs = CATEGORY_RULES[catId];
      
      if (!applicableAttrs) continue; // Skip if no rules for this category

      console.log(`Processing ${product.name} (Category: ${product.categ_id[1]})...`);

      for (const attrKey of applicableAttrs) {
          const attrDef = ATTRIBUTES[attrKey as keyof typeof ATTRIBUTES];
          const pricingRules = PRICING[attrKey as keyof typeof PRICING];
          const targetValueNames = Object.keys(pricingRules);
          
          // Get IDs for these values
          const valueIds = [];
          for (const name of targetValueNames) {
              const res = await odoo.searchRead("product.attribute.value", [["attribute_id", "=", attrDef.id], ["name", "=", name]], ["id"]);
              if (res.length > 0) valueIds.push(res[0].id);
          }

          if (valueIds.length === 0) continue;

          // Check/Create Attribute Line
          const lines = await odoo.searchRead("product.template.attribute.line", 
              [["product_tmpl_id", "=", product.id], ["attribute_id", "=", attrDef.id]], 
              ["id", "value_ids"]
          );

          let lineId;
          if (lines.length > 0) {
              lineId = lines[0].id;
              // Update values if needed (add missing ones)
              // We want to enforce our standard set.
              // Be careful not to remove existing valid ones if we only want to append?
              // The user wants "Standardization", so enforcing the set is better.
              await odoo.rpc("product.template.attribute.line", "write", [[lineId], { value_ids: [[6, 0, valueIds]] }]);
          } else {
              lineId = await odoo.rpc("product.template.attribute.line", "create", [{
                  product_tmpl_id: product.id,
                  attribute_id: attrDef.id,
                  value_ids: [[6, 0, valueIds]]
              }]);
          }

          // 4. Set Extra Prices
          // Now that the line exists/is updated, Odoo creates `product.template.attribute.value` records.
          // We need to find them and update `price_extra`.
          
          const templateValues = await odoo.searchRead("product.template.attribute.value",
              [["product_tmpl_id", "=", product.id], ["attribute_id", "=", attrDef.id]],
              ["id", "product_attribute_value_id", "price_extra"]
          );

          for (const tv of templateValues) {
              // tv.product_attribute_value_id is [id, name]
              const valueName = tv.product_attribute_value_id[1];
              // The name might be "Size: L" or just "L" depending on Odoo version/config. 
              // Usually it's the value name.
              
              // We need to match this back to our PRICING rules.
              // Odoo 15+ returns "Attribute: Value" sometimes.
              // Let's try to match loosely.
              
              const matchedName = targetValueNames.find(n => valueName.includes(n));
              if (matchedName) {
                  const price = pricingRules[matchedName as keyof typeof pricingRules];
                  if (tv.price_extra !== price) {
                      console.log(`  -> Setting price for ${matchedName}: +${price}`);
                      await odoo.rpc("product.template.attribute.value", "write", [[tv.id], { price_extra: price }]);
                  }
              }
          }
      }
  }
  
  console.log("Done!");
}

main();

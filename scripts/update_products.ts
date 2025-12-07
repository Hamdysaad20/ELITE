
import { createOdooClient } from "../src/server/utils/odooClient";
import * as dotenv from "dotenv";

dotenv.config();

const MILK_ATTRIBUTE_ID = 27;
const CATEGORY_MAPPING: Record<string, number> = {
  "Espresso": 13, // Hot Drinks / Coffee
  "Americano": 13,
  "Latte": 13,
  "Cappuccino": 13,
  "Macchiato": 13,
  "Cortado": 13,
  "Flat White": 13,
  "Mocha": 13,
  "Coffee": 13,
  "V60": 13,
  "Chemex": 13,
  "Aeropress": 13,
  "Syphon": 13,
  "French Press": 13,
  
  "Tea": 14, // Hot Drinks / Tea
  "Matcha": 14,
  "Chai": 14,
  "Herbal": 14,
  
  "Iced": 18, // Iced Drinks
  "Cold Brew": 18,
  "Affogato": 18,
  
  "Frappe": 19, // Specialty Drinks / Frappe
  "Milkshake": 20, // Specialty Drinks / Milkshakes
  "Smoothie": 21, // Specialty Drinks / Smoothies
  
  "Cake": 26, // Food
  "Croissant": 26,
  "Sandwich": 26,
  "Toast": 26,
  "Cookie": 26,
  "Muffin": 26,
  "Brownie": 26,
  "Bagel": 26,
  "Bun": 26,
  "Danish": 26,
  "Molten": 26,
  "Pancake": 26,
  "Waffle": 26,
  "Salad": 26,
  "Soup": 26,
  "Breakfast": 26,
  
  "Water": 23, // Goods
  "Soda": 23,
  "Juice": 23,
  "Red Bull": 23,
  "Cola": 23,
  "Sprite": 23,
  
  "Syrup": 15, // Toppings (or Extras)
  "Sauce": 16, // Sauces
  
  "Boba": 18, // Iced Drinks
  "Bubble": 18,
};

const MILK_KEYWORDS = [
  "Latte", "Cappuccino", "Macchiato", "Cortado", "Flat White", "Mocha", 
  "Frappe", "Milkshake", "Smoothie", "Chocolate", "Piccolo", "Boba", "Bubble"
];

const ESPRESSO_SHOT_ATTRIBUTE_ID = 12; // "coffee" attribute from explore_odoo output (id: 12, name: "coffee", values: no, shot, double shot)
const ESPRESSO_SHOT_KEYWORDS = ["Frappe"];

async function main() {
  const odoo = createOdooClient();
  if (!odoo) {
    console.error("Odoo not configured");
    process.exit(1);
  }

  console.log("Connecting to Odoo...");

  try {
    // 1. Setup Milk Options
    console.log("Setting up Milk Options...");
    const milkValues = await odoo.searchRead("product.attribute.value", [["attribute_id", "=", MILK_ATTRIBUTE_ID]], ["id", "name"]);
    
    let wholeMilkId = milkValues.find((v: any) => v.name.toLowerCase().includes("whole"))?.id;
    let oatMilkId = milkValues.find((v: any) => v.name.toLowerCase().includes("oat"))?.id;

    if (!wholeMilkId) {
      console.log("Creating 'Whole Milk' value...");
      wholeMilkId = await odoo.rpc("product.attribute.value", "create", [{
        name: "Whole Milk",
        attribute_id: MILK_ATTRIBUTE_ID,
        sequence: 1
      }]);
    }

    if (!oatMilkId) {
      console.log("Creating 'Oat Milk' value...");
      oatMilkId = await odoo.rpc("product.attribute.value", "create", [{
        name: "Oat Milk",
        attribute_id: MILK_ATTRIBUTE_ID,
        sequence: 2
      }]);
    }

    console.log(`Milk IDs: Whole=${wholeMilkId}, Oat=${oatMilkId}`);
    const targetMilkValueIds = [wholeMilkId, oatMilkId];

    // 1.1 Setup Espresso Shot Options
    console.log("Setting up Espresso Shot Options...");
    const shotValues = await odoo.searchRead("product.attribute.value", [["attribute_id", "=", ESPRESSO_SHOT_ATTRIBUTE_ID]], ["id", "name"]);
    
    // We expect "shot" and "double shot" (or similar) to exist based on explore_odoo output
    // id: 20 name: "shot", id: 21 name: "double shot", id: 19 name: "no"
    // Let's ensure we have Single and Double.
    
    let singleShotId = shotValues.find((v: any) => v.name.toLowerCase() === "shot" || v.name.toLowerCase() === "single shot")?.id;
    let doubleShotId = shotValues.find((v: any) => v.name.toLowerCase().includes("double"))?.id;
    let noShotId = shotValues.find((v: any) => v.name.toLowerCase() === "no" || v.name.toLowerCase() === "no shot")?.id;

    if (!singleShotId) {
       console.log("Creating 'Single Shot' value...");
       singleShotId = await odoo.rpc("product.attribute.value", "create", [{
         name: "Single Shot",
         attribute_id: ESPRESSO_SHOT_ATTRIBUTE_ID,
         sequence: 1
       }]);
    }
    
    if (!doubleShotId) {
       console.log("Creating 'Double Shot' value...");
       doubleShotId = await odoo.rpc("product.attribute.value", "create", [{
         name: "Double Shot",
         attribute_id: ESPRESSO_SHOT_ATTRIBUTE_ID,
         sequence: 2
       }]);
    }

    if (!noShotId) {
       console.log("Creating 'No Shot' value...");
       noShotId = await odoo.rpc("product.attribute.value", "create", [{
         name: "No Shot",
         attribute_id: ESPRESSO_SHOT_ATTRIBUTE_ID,
         sequence: 0
       }]);
    }
    
    const targetShotValueIds = [noShotId, singleShotId, doubleShotId].filter(Boolean);
    console.log(`Shot IDs: No=${noShotId}, Single=${singleShotId}, Double=${doubleShotId}`);

    // 2. Fetch Products
    console.log("Fetching products...");
    // We need product.template to update categories and attributes
    // But we can search product.product to find them easily or just search product.template directly
    const products = await odoo.searchRead("product.template", [["active", "=", true]], ["id", "name", "categ_id", "attribute_line_ids", "description_sale"]);
    
    console.log(`Found ${products.length} products.`);

    for (const product of products) {
      const updates: any = {};
      
      // A. Categorization
      let newCategoryId = product.categ_id[0]; // Default to current
      
      // Find matching category based on name keywords
      for (const [keyword, catId] of Object.entries(CATEGORY_MAPPING)) {
        // Use word boundary for short keywords to avoid false positives (e.g. "Tea" in "Steak")
        const isShort = keyword.length <= 4;
        const regex = new RegExp(isShort ? `\\b${keyword}\\b` : keyword, 'i');
        
        if (regex.test(product.name)) {
          newCategoryId = catId;
        }
      }
      
      // Special case: "Iced" overrides "Coffee"
      if (product.name.toLowerCase().includes("iced") || product.name.toLowerCase().includes("cold brew")) {
        newCategoryId = 18; // Iced Drinks
      }

      if (newCategoryId !== product.categ_id[0]) {
        updates.categ_id = newCategoryId;
        console.log(`[${product.name}] Updating Category: ${product.categ_id[1]} -> ${newCategoryId}`);
      }

      // B. Description
      if (!product.description_sale) {
        updates.description_sale = `Enjoy our premium ${product.name}, crafted with quality ingredients for the perfect taste.`;
        console.log(`[${product.name}] Adding Description`);
      }

      // C. Milk Options
      const needsMilk = MILK_KEYWORDS.some(k => product.name.toLowerCase().includes(k.toLowerCase()));
      
      if (needsMilk) {
        // Check existing attribute lines
        // We need to fetch the attribute lines to see which attributes are there
        // product.attribute_line_ids is just a list of IDs.
        // We can't easily check "if it has milk" without fetching the lines.
        // But we can try to write to it.
        
        // To properly update attributes, we need to inspect `product.template.attribute.line`.
        // This is expensive to do for every product in a loop.
        // Optimization: Fetch all attribute lines for these products in one go?
        // Or just do it per product for now, assuming < 300 products it's fine.
        
        const attributeLines = await odoo.searchRead("product.template.attribute.line", [["product_tmpl_id", "=", product.id]], ["attribute_id", "value_ids"]);
        
        const milkLine = attributeLines.find((l: any) => l.attribute_id[0] === MILK_ATTRIBUTE_ID);
        
        if (milkLine) {
          // Update existing milk line if values differ
          const currentValues = milkLine.value_ids;
          const needsUpdate = currentValues.length !== targetMilkValueIds.length || !targetMilkValueIds.every(id => currentValues.includes(id));
          
          if (needsUpdate) {
             console.log(`[${product.name}] Updating Milk Options...`);
             await odoo.rpc("product.template.attribute.line", "write", [[milkLine.id], { value_ids: [[6, 0, targetMilkValueIds]] }]);
          }
        } else {
          // Add new milk line
          console.log(`[${product.name}] Adding Milk Options...`);
          // We need to create a new line linked to this product
          // Writing to product.template 'attribute_line_ids' is one way, or creating the line directly.
          // Creating line directly is safer.
          await odoo.rpc("product.template.attribute.line", "create", [{
            product_tmpl_id: product.id,
            attribute_id: MILK_ATTRIBUTE_ID,
            value_ids: [[6, 0, targetMilkValueIds]]
          }]);
        }
      }

      // D. Espresso Shot Options
      const needsShot = ESPRESSO_SHOT_KEYWORDS.some(k => product.name.toLowerCase().includes(k.toLowerCase()));
      
      if (needsShot) {
         const attributeLines = await odoo.searchRead("product.template.attribute.line", [["product_tmpl_id", "=", product.id]], ["attribute_id", "value_ids"]);
         const shotLine = attributeLines.find((l: any) => l.attribute_id[0] === ESPRESSO_SHOT_ATTRIBUTE_ID);
         
         if (shotLine) {
            const currentValues = shotLine.value_ids;
            const needsUpdate = currentValues.length !== targetShotValueIds.length || !targetShotValueIds.every(id => currentValues.includes(id));
            if (needsUpdate) {
               console.log(`[${product.name}] Updating Shot Options...`);
               await odoo.rpc("product.template.attribute.line", "write", [[shotLine.id], { value_ids: [[6, 0, targetShotValueIds]] }]);
            }
         } else {
            console.log(`[${product.name}] Adding Shot Options...`);
            await odoo.rpc("product.template.attribute.line", "create", [{
               product_tmpl_id: product.id,
               attribute_id: ESPRESSO_SHOT_ATTRIBUTE_ID,
               value_ids: [[6, 0, targetShotValueIds]]
            }]);
         }
      }

      // Apply updates to product.template
      if (Object.keys(updates).length > 0) {
        await odoo.rpc("product.template", "write", [[product.id], updates]);
      }
    }

    console.log("Done!");

  } catch (error) {
    console.error("Error:", error);
  }
}

main();

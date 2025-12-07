import { createOdooClient, OdooClient } from "../src/server/utils/odooClient";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Phase 2.1: Fix product attributes - remove wrong attributes from products
 */

interface OdooClientWithRpc extends OdooClient {
  rpc<T = any>(model: string, method: string, args?: any[], kwargs?: Record<string, unknown>): Promise<T>;
}

// Attribute names to remove from specific products
const FIXES: Array<{
  productPattern: string;
  removeAttrs: string[];
  keepAttrs?: string[];
}> = [
  // Turkish Coffee - only needs size, sugar, cup
  {
    productPattern: "turkish coffee",
    removeAttrs: ["milk", "espresso shots", "foam", "flavor"],
  },
  // Morning Bird Turkish offers
  {
    productPattern: "morning bird offer \"turkish",
    removeAttrs: ["milk", "espresso shots", "foam", "flavor"],
  },
  // Smoothies - no milk
  {
    productPattern: "smoothie",
    removeAttrs: ["milk"],
  },
  // Water - no attributes
  {
    productPattern: "water",
    removeAttrs: ["size", "milk", "espresso shots", "foam", "flavor", "sugar level", "ice level", "temperature"],
  },
  // Cup - POS item, no attributes
  {
    productPattern: "cup",
    removeAttrs: ["size", "milk", "espresso shots", "foam", "flavor", "sugar level", "ice level", "temperature"],
  },
  // Iced Lemon - fruit drink, no coffee attrs
  {
    productPattern: "iced lemon",
    removeAttrs: ["milk", "espresso shots", "flavor"],
  },
  // Golden Peach Sunrise - fruit drink
  {
    productPattern: "golden peach",
    removeAttrs: ["milk", "espresso shots", "flavor"],
  },
  // Raspberry & Pineapple - fruit drink  
  {
    productPattern: "raspberry & pineapple",
    removeAttrs: ["milk", "espresso shots", "flavor"],
  },
  // ice Flavours - unclear product but likely not coffee
  {
    productPattern: "ice flavours",
    removeAttrs: ["milk", "espresso shots"],
  },
  // Boba drinks - no espresso (except Spanish latte boba)
  {
    productPattern: "boba chocolate",
    removeAttrs: ["espresso shots"],
  },
  {
    productPattern: "brown sugar boba",
    removeAttrs: ["espresso shots"],
  },
  {
    productPattern: "taro",
    removeAttrs: ["espresso shots"],
  },
  {
    productPattern: "black cat",
    removeAttrs: ["espresso shots"],
  },
  // Iced Chai Latte - tea, not coffee
  {
    productPattern: "iced chai",
    removeAttrs: ["espresso shots"],
  },
  // Iced Chocolate - chocolate, not coffee
  {
    productPattern: "iced chocolate",
    removeAttrs: ["espresso shots"],
  },
  {
    productPattern: "icee chocolate",
    removeAttrs: ["espresso shots"],
  },
  // Bestie Offer Boba Chocolate
  {
    productPattern: "bestie offer",
    removeAttrs: ["espresso shots"],
  },
];

async function main() {
  const odoo = createOdooClient() as OdooClientWithRpc | null;
  if (!odoo) {
    console.error("Odoo not configured");
    process.exit(1);
  }

  console.log("🔧 Phase 2.1: Fixing product attributes...\n");

  // Get all attributes
  const attributes = await odoo.searchRead("product.attribute", [], ["id", "name"]);
  const attrByName: Record<string, number> = {};
  for (const a of attributes) {
    attrByName[a.name.toLowerCase()] = a.id;
  }

  // Get all products
  const products = await odoo.searchRead(
    "product.template",
    [["active", "=", true], ["sale_ok", "=", true]],
    ["id", "name"]
  );

  let totalFixed = 0;

  for (const fix of FIXES) {
    // Find matching products
    const matchingProducts = products.filter(p => 
      p.name.toLowerCase().includes(fix.productPattern.toLowerCase())
    );

    if (matchingProducts.length === 0) {
      console.log(`⚠️ No products matching "${fix.productPattern}"`);
      continue;
    }

    for (const product of matchingProducts) {
      console.log(`\n📦 ${product.name}`);

      // Get attribute lines for this product
      const attrLines = await odoo.searchRead(
        "product.template.attribute.line",
        [["product_tmpl_id", "=", product.id]],
        ["id", "attribute_id"]
      );

      // Find lines to remove
      const linesToRemove: number[] = [];
      for (const line of attrLines) {
        const attrName = line.attribute_id[1].toLowerCase();
        if (fix.removeAttrs.some(r => attrName.includes(r.toLowerCase()))) {
          linesToRemove.push(line.id);
          console.log(`   ❌ Removing: ${line.attribute_id[1]}`);
        }
      }

      if (linesToRemove.length > 0) {
        try {
          await odoo.rpc("product.template.attribute.line", "unlink", [linesToRemove]);
          console.log(`   ✅ Removed ${linesToRemove.length} attributes`);
          totalFixed++;
        } catch (err: any) {
          console.error(`   ⚠️ Error: ${err.message}`);
        }
      } else {
        console.log(`   ✓ No changes needed`);
      }
    }
  }

  console.log(`\n✅ Fixed ${totalFixed} products`);
}

main().catch(console.error);

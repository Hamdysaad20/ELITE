import { createOdooClient } from "../src/server/utils/odooClient";
import dotenv from "dotenv";

dotenv.config();

const ATTRIBUTES = {
  MILK: 27,
  FLAVOR: 14,
  ESPRESSO_SHOTS: 12,
  FOAM: 35,
  WHIPPED_CREAM: 33,
  DRIZZLE: 34,
  MARSHMALLOW: 30,
  BOBA_TOPPINGS: 36
};

// Guardrail rules from the optimization doc
const GUARDRAILS = [
  // Americano: No extra shots, No Milk default, No Flavor only
  {
    productNames: ["Americano"],
    rules: {
      [ATTRIBUTES.ESPRESSO_SHOTS]: ["No Shot", "Single Shot", "Double Shot"], // Max Double
      [ATTRIBUTES.MILK]: ["No Milk"], // Lock to No Milk only
      [ATTRIBUTES.FLAVOR]: ["No Flavor"], // Lock to No Flavor only
    }
  },
  
  // Spanish Latte: No extra shots, Whole Milk only, No Flavor only
  {
    productNames: ["Spanish Latte (Hot)", "Spanish Latte (Iced)"],
    rules: {
      [ATTRIBUTES.ESPRESSO_SHOTS]: ["Single Shot", "Double Shot"], // No extra shots
      [ATTRIBUTES.MILK]: ["Whole Milk"], // Lock to Whole Milk
      [ATTRIBUTES.FLAVOR]: ["No Flavor"], // Already sweet from condensed milk
    }
  },
  
  // Hot Chocolate: No shots, Whole Milk default, Chocolate flavor, Marshmallow allowed
  {
    productNames: ["Chocolate (Hot)", "Hot Chocolate"],
    rules: {
      [ATTRIBUTES.ESPRESSO_SHOTS]: [], // Remove shots entirely
      [ATTRIBUTES.MILK]: ["Whole Milk", "Oat Milk", "Almond Milk", "Coconut Milk"],
      [ATTRIBUTES.FLAVOR]: ["Chocolate"], // Lock to Chocolate
      [ATTRIBUTES.MARSHMALLOW]: ["No Marshmallow", "Marshmallow"], // Allow marshmallow
    }
  },
  
  // Mocha: 1 shot + 1 extra max, chocolate flavor locked
  {
    productNames: ["Mocha", "Iced Mocha", "Mocha Frappé"],
    rules: {
      [ATTRIBUTES.ESPRESSO_SHOTS]: ["Single Shot", "Double Shot"], // 1 + 1 extra max
      [ATTRIBUTES.FLAVOR]: ["Chocolate"], // Lock to Chocolate
      [ATTRIBUTES.MARSHMALLOW]: ["No Marshmallow", "Marshmallow"], // Allow marshmallow
    }
  },
  
  // Frappe: Specific flavor per product, whip required, drizzle required
  {
    productNames: ["Caramel Frappé"],
    rules: {
      [ATTRIBUTES.FLAVOR]: ["Caramel"], // Lock to Caramel
      [ATTRIBUTES.WHIPPED_CREAM]: ["Regular Whip"], // Required
      [ATTRIBUTES.DRIZZLE]: ["Caramel Drizzle"], // Required
    }
  },
  
  // Brown Sugar Boba: No shots, specific flavor
  {
    productNames: ["Brown Sugar BOBA/Bubble [Classic]"],
    rules: {
      [ATTRIBUTES.ESPRESSO_SHOTS]: [], // Remove shots
      [ATTRIBUTES.FLAVOR]: [], // Remove flavor (has built-in brown sugar)
    }
  },
  
  // Taro Boba: No shots, taro flavor if available
  {
    productNames: ["[Taro] Boba/Bubble"],
    rules: {
      [ATTRIBUTES.ESPRESSO_SHOTS]: [], // Remove shots
      [ATTRIBUTES.FLAVOR]: [], // Remove flavor (has built-in taro)
    }
  },
  
  // Turkish Coffee: Already fixed, but ensure no milk/flavor/shots
  {
    productNames: ["Turkish Coffee Single", "Turkish Coffee Double"],
    rules: {
      [ATTRIBUTES.MILK]: [], // Remove milk
      [ATTRIBUTES.FLAVOR]: [], // Remove flavor
      [ATTRIBUTES.ESPRESSO_SHOTS]: [], // Remove shots
      [ATTRIBUTES.FOAM]: [], // Remove foam
    }
  }
];

async function applyGuardrails() {
  const odoo = createOdooClient();
  if (!odoo) {
    console.error("Odoo not configured");
    process.exit(1);
  }

  console.log("🛡️ Applying Product Guardrails...\n");

  // Helper to get attribute value IDs by names
  const getValueIds = async (attrId: number, valueNames: string[]) => {
    if (valueNames.length === 0) return [];
    
    const values = await (odoo as any).searchRead(
      'product.attribute.value',
      [['attribute_id', '=', attrId], ['name', 'in', valueNames]],
      ['id', 'name']
    );
    
    return values.map((v: any) => v.id);
  };

  for (const guardrail of GUARDRAILS) {
    console.log(`📋 Processing guardrail for: ${guardrail.productNames.join(', ')}`);
    
    for (const productName of guardrail.productNames) {
      const products = await (odoo as any).searchRead(
        'product.template',
        [['name', '=', productName]],
        ['id', 'name']
      );
      
      if (products.length === 0) {
        console.log(`   ⚠️ Product "${productName}" not found`);
        continue;
      }
      
      const product = products[0];
      console.log(`   🎯 Applying to "${product.name}"`);
      
      // Process each attribute rule
      for (const [attrId, allowedValues] of Object.entries(guardrail.rules)) {
        const attributeId = parseInt(attrId);
        const valueNames = allowedValues as string[];
        
        // Get current attribute line
        const lines = await (odoo as any).searchRead(
          'product.template.attribute.line',
          [['product_tmpl_id', '=', product.id], ['attribute_id', '=', attributeId]],
          ['id', 'value_ids']
        );
        
        if (valueNames.length === 0) {
          // Remove attribute entirely
          if (lines.length > 0) {
            await (odoo as any).rpc('product.template.attribute.line', 'unlink', [lines.map((l: any) => l.id)]);
            console.log(`      🗑️ Removed attribute ${attributeId}`);
          }
        } else {
          // Set specific allowed values
          const allowedValueIds = await getValueIds(attributeId, valueNames);
          
          if (allowedValueIds.length === 0) {
            console.log(`      ⚠️ No values found for attribute ${attributeId} with names: ${valueNames.join(', ')}`);
            continue;
          }
          
          if (lines.length > 0) {
            // Update existing line
            await (odoo as any).rpc('product.template.attribute.line', 'write', [
              [lines[0].id],
              { value_ids: [[6, 0, allowedValueIds]] }
            ]);
            console.log(`      ✏️ Updated attribute ${attributeId} to: ${valueNames.join(', ')}`);
          } else {
            // Create new line
            await (odoo as any).rpc('product.template.attribute.line', 'create', [{
              product_tmpl_id: product.id,
              attribute_id: attributeId,
              value_ids: [[6, 0, allowedValueIds]]
            }]);
            console.log(`      ➕ Added attribute ${attributeId} with: ${valueNames.join(', ')}`);
          }
        }
      }
    }
  }

  console.log("\n✨ Guardrails applied successfully.");
}

applyGuardrails().catch((err) => {
  console.error(err);
  process.exit(1);
});
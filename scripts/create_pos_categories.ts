import { createOdooClient } from "../src/server/utils/odooClient";
import dotenv from "dotenv";

dotenv.config();

// POS Category mapping strategy
const POS_CATEGORY_MAPPING = [
  {
    posName: "ELITE SPECIAL",
    posDescription: "Morning Bird & Bestie offers",
    odooCategories: [25], // Services - will include offer products
    priority: 1
  },
  {
    posName: "Elite Essentials",
    posDescription: "Core coffee & tea essentials", 
    odooCategories: [13, 14], // Coffee + Tea (basic items only)
    priority: 2,
    filter: (productName: string) => {
      // Only basic coffee/tea items, no flavored variants
      const basic = ['Americano', 'Espresso', 'Latte', 'Cappuccino', 'Turkish Coffee', 'Classic Teas', 'Karak Chai', 'Chai Latte'];
      return basic.some(b => productName.includes(b));
    }
  },
  {
    posName: "Hot Drinks / Coffee",
    posDescription: "Hot coffee specialties",
    odooCategories: [13], // Coffee
    priority: 3,
    filter: (productName: string) => {
      // Exclude iced variants and offers
      return !productName.toLowerCase().includes('iced') && !productName.includes('Offer');
    }
  },
  {
    posName: "Hot Drinks / Tea",
    posDescription: "Hot tea & chai selection",
    odooCategories: [14], // Tea
    priority: 4
  },
  {
    posName: "Iced Drinks",
    posDescription: "Refreshing cold drinks",
    odooCategories: [18, 27], // Iced + Boba
    priority: 5
  },
  {
    posName: "Soda & Refreshers", 
    posDescription: "Sodas and refreshing drinks",
    odooCategories: [23], // Refreshers
    priority: 6
  },
  {
    posName: "Specialty Drinks / Frappe",
    posDescription: "Frappes and blended drinks",
    odooCategories: [19], // Frappe
    priority: 7
  },
  {
    posName: "Specialty Drinks / Milkshake",
    posDescription: "Thick milkshakes and smoothies",
    odooCategories: [20, 21], // Milkshake + Smoothie
    priority: 8
  },
  {
    posName: "Food",
    posDescription: "Cakes and food items",
    odooCategories: [26], // Food
    priority: 9
  }
];

async function createPOSCategories() {
  const odoo = createOdooClient();
  if (!odoo) {
    console.error("Odoo not configured");
    process.exit(1);
  }

  console.log("🏗️ Creating POS-friendly categories...\n");

  // Get all current products by category
  const products = await (odoo as any).searchRead(
    'product.template',
    [['active', '=', true]],
    ['id', 'name', 'categ_id']
  );

  for (const posCategory of POS_CATEGORY_MAPPING) {
    console.log(`📋 Creating "${posCategory.posName}"...`);
    
    // Check if category exists
    const existing = await (odoo as any).searchRead(
      'product.category',
      [['name', '=', posCategory.posName]],
      ['id', 'name']
    );

    let posCategoryId: number;
    if (existing.length > 0) {
      posCategoryId = existing[0].id;
      console.log(`   ✅ Category exists (ID: ${posCategoryId})`);
    } else {
      posCategoryId = await (odoo as any).rpc('product.category', 'create', [{
        name: posCategory.posName,
        // Set parent_id to create hierarchy if needed
      }]);
      console.log(`   ➕ Created category (ID: ${posCategoryId})`);
    }

    // Find products to move to this POS category
    const targetProducts = products.filter((p: any) => {
      const categoryId = Array.isArray(p.categ_id) ? p.categ_id[0] : p.categ_id;
      const inTargetCategories = posCategory.odooCategories.includes(categoryId);
      
      if (!inTargetCategories) return false;
      
      // Apply filter if specified
      if (posCategory.filter) {
        return posCategory.filter(p.name);
      }
      
      return true;
    });

    console.log(`   📦 Moving ${targetProducts.length} products...`);
    
    // Move products to POS category
    for (const product of targetProducts) {
      try {
        await (odoo as any).rpc('product.template', 'write', [[product.id], { categ_id: posCategoryId }]);
        console.log(`      ➜ Moved "${product.name}"`);
      } catch (e) {
        console.log(`      ❌ Failed to move "${product.name}": ${(e as any).message}`);
      }
    }
  }

  console.log("\n✨ POS categories created and populated.");
}

createPOSCategories().catch((err) => {
  console.error(err);
  process.exit(1);
});
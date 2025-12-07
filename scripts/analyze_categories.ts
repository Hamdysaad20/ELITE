import { createOdooClient } from "../src/server/utils/odooClient";
import dotenv from "dotenv";

dotenv.config();

async function analyzeCategories() {
  const odoo = createOdooClient();
  if (!odoo) {
    console.error("Odoo not configured");
    process.exit(1);
  }

  console.log("🔍 Analyzing all categories and their products...\n");

  // Get all categories
  const categories = await (odoo as any).searchRead(
    'product.category',
    [],
    ['id', 'name', 'parent_id']
  );

  console.log("📁 ALL CATEGORIES:");
  categories.forEach((cat: any) => {
    const parent = cat.parent_id ? ` (parent: ${cat.parent_id[1]})` : '';
    console.log(`   ${cat.id}: "${cat.name}"${parent}`);
  });

  console.log("\n📊 PRODUCTS BY CATEGORY:");
  
  // Get product counts per category
  for (const cat of categories) {
    const products = await (odoo as any).searchRead(
      'product.template',
      [['categ_id', '=', cat.id], ['active', '=', true]],
      ['id', 'name']
    );
    
    if (products.length > 0) {
      console.log(`\n🗂️ ${cat.name} (ID: ${cat.id}) - ${products.length} products:`);
      products.slice(0, 5).forEach((p: any) => {
        console.log(`   • ${p.name}`);
      });
      if (products.length > 5) {
        console.log(`   ... and ${products.length - 5} more`);
      }
    }
  }

  console.log("\n🎯 FRONTEND SYNC CHECK:");
  console.log("Expected frontend categories from screenshot:");
  console.log("- ELITE SPECIAL...");
  console.log("- Elite Essentials");
  console.log("- Hot Drinks / Coffee");
  console.log("- Hot Drinks / Tea");
  console.log("- Iced Drinks");
  console.log("- Soda & Refreshers");
  console.log("- Specialty Drinks");
}

analyzeCategories().catch((err) => {
  console.error(err);
  process.exit(1);
});
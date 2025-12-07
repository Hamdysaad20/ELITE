import { createOdooClient } from "../src/server/utils/odooClient";
import dotenv from "dotenv";

dotenv.config();

// Better category mapping with SHORT names (1-2 words max)
const BETTER_CATEGORY_MAPPING = [
  {
    name: "ELITE SPECIAL",
    description: "Special offers and exclusive items",
    products: ["Gift Card", "Top-up eWallet", "Discount", "Discount 30%", "OPEN REGESTER", "Morning Bird", "Bestie Offer"]
  },
  {
    name: "Coffee",
    description: "Hot coffee drinks",
    products: [
      "Americano", "Espresso", "Espresso Double", "Espresso Macchiato", "Cortado", "Flat White", 
      "Cappuccino", "Latte", "Mocha", "Spanish Latte (Hot)", "Turkish Coffee", "French coffee", 
      "hazelnut coffee"
    ]
  },
  {
    name: "Tea",
    description: "Hot tea and chai",
    products: [
      "Classic Teas", "Karak Chai", "Chai Latte (Hot)", "Matcha Latte (Hot)", "Hibiscus"
    ]
  },
  {
    name: "Iced",
    description: "Cold coffee and tea",
    products: [
      "Iced Americano", "Iced Latte", "Iced Cappuccino", "Iced Mocha", "Iced Chai Latte",
      "Iced Chocolate", "Spanish Latte (Iced)", "Matcha Latte (Iced)", "Iced Caramel Macchiato",
      "Strawberry Matcha Latte", "Iced Lemon", "Iced Macchiat"
    ]
  },
  {
    name: "Boba",
    description: "Bubble tea and boba drinks",
    products: [
      "BOBA Chocolate", "BOBA Spanish latte", "Brown Sugar BOBA", "[Taro] Boba", "Black Cat"
    ]
  },
  {
    name: "Frappe", 
    description: "Blended coffee drinks",
    products: [
      "Mocha Frappé", "Coffee Frappé", "Caramel Frappé", "Vanilla Frappé", "Pistachio Frappé"
    ]
  },
  {
    name: "Milkshake",
    description: "Thick milkshakes", 
    products: [
      "Chocolate Milkshake", "Vanilla Milkshake", "Kinder Milkshake", "Oreo Milkshake",
      "Milkshake Lotus", "Pistachio Milkshake", "Strawberry Milkshake", "Milkshake [Mango Passion Fruit]"
    ]
  },
  {
    name: "Smoothie",
    description: "Fruit smoothies",
    products: [
      "Mango Smoothie", "Strawberry Smoothie", "Mixed Berry Smoothie", "Passion Fruit Smoothie",
      "Golden Peach Sunrise", "Raspberry & Pineapple", "Custom Smoothie"
    ]
  },
  {
    name: "Soda",
    description: "Sodas and refreshers",
    products: [
      "Custom Soda", "Classic Lemon Soda", "Escobar Soda Drink", "Passion Fruit Soda",
      "Power Soda +18", "Mojito SODA", "ice Flavours"
    ]
  },
  {
    name: "Hot Drinks",
    description: "Hot chocolate and specialties",
    products: [
      "Chocolate (Hot)", "Icee Chocolate"
    ]
  },
  {
    name: "Food",
    description: "Cakes and snacks",
    products: [
      "Apple pie cake", "COFFEE CAKE", "Cheese Cake", "HUNY CAKE", "brownies", "carrot cake",
      "red velvet cake", "Molten Cake", "Cookie", "Cheese Burger", "Custom sandwich"
    ]
  },
  {
    name: "Extras",
    description: "Add-ons and extras",
    products: [
      "EXTRA BOBA", "EXTRA Flavor", "Extra Honey", "Extra Ice Cream Scoop", "Extra Shot",
      "Extra whip cream", "Coconut Milk", "[EXTRA]Coconut Milk", "Premium topping",
      "Chai Flavours", "extra Marshmello", "Cup", "KINDER STEAK Single", "Water"
    ]
  }
];

function findSuggestedCategory(name: string): string | null {
  const n = name.toLowerCase().trim();

  // 1) ELITE SPECIAL (offers, services)
  if (
    /offer|gift\s*card|top-?up|open\s*reg|deposit|settle|down\s*payment/.test(n)
  ) {
    return "ELITE SPECIAL";
  }

  // 2) Extras & add-ons
  if (
    /extra|premium\s*topping|coconut\s*milk|water|kinder\s*steak|chai\s*flavour|chai\s*flavors|cup/.test(
      n,
    )
  ) {
    return "Extras";
  }

  // 3) Boba
  if (/boba|bubble|black\s*cat/.test(n)) return "Boba";

  // 4) Frappe
  if (/frapp/.test(n)) return "Frappe";

  // 5) Milkshake
  if (/milkshake/.test(n)) return "Milkshake";

  // 6) Smoothie
  if (/smoothie/.test(n)) return "Smoothie";

  // 7) Soda & refreshers
  if (/soda|mojito|ice\s*flavours|ice\s*flavors/.test(n)) return "Soda";

  // 8) Iced drinks (must come before tea/coffee to capture iced variants)
  if (/iced|icee/.test(n)) return "Iced";

  // 9) Hot Drinks (hot chocolate)
  if (/chocolate.*\(hot\)|hot\s*chocolate/.test(n)) return "Hot Drinks";

  // 10) Tea (hot tea/chai/matcha)
  if (/classic\s*teas|karak|chai|hibiscus|matcha/.test(n)) return "Tea";

  // 11) Coffee (default for coffee-based hot drinks)
  if (
    /americano|espresso|cortado|flat\s*white|cappuccino|latte|mocha|turkish|french|hazelnut/.test(
      n,
    )
  ) {
    return "Coffee";
  }

  return null;
}

async function analyzeAndRecategorizeProducts() {
  const odoo = createOdooClient();
  if (!odoo) {
    console.error("Odoo not configured");
    process.exit(1);
  }

  console.log("🔍 Analyzing all products for better categorization...\n");

  // Get all current products
  const allProducts = await (odoo as any).searchRead(
    'product.template',
    [['active', '=', true]],
    ['id', 'name', 'categ_id', 'list_price']
  );

  console.log(`📊 Found ${allProducts.length} total products\n`);

  // Analyze current categorization
  const uncategorized = [];
  const categorized = [];

  for (const product of allProducts) {
    const foundCategory = findSuggestedCategory(product.name);
    
    if (foundCategory) {
      categorized.push({
        id: product.id,
        name: product.name,
        currentCategory: product.categ_id[1],
        suggestedCategory: foundCategory,
        price: product.list_price
      });
    } else {
      uncategorized.push({
        id: product.id,
        name: product.name,
        currentCategory: product.categ_id[1], 
        price: product.list_price
      });
    }
  }

  console.log("✅ PRODUCTS THAT CAN BE CATEGORIZED:");
  BETTER_CATEGORY_MAPPING.forEach(category => {
    const products = categorized.filter(p => p.suggestedCategory === category.name);
    if (products.length > 0) {
      console.log(`\n📁 ${category.name} (${products.length} products):`);
      products.forEach(p => {
        console.log(`   • ${p.name} (${p.currentCategory} → ${p.suggestedCategory})`);
      });
    }
  });

  console.log("\n❓ UNCATEGORIZED PRODUCTS THAT NEED REVIEW:");
  uncategorized.forEach(p => {
    console.log(`   ⚠️ ${p.name} (currently: ${p.currentCategory})`);
  });

  console.log(`\n📈 SUMMARY:`);
  console.log(`   ✅ Categorized: ${categorized.length}/${allProducts.length}`);
  console.log(`   ❓ Need review: ${uncategorized.length}/${allProducts.length}`);
  
  return { categorized, uncategorized, allProducts };
}

async function createAndApplyCategories() {
  const analysis = await analyzeAndRecategorizeProducts();
  
  const odoo = createOdooClient();
  if (!odoo) {
    console.error("Odoo not configured");
    process.exit(1);
  }

  console.log("\n🏗️ Creating and applying new categories...\n");

  // Create categories
  for (const categoryDef of BETTER_CATEGORY_MAPPING) {
    console.log(`📂 Creating category: ${categoryDef.name}`);
    
    // Check if category exists
    const existing = await (odoo as any).searchRead(
      'product.category',
      [['name', '=', categoryDef.name]],
      ['id', 'name']
    );

    let categoryId: number;
    if (existing.length > 0) {
      categoryId = existing[0].id;
      console.log(`   ℹ️ Category already exists with ID: ${categoryId}`);
    } else {
      // Create new category
      categoryId = await (odoo as any).rpc('product.category', 'create', [{
        name: categoryDef.name,
        parent_id: false // Top level categories
      }]);
      console.log(`   ✅ Created new category with ID: ${categoryId}`);
    }

    // Update products in this category
    const productsToUpdate = analysis.categorized.filter(p => p.suggestedCategory === categoryDef.name);
    
    if (productsToUpdate.length > 0) {
      console.log(`   🔄 Updating ${productsToUpdate.length} products...`);
      
      for (const product of productsToUpdate) {
        await (odoo as any).rpc('product.template', 'write', [[product.id], {
          categ_id: categoryId
        }]);
        console.log(`      • Updated: ${product.name}`);
      }
    }
  }

  console.log("\n🎉 Categorization complete!");
  console.log("\nNext steps:");
  console.log("1. Review uncategorized products and manually assign them");
  console.log("2. Add product attributes/settings for customization");
  console.log("3. Test POS interface to ensure categories display correctly");
}

// Run the script
if (require.main === module) {
  createAndApplyCategories().catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  });
}
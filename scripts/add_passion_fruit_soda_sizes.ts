import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient.js';

async function addSizeVariants() {
  console.log("🔐 Setting up Odoo connection...");
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  config.timeoutMs = 180000;
  const odoo = new OdooClient(config);
  console.log("✅ Odoo client ready\n");

  try {
    // Find the Passion Fruit Soda product
    console.log("🔍 Searching for Passion Fruit Soda...");
    const products = await odoo.searchRead("product.template",
      [["name", "=", "Passion Fruit Soda"]],
      ["id", "name", "list_price", "attribute_line_ids"]
    ) as Array<{
      id: number;
      name: string;
      list_price: number;
      attribute_line_ids: number[];
    }>;

    if (products.length === 0) {
      console.error("❌ Passion Fruit Soda product not found!");
      return;
    }

    const product = products[0];
    console.log(`✅ Found product: ${product.name} (ID: ${product.id})`);
    console.log(`   Current price: ${product.list_price} EGP\n`);

    // Find or create Size attribute
    console.log("🔍 Finding Size attribute...");
    let sizeAttributes = await odoo.searchRead("product.attribute",
      [["name", "=", "Size"]],
      ["id", "name", "value_ids"]
    ) as Array<{ id: number; name: string; value_ids: number[] }>;

    let sizeAttributeId: number;
    let smallValueId: number;
    let mediumValueId: number;
    let largeValueId: number;

    if (sizeAttributes.length === 0) {
      console.log("📝 Creating Size attribute...");
      sizeAttributeId = await odoo.rpc("product.attribute", "create", [{
        name: "Size",
        sequence: 1,
      }]) as number;
      console.log(`✅ Created Size attribute (ID: ${sizeAttributeId})\n`);
    } else {
      sizeAttributeId = sizeAttributes[0].id;
      console.log(`✅ Found Size attribute (ID: ${sizeAttributeId})\n`);
    }

    // Find or create Size values (Small, Medium, Large)
    console.log("🔍 Finding Size attribute values...");
    const sizeValues = await odoo.searchRead("product.attribute.value",
      [["attribute_id", "=", sizeAttributeId]],
      ["id", "name"]
    ) as Array<{ id: number; name: string }>;

    const valueMap = new Map(sizeValues.map((v) => [v.name, v.id]));

    if (!valueMap.has("Small")) {
      console.log("📝 Creating 'Small' value...");
      smallValueId = await odoo.rpc("product.attribute.value", "create", [{
        name: "Small",
        attribute_id: sizeAttributeId,
        sequence: 1,
      }]) as number;
      console.log(`✅ Created Small (ID: ${smallValueId})`);
    } else {
      smallValueId = valueMap.get("Small")!;
      console.log(`✅ Found Small (ID: ${smallValueId})`);
    }

    if (!valueMap.has("Medium")) {
      console.log("📝 Creating 'Medium' value...");
      mediumValueId = await odoo.rpc("product.attribute.value", "create", [{
        name: "Medium",
        attribute_id: sizeAttributeId,
        sequence: 2,
      }]) as number;
      console.log(`✅ Created Medium (ID: ${mediumValueId})`);
    } else {
      mediumValueId = valueMap.get("Medium")!;
      console.log(`✅ Found Medium (ID: ${mediumValueId})`);
    }

    if (!valueMap.has("Large")) {
      console.log("📝 Creating 'Large' value...");
      largeValueId = await odoo.rpc("product.attribute.value", "create", [{
        name: "Large",
        attribute_id: sizeAttributeId,
        sequence: 3,
      }]) as number;
      console.log(`✅ Created Large (ID: ${largeValueId})`);
    } else {
      largeValueId = valueMap.get("Large")!;
      console.log(`✅ Found Large (ID: ${largeValueId})`);
    }

    console.log("");

    // Check if product already has Size attribute
    if (product.attribute_line_ids && product.attribute_line_ids.length > 0) {
      const existingLines = await odoo.searchRead(
        "product.template.attribute.line",
        [["id", "in", product.attribute_line_ids]],
        ["id", "attribute_id", "value_ids"]
      ) as Array<{
        id: number;
        attribute_id: [number, string];
        value_ids: number[];
      }>;

      const sizeLine = existingLines.find(
        (line) => line.attribute_id[0] === sizeAttributeId
      );
      if (sizeLine) {
        console.log("⚠️  Size attribute already exists for this product");
        console.log(`   Updating values...`);
        await odoo.rpc("product.template.attribute.line", "write", [[sizeLine.id], {
          value_ids: [[6, 0, [smallValueId, mediumValueId, largeValueId]]],
        }]);
        console.log("✅ Updated Size attribute values\n");
      } else {
        // Add new attribute line
        console.log("📝 Adding Size attribute to product...");
        await odoo.rpc("product.template.attribute.line", "create", [{
          product_tmpl_id: product.id,
          attribute_id: sizeAttributeId,
          value_ids: [[6, 0, [smallValueId, mediumValueId, largeValueId]]],
        }]);
        console.log("✅ Added Size attribute\n");
      }
    } else {
      // No attributes yet, create first one
      console.log("📝 Adding Size attribute to product (first attribute)...");
      await odoo.rpc("product.template.attribute.line", "create", [{
        product_tmpl_id: product.id,
        attribute_id: sizeAttributeId,
        value_ids: [[6, 0, [smallValueId, mediumValueId, largeValueId]]],
      }]);
      console.log("✅ Added Size attribute\n");
    }

    // Now set the price extras for Medium (+10) and Large (+20)
    console.log("💰 Setting price extras...");
    
    // Find product template attribute values (PTAVs)
    const ptavs = await odoo.searchRead(
      "product.template.attribute.value",
      [
        ["product_tmpl_id", "=", product.id],
        ["attribute_id", "=", sizeAttributeId],
      ],
      ["id", "name", "product_attribute_value_id", "price_extra"]
    ) as Array<{
      id: number;
      name: string;
      product_attribute_value_id: [number, string];
      price_extra: number;
    }>;

    console.log(`   Found ${ptavs.length} PTAVs:`);
    for (const ptav of ptavs) {
      console.log(`   - PTAV ID ${ptav.id}: ${ptav.name}, value: ${ptav.product_attribute_value_id[1]}, current price_extra: ${ptav.price_extra}`);
    }
    console.log("");

    for (const ptav of ptavs) {
      const valueName = ptav.product_attribute_value_id[1];
      let priceExtra = 0;

      if (valueName.includes("Medium")) {
        priceExtra = 10;
      } else if (valueName.includes("Large")) {
        priceExtra = 20;
      }

      // Always set the price_extra to ensure it's correct
      await odoo.rpc("product.template.attribute.value", "write", [[ptav.id], {
        price_extra: priceExtra,
      }]);
      
      if (priceExtra > 0) {
        console.log(`   ✅ ${valueName}: +${priceExtra} EGP`);
      } else {
        console.log(`   ✅ ${valueName}: Base price (no extra)`);
      }
    }

    console.log("\n✨ Done! Passion Fruit Soda now has size variants:");
    console.log(`   • Small: ${product.list_price} EGP (base)`);
    console.log(`   • Medium: ${product.list_price + 10} EGP (+10)`);
    console.log(`   • Large: ${product.list_price + 20} EGP (+20)`);
  } catch (error) {
    console.error("\n❌ Error:", error);
    throw error;
  }
}

// Run the script
addSizeVariants()
  .then(() => {
    console.log("\n🎉 Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Script failed:", error);
    process.exit(1);
  });

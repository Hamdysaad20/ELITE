import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient.js';
dotenv.config();

async function createEssentialAttributes() {
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  const odoo = new OdooClient(config);

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           CREATING ESSENTIAL ATTRIBUTES                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const attributesConfig = [
    {
      name: 'Milk Options',
      displayType: 'radio',
      createVariant: 'no_variant',
      values: [
        { name: 'Regular Milk', priceExtra: 0 },
        { name: 'Oat Milk', priceExtra: 5 },
        { name: 'Almond Milk', priceExtra: 5 },
        { name: 'Soy Milk', priceExtra: 5 },
        { name: 'Lactose-Free Milk', priceExtra: 5 }
      ]
    },
    {
      name: 'Shots',
      displayType: 'radio',
      createVariant: 'no_variant',
      values: [
        { name: 'Single Shot', priceExtra: 0 },
        { name: 'Double Shot', priceExtra: 10 },
        { name: 'Triple Shot', priceExtra: 20 }
      ]
    },
    {
      name: 'Ice Level',
      displayType: 'radio',
      createVariant: 'no_variant',
      values: [
        { name: 'No Ice', priceExtra: 0 },
        { name: 'Less Ice', priceExtra: 0 },
        { name: 'Regular Ice', priceExtra: 0 },
        { name: 'Extra Ice', priceExtra: 0 }
      ]
    },
    {
      name: 'Sugar Level',
      displayType: 'radio',
      createVariant: 'no_variant',
      values: [
        { name: 'No Sugar', priceExtra: 0 },
        { name: 'Less Sugar', priceExtra: 0 },
        { name: 'Regular', priceExtra: 0 },
        { name: 'Extra Sweet', priceExtra: 0 }
      ]
    },
    {
      name: 'Sweetness',
      displayType: 'radio',
      createVariant: 'no_variant',
      values: [
        { name: 'No Sugar', priceExtra: 0 },
        { name: '25% Sweet', priceExtra: 0 },
        { name: '50% Sweet', priceExtra: 0 },
        { name: '75% Sweet', priceExtra: 0 },
        { name: '100% Sweet', priceExtra: 0 }
      ]
    },
    {
      name: 'Extras',
      displayType: 'multi',
      createVariant: 'no_variant',
      values: [
        { name: 'Whipped Cream', priceExtra: 5 },
        { name: 'Caramel Drizzle', priceExtra: 5 },
        { name: 'Chocolate Sauce', priceExtra: 5 },
        { name: 'Vanilla Syrup', priceExtra: 5 },
        { name: 'Hazelnut Syrup', priceExtra: 5 }
      ]
    },
    {
      name: 'Tea Extras',
      displayType: 'multi',
      createVariant: 'no_variant',
      values: [
        { name: 'Honey', priceExtra: 3 },
        { name: 'Lemon', priceExtra: 3 },
        { name: 'Mint', priceExtra: 3 },
        { name: 'Ginger', priceExtra: 3 }
      ]
    },
    {
      name: 'Toppings',
      displayType: 'multi',
      createVariant: 'no_variant',
      values: [
        { name: 'Whipped Cream', priceExtra: 5 },
        { name: 'BOBA Pearls', priceExtra: 10 },
        { name: 'Chocolate Chips', priceExtra: 5 },
        { name: 'Caramel Drizzle', priceExtra: 5 },
        { name: 'Oreo Crumble', priceExtra: 5 },
        { name: 'Sprinkles', priceExtra: 5 },
        { name: 'Cherry', priceExtra: 3 }
      ]
    },
    {
      name: 'Smoothie Extras',
      displayType: 'multi',
      createVariant: 'no_variant',
      values: [
        { name: 'Chia Seeds', priceExtra: 8 },
        { name: 'Protein Powder', priceExtra: 8 },
        { name: 'Honey', priceExtra: 8 },
        { name: 'Granola', priceExtra: 8 }
      ]
    },
    {
      name: 'Smoothie Base',
      displayType: 'radio',
      createVariant: 'no_variant',
      values: [
        { name: 'Milk Base', priceExtra: 0 },
        { name: 'Yogurt Base', priceExtra: 0 },
        { name: 'Juice Base', priceExtra: 0 }
      ]
    },
    {
      name: 'Food Extras',
      displayType: 'multi',
      createVariant: 'no_variant',
      values: [
        { name: 'Extra Cheese', priceExtra: 10 },
        { name: 'Extra Sauce', priceExtra: 10 },
        { name: 'Extra Vegetables', priceExtra: 10 }
      ]
    },
    {
      name: 'Temperature',
      displayType: 'radio',
      createVariant: 'no_variant',
      values: [
        { name: 'Cold', priceExtra: 0 },
        { name: 'Warm', priceExtra: 0 },
        { name: 'Hot', priceExtra: 0 }
      ]
    },
    {
      name: 'Soda Add-ons',
      displayType: 'multi',
      createVariant: 'no_variant',
      values: [
        { name: 'Lemon Slice', priceExtra: 3 },
        { name: 'Mint', priceExtra: 3 },
        { name: 'Fresh Fruit', priceExtra: 3 }
      ]
    },
    {
      name: 'Thickness',
      displayType: 'radio',
      createVariant: 'no_variant',
      values: [
        { name: 'Regular', priceExtra: 0 },
        { name: 'Extra Thick', priceExtra: 0 }
      ]
    }
  ];

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const attrConfig of attributesConfig) {
    try {
      // Check if attribute exists
      const existing = await odoo.searchRead('product.attribute', [
        ['name', '=', attrConfig.name]
      ], ['id', 'display_type', 'create_variant']);

      let attributeId: number;

      if (existing.length > 0) {
        attributeId = existing[0].id;
        // Update if needed
        if (existing[0].display_type !== attrConfig.displayType || 
            existing[0].create_variant !== attrConfig.createVariant) {
          await odoo.rpc('product.attribute', 'write', [[attributeId], {
            display_type: attrConfig.displayType,
            create_variant: attrConfig.createVariant
          }]);
          console.log(`✅ Updated attribute: ${attrConfig.name} (ID: ${attributeId})`);
          updated++;
        } else {
          console.log(`⏭️  Skipped (exists): ${attrConfig.name} (ID: ${attributeId})`);
          skipped++;
        }
      } else {
        // Create new attribute
        attributeId = await odoo.rpc<number>('product.attribute', 'create', [{
          name: attrConfig.name,
          display_type: attrConfig.displayType,
          create_variant: attrConfig.createVariant
        }]);
        console.log(`✅ Created attribute: ${attrConfig.name} (ID: ${attributeId})`);
        created++;
      }

      // Check and create attribute values
      for (const valueConfig of attrConfig.values) {
        const existingValue = await odoo.searchRead('product.attribute.value', [
          ['attribute_id', '=', attributeId],
          ['name', '=', valueConfig.name]
        ], ['id']);

        if (existingValue.length === 0) {
          await odoo.rpc('product.attribute.value', 'create', [{
            name: valueConfig.name,
            attribute_id: attributeId
          }]);
          console.log(`   ➕ Created value: ${valueConfig.name} (+${valueConfig.priceExtra} EGP)`);
        }
      }

    } catch (error: any) {
      console.error(`❌ Error with ${attrConfig.name}: ${error.message}`);
    }
  }

  console.log('\n═'.repeat(60));
  console.log(`\n📊 Summary:`);
  console.log(`   Created: ${created} attributes`);
  console.log(`   Updated: ${updated} attributes`);
  console.log(`   Skipped: ${skipped} attributes`);
  console.log(`   Total: ${created + updated + skipped} attributes`);
  console.log('\n✅ All essential attributes ready!\n');
}

createEssentialAttributes().catch(console.error);

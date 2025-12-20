
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type ProductDefinition = {
  id: string;
  odooId: number;
  name: string;
  price: number;
  posCategoryName: string;
  attributeValueIds: string[];
};

const consolidatedProducts: ProductDefinition[] = [
  // Definitions from previous attempt...
    {
    id: 'prod_americano',
    odooId: -200,
    name: 'Americano',
    price: 70,
    posCategoryName: 'Hot Coffee',
    attributeValueIds: ['attr_val_temp_hot', 'attr_val_temp_iced', 'attr_val_size_regular', 'attr_val_size_large', 'attr_val_shots_single', 'attr_val_shots_double', 'attr_val_shots_triple'],
  },
  {
    id: 'prod_latte',
    odooId: -201,
    name: 'Latte',
    price: 65,
    posCategoryName: 'Hot Coffee',
    attributeValueIds: ['attr_val_temp_hot', 'attr_val_temp_iced', 'attr_val_size_regular', 'attr_val_size_large', 'attr_val_milk_whole', 'attr_val_milk_skim', 'attr_val_milk_oat', 'attr_val_milk_almond', 'attr_val_syrup_vanilla', 'attr_val_syrup_caramel', 'attr_val_syrup_hazelnut', 'attr_val_syrup_spanish'],
  },
  {
    id: 'prod_cappuccino',
    odooId: -202,
    name: 'Cappuccino',
    price: 70,
    posCategoryName: 'Hot Coffee',
    attributeValueIds: ['attr_val_temp_hot', 'attr_val_temp_iced', 'attr_val_size_regular', 'attr_val_size_large', 'attr_val_milk_whole', 'attr_val_milk_skim', 'attr_val_milk_oat', 'attr_val_milk_almond'],
  },
  {
    id: 'prod_mocha',
    odooId: -203,
    name: 'Mocha',
    price: 80,
    posCategoryName: 'Hot Coffee',
    attributeValueIds: ['attr_val_temp_hot', 'attr_val_temp_iced', 'attr_val_size_regular', 'attr_val_size_large', 'attr_val_milk_whole', 'attr_val_milk_skim', 'attr_val_top_whipped'],
  },
  {
    id: 'prod_macchiato',
    odooId: -204,
    name: 'Macchiato',
    price: 55,
    posCategoryName: 'Hot Coffee',
    attributeValueIds: ['attr_val_temp_hot', 'attr_val_temp_iced', 'attr_val_size_regular', 'attr_val_size_large', 'attr_val_syrup_caramel'],
  },
  {
    id: 'prod_cortado',
    odooId: -205,
    name: 'Cortado',
    price: 65,
    posCategoryName: 'Hot Coffee',
    attributeValueIds: ['attr_val_temp_hot', 'attr_val_size_regular'],
  },
  {
    id: 'prod_flat_white',
    odooId: -206,
    name: 'Flat White',
    price: 70,
    posCategoryName: 'Hot Coffee',
    attributeValueIds: ['attr_val_temp_hot', 'attr_val_size_regular'],
  },
  {
    id: 'prod_turkish_coffee',
    odooId: -207,
    name: 'Turkish Coffee',
    price: 40,
    posCategoryName: 'Hot Coffee',
    attributeValueIds: ['attr_val_size_regular', 'attr_val_size_large', 'attr_val_sweet_none', 'attr_val_sweet_light', 'attr_val_sweet_regular'],
  },
  {
    id: 'prod_chai_latte',
    odooId: -210,
    name: 'Chai Latte',
    price: 60,
    posCategoryName: 'Tea & More',
    attributeValueIds: ['attr_val_temp_hot', 'attr_val_temp_iced', 'attr_val_size_regular', 'attr_val_size_large', 'attr_val_milk_whole', 'attr_val_milk_skim', 'attr_val_milk_oat'],
  },
  {
    id: 'prod_matcha_latte',
    odooId: -211,
    name: 'Matcha Latte',
    price: 85,
    posCategoryName: 'Tea & More',
    attributeValueIds: ['attr_val_temp_hot', 'attr_val_temp_iced', 'attr_val_size_regular', 'attr_val_size_large', 'attr_val_milk_whole', 'attr_val_milk_skim', 'attr_val_milk_oat'],
  },
  {
    id: 'prod_frappe',
    odooId: -220,
    name: 'Frappé',
    price: 90,
    posCategoryName: 'Frappés & Milkshakes',
    attributeValueIds: ['attr_val_size_regular', 'attr_val_size_large', 'attr_val_syrup_mocha', 'attr_val_syrup_coffee', 'attr_val_syrup_caramel', 'attr_val_syrup_vanilla', 'attr_val_syrup_pistachio', 'attr_val_top_whipped'],
  },
  {
    id: 'prod_milkshake',
    odooId: -221,
    name: 'Milkshake',
    price: 80,
    posCategoryName: 'Frappés & Milkshakes',
    attributeValueIds: ['attr_val_size_regular', 'attr_val_size_large', 'attr_val_top_whipped', 'attr_val_top_icecream'],
  },
];

async function main() {
  console.log('Starting robust product consolidation script...');

  // --- 1. Create POS Categories ---
  const categories = ['Hot Coffee', 'Iced Coffee', 'Tea & More', 'Frappés & Milkshakes', 'Smoothies & Sodas', 'Boba', 'Bakery & Cakes', 'Sandwiches & Savory', 'Retail & Miscellaneous'];
  for (const cat of categories) {
    await prisma.posCategory.upsert({
      where: { name: cat },
      update: {},
      create: { id: `pos_cat_${cat.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_')}`, name: cat },
    });
  }
  console.log('Upserted all POS categories.');

  // --- 2. Create or Update Products and link attributes explicitly ---
  for (const productDef of consolidatedProducts) {
    const { id, odooId, name, price, posCategoryName, attributeValueIds } = productDef;

    // Create the product first, without attribute links
    await prisma.product.upsert({
      where: { id },
      update: {
        name,
        price,
        posCategory: { connect: { name: posCategoryName } },
      },
      create: {
        id,
        odooId,
        name,
        price,
        posAvailable: true,
        isArchived: false,
        posCategory: { connect: { name: posCategoryName } },
      },
    });
    console.log(`Upserted product: ${name}`);

    // Now, create the explicit links in the join table
    // First, remove existing links to ensure a clean state
    await prisma.productAttributeValue.deleteMany({
      where: { productId: id },
    });

    // Then, create the new links
    for (const attrId of attributeValueIds) {
      await prisma.productAttributeValue.create({
        data: {
          productId: id,
          attributeValueId: attrId,
        },
      });
    }
    console.log(`Linked ${attributeValueIds.length} attributes to ${name}`);
  }

  console.log('Robust product consolidation script finished.');
}

main()
  .catch((e) => {
    console.error('An error occurred:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

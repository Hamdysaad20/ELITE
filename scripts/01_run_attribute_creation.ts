import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting attribute creation script...');

  // --- Global Attributes ---

  await prisma.attribute.upsert({
    where: { name: 'Size' },
    update: {},
    create: {
      id: 'attr_size',
      name: 'Size',
      odooId: -100,
      displayType: 'radio',
      values: {
        create: [
          { id: 'attr_val_size_regular', name: 'Regular', odooId: -101, priceExtra: 0 },
          { id: 'attr_val_size_large', name: 'Large', odooId: -102, priceExtra: 10 },
        ],
      },
    },
  });
  console.log('Upserted attribute: Size');

  await prisma.attribute.upsert({
    where: { name: 'Temperature' },
    update: {},
    create: {
      id: 'attr_temperature',
      name: 'Temperature',
      odooId: -110,
      displayType: 'radio',
      values: {
        create: [
          { id: 'attr_val_temp_hot', name: 'Hot', odooId: -111, priceExtra: 0 },
          { id: 'attr_val_temp_iced', name: 'Iced', odooId: -112, priceExtra: 0 },
        ],
      },
    },
  });
  console.log('Upserted attribute: Temperature');

  await prisma.attribute.upsert({
    where: { name: 'Milk Options' },
    update: {},
    create: {
      id: 'attr_milk_options',
      name: 'Milk Options',
      odooId: -120,
      displayType: 'radio',
      values: {
        create: [
          { id: 'attr_val_milk_whole', name: 'Whole Milk', odooId: -121, priceExtra: 0 },
          { id: 'attr_val_milk_skim', name: 'Skim Milk', odooId: -122, priceExtra: 0 },
          { id: 'attr_val_milk_oat', name: 'Oat Milk', odooId: -123, priceExtra: 15 },
          { id: 'attr_val_milk_almond', name: 'Almond Milk', odooId: -124, priceExtra: 15 },
          { id: 'attr_val_milk_coconut', name: 'Coconut Milk', odooId: -125, priceExtra: 15 },
        ],
      },
    },
  });
  console.log('Upserted attribute: Milk Options');

  await prisma.attribute.upsert({
    where: { name: 'Espresso Shots' },
    update: {},
    create: {
      id: 'attr_espresso_shots',
      name: 'Espresso Shots',
      odooId: -130,
      displayType: 'radio',
      values: {
        create: [
          { id: 'attr_val_shots_single', name: 'Single', odooId: -131, priceExtra: 0 },
          { id: 'attr_val_shots_double', name: 'Double', odooId: -132, priceExtra: 10 },
          { id: 'attr_val_shots_triple', name: 'Triple', odooId: -133, priceExtra: 20 },
        ],
      },
    },
  });
  console.log('Upserted attribute: Espresso Shots');

  await prisma.attribute.upsert({
    where: { name: 'Syrup Flavors' },
    update: {},
    create: {
      id: 'attr_syrup_flavors',
      name: 'Syrup Flavors',
      odooId: -140,
      displayType: 'select',
      values: {
        create: [
          { id: 'attr_val_syrup_vanilla', name: 'Vanilla', odooId: -141, priceExtra: 10 },
          { id: 'attr_val_syrup_caramel', name: 'Caramel', odooId: -142, priceExtra: 10 },
          { id: 'attr_val_syrup_hazelnut', name: 'Hazelnut', odooId: -143, priceExtra: 10 },
          { id: 'attr_val_syrup_spanish', name: 'Spanish', odooId: -144, priceExtra: 10 },
          { id: 'attr_val_syrup_mocha', name: 'Mocha', odooId: -145, priceExtra: 10 },
          { id: 'attr_val_syrup_coffee', name: 'Coffee', odooId: -146, priceExtra: 0 },
          { id: 'attr_val_syrup_pistachio', name: 'Pistachio', odooId: -147, priceExtra: 15 },
        ],
      },
    },
  });
  console.log('Upserted attribute: Syrup Flavors');

  await prisma.attribute.upsert({
    where: { name: 'Toppings' },
    update: {},
    create: {
      id: 'attr_toppings',
      name: 'Toppings',
      odooId: -150,
      displayType: 'checkbox',
      values: {
        create: [
          { id: 'attr_val_top_whipped', name: 'Whipped Cream', odooId: -151, priceExtra: 5 },
          { id: 'attr_val_top_marshmallow', name: 'Marshmallow', odooId: -152, priceExtra: 5 },
          { id: 'attr_val_top_icecream', name: 'Ice Cream Scoop', odooId: -153, priceExtra: 20 },
          { id: 'attr_val_top_choc_sauce', name: 'Chocolate Sauce', odooId: -154, priceExtra: 10 },
          { id: 'attr_val_top_caramel_sauce', name: 'Caramel Sauce', odooId: -155, priceExtra: 10 },
        ],
      },
    },
  });
  console.log('Upserted attribute: Toppings');

  await prisma.attribute.upsert({
    where: { name: 'Sweetness Level' },
    update: {},
    create: {
      id: 'attr_sweetness',
      name: 'Sweetness Level',
      odooId: -160,
      displayType: 'radio',
      values: {
        create: [
          { id: 'attr_val_sweet_none', name: 'No Sugar', odooId: -161, priceExtra: 0 },
          { id: 'attr_val_sweet_light', name: 'Light Sugar', odooId: -162, priceExtra: 0 },
          { id: 'attr_val_sweet_regular', name: 'Regular Sugar', odooId: -163, priceExtra: 0 },
          { id: 'attr_val_sweet_extra', name: 'Extra Sugar', odooId: -164, priceExtra: 5 },
        ],
      },
    },
  });
  console.log('Upserted attribute: Sweetness Level');

  // --- Category-Specific Attributes ---

  await prisma.attribute.upsert({
    where: { name: 'Boba Topping' },
    update: {},
    create: {
      id: 'attr_boba_topping',
      name: 'Boba Topping',
      odooId: -170,
      displayType: 'checkbox',
      values: {
        create: [
          { id: 'attr_val_boba_tapioca', name: 'Tapioca Pearls', odooId: -171, priceExtra: 10 },
          { id: 'attr_val_boba_popping', name: 'Popping Boba', odooId: -172, priceExtra: 15 },
          { id: 'attr_val_boba_extra_tapioca', name: 'Extra Tapioca Pearls', odooId: -173, priceExtra: 20 },
        ],
      },
    },
  });
  console.log('Upserted attribute: Boba Topping');

  await prisma.attribute.upsert({
    where: { name: 'Tea Type' },
    update: {},
    create: {
      id: 'attr_tea_type',
      name: 'Tea Type',
      odooId: -180,
      displayType: 'radio',
      values: {
        create: [
          { id: 'attr_val_tea_black', name: 'Black', odooId: -181, priceExtra: 0 },
          { id: 'attr_val_tea_green', name: 'Green', odooId: -182, priceExtra: 0 },
          { id: 'attr_val_tea_hibiscus', name: 'Hibiscus', odooId: -183, priceExtra: 0 },
        ],
      },
    },
  });
  console.log('Upserted attribute: Tea Type');

  console.log('Attribute creation script finished successfully.');
}

main()
  .catch((e) => {
    console.error('An error occurred:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
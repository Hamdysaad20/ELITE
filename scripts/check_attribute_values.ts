import { createOdooClient } from '../src/server/utils/odooClient';
import dotenv from 'dotenv';

dotenv.config();

const ATTRIBUTES = {
  FLAVOR: 14,
  MILK: 27,
  ESPRESSO_SHOTS: 12,
  EXTRAS: 0 // Need to find ID if it exists, or check what "extras" refers to in previous context
};

async function checkAttributeValues() {
  const odoo = createOdooClient();
  console.log("🕵️  Checking Attribute Values...\n");

  const attributesToCheck = [
    { id: 14, name: "Flavor" },
    { id: 27, name: "Milk" },
    { id: 12, name: "Espresso Shots" },
    { id: 33, name: "Whipped Cream" },
    { id: 34, name: "Drizzle" },
    { id: 35, name: "Foam" },
    { id: 15, name: "Toppings" } // Checking if this exists as attribute
  ];

  for (const attr of attributesToCheck) {
    try {
      const values = await (odoo as any).searchRead('product.attribute.value', 
        [['attribute_id', '=', attr.id]], 
        ['id', 'name']
      );
      console.log(`\n📋 ${attr.name} (ID: ${attr.id}) Values:`);
      if (values.length === 0) {
        console.log("   (No values found)");
      } else {
        values.forEach((v: any) => console.log(`   - [${v.id}] ${v.name}`));
      }
    } catch (e) {
      console.log(`   ❌ Error checking ${attr.name}: ${(e as any).message}`);
    }
  }
}

checkAttributeValues().catch(console.error);

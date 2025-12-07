import { createOdooClient } from '../src/server/utils/odooClient';
import dotenv from 'dotenv';

dotenv.config();

const ATTRIBUTES = {
  MILK: 27,
  FLAVOR: 14,
  ESPRESSO_SHOTS: 12
};

const CATEGORIES = {
  COFFEE: 13,
  ICED: 18,
  FRAPPE: 19,
  MILKSHAKE: 20,
  TEA: 14
};

async function applyNoOptions() {
  const odoo = createOdooClient();
  console.log("🛡️  Applying 'No X' Options to Products...\n");

  // 1. Get IDs for "No Milk", "No Flavor", "No Shot"
  const getValId = async (attrId: number, name: string) => {
    const res = await (odoo as any).searchRead('product.attribute.value', [['attribute_id', '=', attrId], ['name', '=', name]], ['id']);
    return res.length > 0 ? res[0].id : null;
  };

  const noMilkId = await getValId(ATTRIBUTES.MILK, "No Milk");
  const noFlavorId = await getValId(ATTRIBUTES.FLAVOR, "No Flavor");
  const noShotId = await getValId(ATTRIBUTES.ESPRESSO_SHOTS, "No Shot");

  if (!noMilkId || !noFlavorId || !noShotId) {
    console.error("❌ Critical Error: 'No' values missing. Run standardization first.");
    return;
  }

  // 2. Apply to Products
  const applyValue = async (attrId: number, valueId: number, categoryId: number) => {
    console.log(`   Applying Value ID ${valueId} to Category ${categoryId}...`);
    
    // Find products in category
    const products = await (odoo as any).searchRead('product.template', [['categ_id', '=', categoryId]], ['id', 'name']);
    const productIds = products.map((p: any) => p.id);

    // Find attribute lines for these products
    const lines = await (odoo as any).searchRead('product.template.attribute.line', 
      [['product_tmpl_id', 'in', productIds], ['attribute_id', '=', attrId]], 
      ['id', 'value_ids', 'product_tmpl_id']
    );

    for (const line of lines) {
      const currentIds = line.value_ids;
      if (!currentIds.includes(valueId)) {
        console.log(`      + Adding to "${line.product_tmpl_id[1]}"`);
        // Add to beginning of list
        const newIds = [valueId, ...currentIds];
        await (odoo as any).rpc('product.template.attribute.line', 'write', [[line.id], { value_ids: [[6, 0, newIds]] }]);
      }
    }
  };

  // Apply "No Milk" to Coffee, Iced, Tea
  await applyValue(ATTRIBUTES.MILK, noMilkId, CATEGORIES.COFFEE);
  await applyValue(ATTRIBUTES.MILK, noMilkId, CATEGORIES.ICED);
  await applyValue(ATTRIBUTES.MILK, noMilkId, CATEGORIES.TEA);

  // Apply "No Flavor" to Coffee, Iced, Frappe, Milkshake
  await applyValue(ATTRIBUTES.FLAVOR, noFlavorId, CATEGORIES.COFFEE);
  await applyValue(ATTRIBUTES.FLAVOR, noFlavorId, CATEGORIES.ICED);
  await applyValue(ATTRIBUTES.FLAVOR, noFlavorId, CATEGORIES.FRAPPE);
  await applyValue(ATTRIBUTES.FLAVOR, noFlavorId, CATEGORIES.MILKSHAKE);

  // Apply "No Shot" to Coffee, Iced, Frappe
  await applyValue(ATTRIBUTES.ESPRESSO_SHOTS, noShotId, CATEGORIES.COFFEE);
  await applyValue(ATTRIBUTES.ESPRESSO_SHOTS, noShotId, CATEGORIES.ICED);
  await applyValue(ATTRIBUTES.ESPRESSO_SHOTS, noShotId, CATEGORIES.FRAPPE);

  console.log("\n✨ 'No X' Options Applied Successfully.");
}

applyNoOptions().catch(console.error);

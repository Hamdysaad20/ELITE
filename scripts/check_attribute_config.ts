import { createOdooClient } from '../src/server/utils/odooClient';
import dotenv from 'dotenv';

dotenv.config();

async function checkAttributeConfig() {
  const odoo = createOdooClient();
  console.log("⚙️  Checking Attribute Configuration...\n");

  const attributes = await (odoo as any).searchRead('product.attribute', 
    [], 
    ['id', 'name', 'create_variant', 'display_type']
  );

  console.log("| ID | Name | Create Variant Mode | Display Type |");
  console.log("|---|---|---|---|");
  attributes.forEach((a: any) => {
    console.log(`| ${a.id} | ${a.name} | ${a.create_variant} | ${a.display_type} |`);
  });
}

checkAttributeConfig().catch(console.error);

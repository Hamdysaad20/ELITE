import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient';

dotenv.config();

async function checkItems() {
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo config not found');
  config.timeoutMs = 180000;
  const odoo = new OdooClient(config) as any;

  // Check for signature drinks
  const items = await odoo.searchRead('product.template', [['name', 'ilike', 'mojito|escobar|lemon|karkade']], ['id', 'name']);
  console.log('Signature drinks:');
  items.forEach((i: any) => console.log(`  - "${i.name}"`));
}

checkItems().catch(console.error);

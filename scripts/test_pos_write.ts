import { createOdooClient } from '../src/server/utils/odooClient';

async function run() {
  const client = createOdooClient();
  if (!client) {
    console.error('No Odoo client (env missing).');
    return;
  }
  const name = 'Vanilla Milkshake';
  const prod = await (client as any).rpc('product.template','search_read',[],{ domain: [["name","=",name]], fields: ['id','name'], limit: 1 });
  console.log('found', prod);
  if (!prod || prod.length === 0) return;
  
  const targetCat = 'Milkshake';
  // Try product.category (internal categories) instead since public category doesn't exist
  const cats = await client.searchRead('product.category', [["name","=",targetCat]], ["id"], { limit: 1 });
  let catId: number | null = cats[0]?.id ?? null;
  if (!catId) {
    catId = await (client as any).rpc('product.category','create', [[{ name: targetCat }]], {});
    console.log('created product.category', catId);
  } else {
    console.log('using existing product.category', catId);
  }
  
  // Write internal category via categ_id (many2one)
  await (client as any).rpc('product.template', 'write', [[prod[0].id], { categ_id: catId }]);
  const after = await (client as any).rpc('product.template','read', [[prod[0].id], ['categ_id']]);
  console.log('after write, categ_id:', after);
}

run().catch(err => { console.error(err); process.exit(1); });

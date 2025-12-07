import 'dotenv/config';
import { createOdooClient } from '../src/server/utils/odooClient';
import fs from 'fs';
import path from 'path';

/*
Consolidate hot/iced pairs into one product.template by adding Temperature attribute (Hot/Iced).
Rules:
- Pair items whose names differ only by '(Hot)' vs '(Iced)' or leading 'Iced ' prefix.
- Choose canonical template: lowest ID, prefer non-iced base (e.g., 'Latte').
- Attach attribute 'Temperature' with values Hot/Iced (create if missing).
- Set create_variant='always' on attribute lines and ensure pos category remains short schema.
- Preserve standalone recipes like 'Iced Caramel Macchiato' (keep separate; skip pairing).
*/

type Item = { id: string; name: string; price: number; category: string; sku: string };

function loadOldList(): Item[] {
  const fp = path.resolve(__dirname, '../data/all_products_list.json');
  return JSON.parse(fs.readFileSync(fp, 'utf-8')) as Item[];
}

function normalizeBaseName(name: string): { base: string; isIced: boolean; isHot: boolean } {
  const n = name.trim();
  const lower = n.toLowerCase();
  const iced = lower.startsWith('iced ') || lower.includes('(iced)');
  const hot = lower.includes('(hot)');
  let base = n.replace(/^(Iced\s+)/i, '').replace(/\s*\((Iced|Hot)\)\s*/i, '').trim();
  return { base, isIced: iced, isHot: hot };
}

const STANDALONE_WHITELIST = [
  'Iced Caramel Macchiato',
  'Caramel Macchiato',
  'Spanish Latte',
  'Black Cat',
  'Espresso Avocado',
  'Power Soda +18',
  'Golden Peach Sunrise',
  'Raspberry & Pineapple',
  'Raspberry & Pineapple Smoothie',
];

function isStandaloneRecipe(name: string): boolean {
  const lower = name.toLowerCase();
  // Direct name match or base match from whitelist
  const base = normalizeBaseName(name).base.toLowerCase();
  return STANDALONE_WHITELIST.some(w => {
    const wl = w.toLowerCase();
    return wl === lower || wl === base;
  });
}

async function ensureAttribute(client: any, name: string, values: string[]): Promise<{ attrId: number; valueIds: number[] }> {
  const attrs = await client.searchRead('product.attribute', [[['name', '=', name]]], ['id'], 0, 1);
  let attrId = attrs.length ? attrs[0].id : await client.create('product.attribute', { name });
  const valueIds: number[] = [];
  for (const v of values) {
    const vals = await client.searchRead('product.attribute.value', [[['name', '=', v], ['attribute_id', '=', attrId]]], ['id'], 0, 1);
    const id = vals.length ? vals[0].id : await client.create('product.attribute.value', { name: v, attribute_id: attrId });
    valueIds.push(id);
  }
  return { attrId, valueIds };
}

async function main() {
  const items = loadOldList();
  const byBase: Map<string, Item[]> = new Map();

  for (const it of items) {
    if (isStandaloneRecipe(it.name)) continue; // skip special recipes
    const { base } = normalizeBaseName(it.name);
    const arr = byBase.get(base) || [];
    arr.push(it);
    byBase.set(base, arr);
  }

  const pairs = Array.from(byBase.entries())
    .map(([base, arr]) => {
      const flags = arr.map(a => normalizeBaseName(a.name));
      const hasIced = flags.some(f => f.isIced);
      // Treat bare without markers as hot by default to satisfy consolidation
      const hasHot = flags.some(f => f.isHot || (!f.isIced && !f.isHot));
      return { base, arr, hasIced, hasHot };
    })
    .filter(p => p.hasIced && p.hasHot);

  console.log(`[INFO] Candidate hot/iced bases: ${pairs.length}`);

  const envOK = (process.env.ODOO_URL || process.env.ODOO_HOST) && (process.env.ODOO_API_KEY || (process.env.ODOO_DB && process.env.ODOO_USERNAME && process.env.ODOO_PASSWORD));
  if (!envOK) {
    console.error('[WARN] Missing Odoo credentials. Preview only.');
    console.log(pairs.slice(0, 20).map(p => ({ base: p.base, ids: p.arr.map(a => a.id), names: p.arr.map(a => a.name) })));
    return;
  }

  const client = createOdooClient();
  if (!client) {
    console.error('[ERROR] Odoo client could not be created from env. Check ODOO_HOST/DB/USERNAME/API_KEY.');
    return;
  }
  const { attrId, valueIds } = await ensureAttribute(client, 'Temperature', ['Hot', 'Iced']);

  for (const p of pairs) {
    const canonical = p.arr.reduce((min, it) => (Number(it.id) < Number(min.id) ? it : min), p.arr[0]);
    const others = p.arr.filter(it => it.id !== canonical.id);

    // Attach Temperature attribute line to canonical
    const line = {
      attribute_id: attrId,
      value_ids: [[6, 0, valueIds]], // replace values
      create_variant: 'always',
    };
    await (client as any).rpc('product.template', 'write', [[Number(canonical.id)], { attribute_line_ids: [[0, 0, line]] }]);

    // Archive others
    if (others.length) {
      await (client as any).rpc('product.template', 'write', [others.map(o => Number(o.id)), { active: false }]);
    }
    console.log(`[OK] Consolidated ${p.base}: kept ${canonical.id}, archived ${others.map(o => o.id).join(', ')}`);
  }

  console.log('[DONE] Temperature consolidation complete.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

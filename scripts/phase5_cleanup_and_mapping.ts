import 'dotenv/config';
import { createOdooClient } from '../src/server/utils/odooClient';
import fs from 'fs';
import path from 'path';

// Short category schema
const SHORT_CATEGORIES = [
  'Coffee',
  'Tea',
  'Iced',
  'Frappe',
  'Milkshake',
  'Smoothie',
  'Soda',
  'Food',
  'Extras',
  'Services',
  'Offers',
];

// Known name corrections (typos and normalization)
const NAME_CORRECTIONS: Record<string, string> = {
  'iced macchiat': 'Iced Macchiato',
  'open regester': 'OPEN REGISTER',
  'amricano': 'Americano',
  'huny cake': 'HONEY CAKE',
  'extra marshmello': 'extra Marshmallow',
};

function fixName(name: string): string {
  const n = name.trim();
  const key = n.toLowerCase();
  if (NAME_CORRECTIONS[key]) return NAME_CORRECTIONS[key];
  return n;
}

// Name-based mapping to short categories
function mapCategoryByName(name: string): string {
  const n = name.toLowerCase();
  // Iced precedence
  if (/\b(iced|icee|ice)\b/.test(n)) return 'Iced';
  if (/\b(boba|bubble)\b/.test(n)) return 'Iced';
  // Tea family (include plural and common teas)
  if (/(^|\b)(matcha|chai|tea|teas|hibiscus|karak)(\b|$)/.test(n) && !/iced/.test(n)) return 'Tea';
  // Frappe variants (handle accent and partial)
  if (/frapp(e|é)/.test(n)) return 'Frappe';
  // Milkshake
  if (/\bmilkshake\b/.test(n)) return 'Milkshake';
  // Soda & mojito
  if (/\b(soda|mojito)\b/.test(n)) return 'Soda';
  // Smoothie
  if (/\b(smoothie)\b/.test(n)) return 'Smoothie';
  // Food (plural forms)
  if (/\b(cheese|burger|sandwich|cake|brownie|brownies|pie|molten)\b/.test(n)) return 'Food';
  // Extras
  if (/\b(extra|cup|water|topping|flavor|flavour|honey|whip|marshmello|marshmallow)\b/.test(n)) return 'Extras';
  // Services
  if (/\b(gift|top-up|open regester|open register)\b/.test(n)) return 'Services';
  // Offers & discounts
  if (/\b(discount|offer|bestie)\b/.test(n)) return 'Offers';
  // Default coffee for common hot drinks
  if (/\b(espresso|americano|latte|cappuccino|mocha|macchiato|flat white|cortado|turkish)\b/.test(n)) return 'Coffee';
  return 'Coffee';
}

// Long -> short category translation when present
function shortenCategory(category: string): string {
  const c = (category || '').toLowerCase();
  if (c.includes('iced')) return 'Iced';
  if (c.includes('hot drinks / coffee')) return 'Coffee';
  if (c.includes('hot drinks / tea')) return 'Tea';
  if (c.includes('specialty') || c.includes('elite')) return 'Coffee';
  if (c.includes('frapp')) return 'Frappe';
  if (c.includes('services')) return 'Services';
  return category && SHORT_CATEGORIES.includes(category) ? category : undefined as any;
}

type Item = { id: string; name: string; price: number; category: string; sku: string };

function loadOldList(): Item[] {
  const fp = path.resolve(__dirname, '../data/all_products_list.json');
  const raw = fs.readFileSync(fp, 'utf-8');
  return JSON.parse(raw);
}

function uniqueKey(item: Item) {
  return item.name.trim().toLowerCase();
}

async function main() {
  const items = loadOldList();

  // Group by name to detect duplicates
  const byName = new Map<string, Item[]>();
  for (const it of items) {
    const key = uniqueKey(it);
    const arr = byName.get(key) || [];
    arr.push(it);
    byName.set(key, arr);
  }

  const duplicates: { name: string; ids: string[] }[] = [];
  for (const [name, arr] of byName.entries()) {
    if (arr.length > 1) duplicates.push({ name, ids: arr.map(a => a.id) });
  }

  console.log(`[INFO] Items loaded: ${items.length}`);
  console.log(`[INFO] Duplicate name groups: ${duplicates.length}`);

  // Prepare updates per item: targetCategory and archive duplicates (keep lowest id)
  type UpdatePlan = { id: number; name: string; fromCategory?: string; toCategory: string; archive?: boolean };
  const plan: UpdatePlan[] = [];

  for (const [name, arr] of byName.entries()) {
    if (arr.length === 1) {
      // Singleton - just map category
      const item = arr[0];
      const fixedName = fixName(item.name);
      const catShort = shortenCategory(item.category) || mapCategoryByName(fixedName);
      plan.push({ id: Number(item.id), name: fixedName, fromCategory: item.category, toCategory: catShort, archive: false });
    } else {
      // Duplicates - determine canonical (lowest ID)
      const canonical = arr.reduce((min, it) => (Number(it.id) < Number(min.id) ? it : min), arr[0]);
      const fixedCanonicalName = fixName(canonical.name);
      const canonicalCatShort = shortenCategory(canonical.category) || mapCategoryByName(fixedCanonicalName);
      plan.push({ id: Number(canonical.id), name: fixedCanonicalName, fromCategory: canonical.category, toCategory: canonicalCatShort, archive: false });
      // Others archived
      for (const other of arr) {
        if (other.id !== canonical.id) {
          const fixedOtherName = fixName(other.name);
          plan.push({ id: Number(other.id), name: fixedOtherName, fromCategory: other.category, toCategory: mapCategoryByName(fixedOtherName), archive: true });
        }
      }
    }
  }

  // Always emit a mapping report for review
  const reportPath = path.resolve(__dirname, '../data/phase5_mapping_report.json');
  const summary = {
    items: items.length,
    duplicateGroups: duplicates.length,
    planCount: plan.length,
    samples: plan.slice(0, 25),
    categoryCounts: SHORT_CATEGORIES.reduce((acc, cat) => {
      acc[cat] = plan.filter(p => p.toCategory === cat).length;
      return acc;
    }, {} as Record<string, number>),
  };
  fs.writeFileSync(reportPath, JSON.stringify({ summary, plan }, null, 2));
  console.log(`[INFO] Mapping report written: ${reportPath}`);

  const envOK = (process.env.ODOO_URL || process.env.ODOO_HOST) && (process.env.ODOO_API_KEY || (process.env.ODOO_DB && process.env.ODOO_USERNAME && process.env.ODOO_PASSWORD));
  if (!envOK) {
    console.error('[WARN] Missing Odoo credentials. Skipping writes. Review the report and re-run with env set.');
    return;
  }

  const client = createOdooClient();
  if (!client) {
    console.error('[ERROR] Odoo client could not be created from env. Check ODOO_HOST/DB/USERNAME/API_KEY.');
    return;
  }

  const updatesDone: number[] = [];
  const archived: number[] = [];
  const notFound: number[] = [];

  for (const upd of plan) {
    // Find product.template by ID (old list uses "id" which maps to product.template id in many exports, but verify)
    const templateId = Number(upd.id);
    try {
      // Locate product.template by name (IDs from old list may not match current DB)
      const foundTemplates = await (client as any).rpc('product.template', 'search_read', [], {
        domain: [["name", "=", upd.name]],
        fields: ["id", "name"],
        limit: 1,
      });
      if (!foundTemplates || foundTemplates.length === 0) {
        throw new Error(`Template not found by name: ${upd.name}`);
      }
      const actualTemplateId = foundTemplates[0].id as number;

      // Build vals after determining category ID
      const toCat = upd.toCategory;
      // Use product.category (internal categories) via categ_id field
      const cats = await client.searchRead('product.category', [["name", "=", toCat]], ["id"], { limit: 1 });
      let catId: number | null = null;
      if (cats.length > 0) catId = cats[0].id as number;
      else {
        catId = await (client as any).rpc('product.category', 'create', [[{ name: toCat }]], {});
      }
      
      // Write internal category
      await (client as any).rpc('product.template', 'write', [[actualTemplateId], { categ_id: catId }]);
      updatesDone.push(actualTemplateId);

      if (upd.archive) {
        await (client as any).rpc('product.template', 'write', [[actualTemplateId], { active: false }]);
        archived.push(actualTemplateId);
      }
    } catch (e) {
      console.error(`[ERROR] Update failed for template ${templateId} (${upd.name}):`, (e as Error).message);
      notFound.push(templateId);
    }
  }

  console.log(`[RESULT] Updates: ${updatesDone.length}, Archived: ${archived.length}, Not Found: ${notFound.length}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

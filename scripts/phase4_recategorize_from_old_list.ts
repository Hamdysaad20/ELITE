#!/usr/bin/env tsx
import dotenv from 'dotenv'
import { createOdooClient } from '../src/server/utils/odooClient'

dotenv.config()

type OdooAny = any

const CATEGORY_RULES: Array<{ test: (name: string) => boolean; category: string }> = [
  { test: (n) => /\bIced\b/i.test(n) || /\(Iced\)/i.test(n), category: 'Iced' },
  { test: (n) => /Frapp[eé]/i.test(n), category: 'Frappe' },
  { test: (n) => /Milkshake/i.test(n), category: 'Milkshake' },
  { test: (n) => /Smoothie|Sunrise|Raspberry & Pineapple/i.test(n), category: 'Smoothie' },
  { test: (n) => /Soda|Mojito\s*SODA|Classic Lemon Soda|Custom Soda|Passion Fruit Soda|Escobar Soda Drink/i.test(n), category: 'Soda' },
  { test: (n) => /BOBA|Boba\/Bubble/i.test(n), category: 'Boba' },
  { test: (n) => /Cookie|Cake|Burger/i.test(n), category: 'Food' },
  { test: (n) => /Gift Card|Top-up eWallet|OPEN REGESTER/i.test(n), category: 'Services' },
  { test: (n) => /Extra|\[EXTRA]|Premium topping|Coconut Milk|Marshmello|Cup|^Water$/i.test(n), category: 'Extras' },
  { test: (n) => true, category: 'Coffee' }, // default catch-all for hot drinks
]

const SIZE_TARGETS = [
  // core hot drinks
  'Americano', 'Latte', 'Cappuccino', 'Mocha',
  'Spanish Latte (Hot)', 'Matcha Latte (Hot)', 'Chocolate (Hot)', 'Chai Latte (Hot)'
]

async function ensureCategory(odoo: OdooAny, name: string) {
  const cats = await (odoo as any).searchRead('product.category', [["name", "=", name]], ["id", "name"])
  if (cats.length) return cats[0].id as number
  const id = await (odoo as any).rpc('product.category', 'create', [{ name }])
  return id as number
}

async function ensureSizeAttribute(odoo: OdooAny) {
  const attrs = await (odoo as any).searchRead('product.attribute', [["name", "=", "Size"]], ["id", "name", "create_variant", "display_type"])
  let attribute_id: number
  if (attrs.length) {
    attribute_id = attrs[0].id
    await (odoo as any).rpc('product.attribute', 'write', [[attribute_id], { create_variant: 'always', display_type: 'select' }])
  } else {
    attribute_id = await (odoo as any).rpc('product.attribute', 'create', [{ name: 'Size', create_variant: 'always', display_type: 'select' }])
  }
  const ensureValue = async (name: string) => {
    const vals = await (odoo as any).searchRead('product.attribute.value', [["attribute_id", "=", attribute_id], ["name", "=", name]], ["id", "name"])
    if (vals.length) return vals[0].id as number
    const id = await (odoo as any).rpc('product.attribute.value', 'create', [{ attribute_id, name }])
    return id as number
  }
  const smallId = await ensureValue('Small')
  const mediumId = await ensureValue('Medium')
  const largeId = await ensureValue('Large')
  return { attribute_id, value_ids: [smallId, mediumId, largeId] }
}

async function recategorize(odoo: OdooAny) {
  const products = await (odoo as any).searchRead('product.template', [["active", "=", true]], ["id", "name", "categ_id"])
  const categoryCache = new Map<string, number>()
  const getCatId = async (name: string) => {
    if (categoryCache.has(name)) return categoryCache.get(name) as number
    const id = await ensureCategory(odoo, name)
    categoryCache.set(name, id)
    return id
  }

  let moved = 0
  for (const p of products) {
    const name = String(p.name || '')
    const rule = CATEGORY_RULES.find(r => r.test(name))!
    const targetCat = rule.category
    const currentCatId = Array.isArray(p.categ_id) ? p.categ_id[0] : p.categ_id
    const targetCatId = await getCatId(targetCat)
    if (currentCatId === targetCatId) continue
    try {
      await (odoo as any).rpc('product.template', 'write', [[p.id], { categ_id: targetCatId }])
      moved++
      console.log(`   ➜ ${p.id} "${name}" -> ${targetCat}`)
    } catch (e) {
      console.log(`   ❌ Failed to set category for ${p.id} "${name}": ${(e as any)?.message || e}`)
    }
  }
  console.log(`Category updates: ${moved}`)
}

async function attachSizeToCore(odoo: OdooAny) {
  const sizeAttr = await ensureSizeAttribute(odoo)
  const domain = [["active", "=", true], ["name", "in", SIZE_TARGETS]]
  const products = await (odoo as any).searchRead('product.template', domain, ["id", "name", "attribute_line_ids"]) 
  let updated = 0
  for (const p of products) {
    try {
      await (odoo as any).rpc('product.template', 'write', [[p.id], {
        attribute_line_ids: [[0, 0, { attribute_id: sizeAttr.attribute_id, value_ids: sizeAttr.value_ids }]],
      }])
      updated++
      console.log(`   ➜ Size added to ${p.id} "${p.name}"`)
    } catch (e) {
      console.log(`   ❌ Failed to add Size to ${p.id} "${p.name}": ${(e as any)?.message || e}`)
    }
  }
  console.log(`Size attribute updates: ${updated}`)
}

async function main() {
  const odoo = createOdooClient()
  if (!odoo) {
    console.error('Odoo not configured')
    process.exit(1)
  }
  console.log('🏷️ Recategorizing products to short categories...')
  await recategorize(odoo)
  console.log('\n📐 Attaching Size to core hot drinks...')
  await attachSizeToCore(odoo)
  console.log('\n✅ Done.')
}

main().catch(err => { console.error(err); process.exit(1) })

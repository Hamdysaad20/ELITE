#!/usr/bin/env tsx
import dotenv from 'dotenv'
import { createOdooClient } from '../src/server/utils/odooClient'

dotenv.config()

// Hard-coded product template IDs to move to Extras based on provided list
// Names (for reference): Cup, Water, Extra Shot, Extra Honey, Extra Ice Cream Scoop, Extra whip cream, [EXTRA]Coconut Milk, EXTRA Flavor, Premium topping
const EXTRA_PRODUCT_IDS = [
  957, // Cup
  521, 522, 899, 900, // Water variants
  915, // Extra Shot
  923, // Extra Honey
  909, // Extra Ice Cream Scoop
  922, // Extra whip cream
  924, // [EXTRA]Coconut Milk
  933, // EXTRA Flavor
  941, // Premium topping
]

async function ensureCategoryByName(odoo: any, name: string): Promise<number> {
  const cats = await (odoo as any).searchRead('product.category', [["name", "=", name]], ["id", "name"])
  if (cats.length) return cats[0].id as number
  const id = await (odoo as any).rpc('product.category', 'create', [{ name }])
  return id as number
}

async function main() {
  const odoo = createOdooClient()
  if (!odoo) {
    console.error('Odoo not configured')
    process.exit(1)
  }
  const extrasCategoryId = await ensureCategoryByName(odoo, 'Extras')

  // Validate product templates exist
  const templates = await (odoo as any).searchRead('product.template', [
    ['id', 'in', EXTRA_PRODUCT_IDS],
  ], ['id', 'name', 'categ_id'])

  const foundIds = templates.map(t => t.id as number)
  const missing = EXTRA_PRODUCT_IDS.filter(id => !foundIds.includes(id))
  if (missing.length) {
    console.warn(`[WARN] Missing product.template IDs (not found): ${missing.join(', ')}`)
  }

  if (!templates.length) {
    console.log('No matching templates found; nothing to move.')
    return
  }

  // Move each found template to Extras category
  let moved = 0
  for (const tmpl of templates) {
    const currentCateg = Array.isArray(tmpl.categ_id) ? tmpl.categ_id[0] : tmpl.categ_id
    if (currentCateg === extrasCategoryId) {
      console.log(`[SKIP] ${tmpl.id} ${tmpl.name} already in Extras`)
      continue
    }
    await (odoo as any).rpc('product.template', 'write', [[tmpl.id], { categ_id: extrasCategoryId }])
    console.log(`[MOVE] ${tmpl.id} ${tmpl.name} -> Extras`)
    moved++
  }

  console.log(`Moved ${moved} products to Extras.`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})

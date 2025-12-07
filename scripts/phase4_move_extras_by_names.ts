#!/usr/bin/env tsx
import dotenv from 'dotenv'
import { createOdooClient } from '../src/server/utils/odooClient'

dotenv.config()

const EXTRA_NAME_PATTERNS: RegExp[] = [
  /^Cup$/i,
  /^Water$/i,
  /^Extra Shot$/i,
  /^Extra Honey\s*$/i,
  /^Extra Ice Cream Scoop$/i,
  /^Extra whip cream$/i,
  /^\[EXTRA]Coconut Milk$/i,
  /^EXTRA Flavor\s*$/i,
  /^Premium topping$/i,
  /EXTRA BOBA/i,
  /Coconut Milk/i,
  /Marshmello/i,
];

async function ensureExtrasCategory(odoo: any) {
  const existing = await (odoo as any).searchRead('product.category', [["name", "=", "Extras"]], ["id", "name"])
  if (existing.length) return existing[0].id as number
  const id = await (odoo as any).rpc('product.category', 'create', [{ name: 'Extras' }])
  return id as number
}

async function main() {
  const odoo = createOdooClient()
  if (!odoo) {
    console.error('Odoo not configured')
    process.exit(1)
  }

  const extrasId = await ensureExtrasCategory(odoo)

  const products = await (odoo as any).searchRead('product.template', [["active", "=", true]], ["id", "name", "categ_id"])

  let moved = 0
  for (const p of products) {
    const name: string = p.name || ''
    const isExtra = EXTRA_NAME_PATTERNS.some((re) => re.test(name))
    if (!isExtra) continue
    const currentCatId = Array.isArray(p.categ_id) ? p.categ_id[0] : p.categ_id
    if (currentCatId === extrasId) continue
    try {
      await (odoo as any).rpc('product.template', 'write', [[p.id], { categ_id: extrasId }])
      moved++
      console.log(`   ➜ Moved "${name}" to Extras`)
    } catch (e) {
      console.log(`   ❌ Failed to move "${name}": ${(e as any)?.message || e}`)
    }
  }

  console.log(`Moved ${moved} products to Extras.`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})

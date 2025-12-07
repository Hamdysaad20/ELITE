#!/usr/bin/env tsx
import dotenv from 'dotenv'
import { createOdooClient } from '../src/server/utils/odooClient'

dotenv.config()

// Consolidate Spanish Latte (Hot) into one product with Size variants
// Keep iced versions unchanged under Iced category

const HOT_NAMES = [
  'Spanish Latte (Hot)',
]

async function ensureCategoryByName(odoo: any, name: string): Promise<number> {
  const cats = await (odoo as any).searchRead('product.category', [["name", "=", name]], ["id", "name"])
  if (cats.length) return cats[0].id as number
  const id = await (odoo as any).rpc('product.category', 'create', [{ name }])
  return id as number
}

async function ensureSizeAttributeWithValues(odoo: any) {
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

async function main() {
  const odoo = createOdooClient()
  if (!odoo) {
    console.error('Odoo not configured')
    process.exit(1)
  }

  const coffeeCategoryId = await ensureCategoryByName(odoo, 'Coffee')
  const sizeAttr = await ensureSizeAttributeWithValues(odoo)

  // Find all hot Spanish Latte templates by names
  const templates = await (odoo as any).searchRead('product.template', [
    ['name', 'in', HOT_NAMES],
    ['active', '=', true],
  ], ['id', 'name', 'categ_id', 'attribute_line_ids', 'list_price'])

  if (!templates.length) {
    console.log('No Spanish Latte (Hot) templates found.')
    return
  }

  // Choose primary as the first by id ascending
  const sorted = templates.sort((a, b) => (a.id as number) - (b.id as number))
  const primary = sorted[0]
  const duplicates = sorted.slice(1)

  // Ensure primary has Coffee category
  await (odoo as any).rpc('product.template', 'write', [[primary.id], { categ_id: coffeeCategoryId }])

  // Attach/merge Size attribute line with specified values
  // Remove any duplicate Size lines; then ensure one with Small/Medium/Large
  await (odoo as any).rpc('product.template', 'write', [[primary.id], { categ_id: coffeeCategoryId }])

  // Ensure attribute line exists
  // Link the Size attribute to the product template via attribute_line
  // Using helper to ensure line
  await (odoo as any).rpc('product.template', 'write', [[primary.id], {
    attribute_line_ids: [[0, 0, { attribute_id: sizeAttr.attribute_id, value_ids: sizeAttr.value_ids }]],
  }])

  console.log(`[PRIMARY] Spanish Latte (Hot) -> template ${primary.id}`)

  // Archive/remove duplicates
  for (const dup of duplicates) {
    await (odoo as any).rpc('product.template', 'write', [[dup.id], { active: false }])
    console.log(`[ARCHIVE] Duplicate template ${dup.id} (${dup.name}) archived`)
  }

  console.log('Consolidation complete.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})

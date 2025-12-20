/*
 * POS Coffee Category Refinement Script
 * - Dry-run by default. Set APPLY=true to perform changes.
 * - Idempotent: only creates missing attributes/values and removes template-level values as specified.
 *
 * Usage:
 *  DRY RUN (default):
 *    npx ts-node scripts/pos_refine_coffee_category.ts
 *
 *  APPLY changes:
 *    APPLY=true npx ts-node scripts/pos_refine_coffee_category.ts
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient';

dotenv.config();

const FRANCO_SUGAR = ['Sada', 'Alriha', 'Mazboot', 'Mano', 'Zeyada', 'Seryaosy'];
const SYRUP_SUGAR = ['0%', '50%', '100%', '150%', '200%'];
const DRY_RUN = process.env.APPLY !== 'true';
const SIMULATE = process.env.SIMULATE === 'true';

let client: any;

async function findOrCreateAttribute(name: string) {
  const found = await client.searchRead('product.attribute', [['name', '=', name]], ['id']);
  if (found && found.length) return found[0].id;
  console.log('[INFO] Creating attribute:', name);
  if (DRY_RUN) return null;
  const id = await client.rpc('product.attribute', 'create', [{ name }]);
  return id;
}

async function findTemplateAttributeValues(templateId: number, attributeId: number) {
  return client.searchRead('product.template.attribute.value', [['product_tmpl_id', '=', templateId], ['attribute_id', '=', attributeId]], ['id', 'name', 'price_extra', 'product_attribute_value_id']);
}
async function findOrCreateAttributeValue(attributeId: number, name: string, priceExtra = 0) {
  // Ensure a global product.attribute.value exists for attributeId/name
  const found = await client.searchRead('product.attribute.value', [['attribute_id', '=', attributeId], ['name', '=', name]], ['id']);
  if (found && found.length) return found[0].id;
  console.log('  -> creating global attribute value', name);
  if (DRY_RUN) return null;
  const id = await client.rpc('product.attribute.value', 'create', [{ name, attribute_id: Number(attributeId) }]);
  return id;
}

async function ensureAttributeLineWithValues(templateId: number, attributeId: number, values: Array<{ name: string; price: number }>) {
  // Ensure global attribute values, then ensure a product.template.attribute.line with value_ids,
  // then create/update product.template.attribute.value records to set per-template price extras.
  const valueGlobalIds: number[] = [];
  for (const v of values) {
    const vid = await findOrCreateAttributeValue(attributeId, v.name, v.price);
    if (vid) valueGlobalIds.push(Number(vid));
  }

  if (valueGlobalIds.length === 0) return;

  // Find or create attribute line
  const existingLine = await client.searchRead('product.template.attribute.line', [['product_tmpl_id', '=', templateId], ['attribute_id', '=', attributeId]], ['id', 'value_ids']);
  let lineId: number | null = null;
  if (existingLine && existingLine.length) {
    lineId = existingLine[0].id;
    // update value_ids to include desired globals
    const existingVals = Array.isArray(existingLine[0].value_ids) ? existingLine[0].value_ids : [];
    const merged = Array.from(new Set([...existingVals, ...valueGlobalIds]));
    if (!DRY_RUN) await client.rpc('product.template.attribute.line', 'write', [[lineId], { value_ids: [[6, 0, merged]] }]);
  } else {
    console.log('  -> creating attribute line for tmpl', templateId);
    if (!DRY_RUN) {
      lineId = await client.rpc('product.template.attribute.line', 'create', [{ product_tmpl_id: templateId, attribute_id: attributeId, value_ids: [[6, 0, valueGlobalIds]] }]);
    }
  }

  if (!lineId) return;

  // Ensure product.template.attribute.value entries exist for per-template price extras
  const existingTmplVals = await client.searchRead('product.template.attribute.value', [['product_tmpl_id', '=', templateId], ['attribute_id', '=', attributeId]], ['id', 'product_attribute_value_id', 'price_extra']);
  for (const v of values) {
    const global = await client.searchRead('product.attribute.value', [['attribute_id', '=', attributeId], ['name', '=', v.name]], ['id']);
    const globalId = global && global[0] ? global[0].id : null;
    if (!globalId) continue;
    const found = existingTmplVals.find((ev: any) => Number(ev.product_attribute_value_id) === Number(globalId));
    if (found) {
      if (Number(found.price_extra) !== Number(v.price)) {
        console.log(`    -> updating price_extra for ${v.name} to ${v.price}`);
        if (!DRY_RUN) await client.rpc('product.template.attribute.value', 'write', [[found.id], { price_extra: Number(v.price) }]);
      }
    } else {
      console.log(`    -> creating template attribute value for ${v.name} price ${v.price}`);
      if (!DRY_RUN) await client.rpc('product.template.attribute.value', 'create', [{ attribute_line_id: lineId, product_tmpl_id: templateId, attribute_id: attributeId, product_attribute_value_id: globalId, price_extra: Number(v.price) }]);
    }
  }
}

async function removeTemplateAttributeValuesByName(templateId: number, attributeId: number, names: string[]) {
  const existing = await findTemplateAttributeValues(templateId, attributeId);
  const toRemove = existing.filter((v: any) => names.includes(v.name)).map((v: any) => v.id);
  if (toRemove.length === 0) return;
  console.log(`  -> removing values [${names.join(', ')}] from tmpl ${templateId}`);
  if (DRY_RUN) return;
  await client.rpc('product.template.attribute.value', 'unlink', [toRemove]);
}

async function ensureSizeValuesForTemplate(templateId: number, mediumExtra = 10, largeExtra = 20) {
  const attrName = 'Size';
  const attr = await client.searchRead('product.attribute', [['name', '=', attrName]], ['id']);
  const attrId = (attr && attr[0]) ? attr[0].id : await findOrCreateAttribute(attrName);
  if (!attrId) return;
  await ensureAttributeLineWithValues(templateId, attrId, [
    { name: 'Small', price: 0 },
    { name: 'Medium', price: mediumExtra },
    { name: 'Large', price: largeExtra },
  ]);
}

async function ensureMilkOptions(templateId: number) {
  const attrName = 'Milk Option';
  const attr = await client.searchRead('product.attribute', [['name', '=', attrName]], ['id']);
  const attrId = (attr && attr[0]) ? attr[0].id : await findOrCreateAttribute(attrName);
  if (!attrId) return;
  await ensureAttributeLineWithValues(templateId, attrId, [
    { name: 'Oat', price: 25 },
    { name: 'Almond', price: 10 },
    { name: 'Soy', price: 10 },
    { name: 'Lactose-Free', price: 10 },
  ]);
}

async function ensureEspressoShots(templateId: number, singleExtra = 0, doubleExtra = 10, tripleExtra = 20) {
  const attrName = 'Espresso Shot';
  const attr = await client.searchRead('product.attribute', [['name', '=', attrName]], ['id']);
  const attrId = (attr && attr[0]) ? attr[0].id : await findOrCreateAttribute(attrName);
  if (!attrId) return;
  await ensureAttributeLineWithValues(templateId, attrId, [
    { name: 'Single', price: singleExtra },
    { name: 'Double', price: doubleExtra },
    { name: 'Triple', price: tripleExtra },
  ]);
}

async function ensureChocolateType(templateId: number) {
  const attrName = 'Chocolate Type';
  const attr = await client.searchRead('product.attribute', [['name', '=', attrName]], ['id']);
  const attrId = (attr && attr[0]) ? attr[0].id : await findOrCreateAttribute(attrName);
  if (!attrId) return;
  await ensureAttributeLineWithValues(templateId, attrId, [
    { name: 'Dark', price: 0 },
    { name: 'White', price: 0 },
  ]);
}

async function ensureMatchaOptions(templateId: number) {
  const attrName = 'Matcha Origin';
  const attr = await client.searchRead('product.attribute', [['name', '=', attrName]], ['id']);
  const attrId = (attr && attr[0]) ? attr[0].id : await findOrCreateAttribute(attrName);
  if (!attrId) return;
  await ensureAttributeLineWithValues(templateId, attrId, [
    { name: 'Thailand', price: 0 },
    { name: 'Japanese', price: 25 },
  ]);

  // Extra sauces/flavors attribute
  const extrasAttrName = 'Extra Sauce';
  const a = await client.searchRead('product.attribute', [['name', '=', extrasAttrName]], ['id']);
  const extrasAttrId = (a && a[0]) ? a[0].id : await findOrCreateAttribute(extrasAttrName);
  if (!extrasAttrId) return;
  const extrasToAdd = [ { name: 'Strawberry', price: 10 }, { name: 'Caramel', price: 10 }, { name: 'Chocolate Sauce', price: 10 } ];
  await ensureAttributeLineWithValues(templateId, extrasAttrId, extrasToAdd);
}

async function main() {
  console.log('Refine Coffee Category - dryRun=', DRY_RUN, ' simulate=', SIMULATE);

  const cfg = getOdooConfigFromEnv();
  if (!cfg && !SIMULATE) throw new Error('Odoo config missing in env. Set SIMULATE=true to run locally.');

  let templates: Array<{ id: number; name: string }> = [];

  if (cfg) {
    cfg.timeoutMs = 300000;
    client = new OdooClient(cfg);

    // Find Coffee category ids (match name)
    const cats = await client.searchRead('product.category', [['name', 'ilike', 'coffee']], ['id', 'name']);
    if (!cats || cats.length === 0) {
      console.log('[WARN] No category matching "coffee" found. Exiting.');
      return;
    }
    const catIds = cats.map((c: any) => c.id);
    console.log('Found coffee category ids:', catIds);

    // Fetch templates assigned to coffee categories and available in POS
    templates = await client.searchRead('product.template', [['pos_categ_ids', 'in', catIds], ['available_in_pos', '=', true]], ['id', 'name']);
    console.log('Templates to process:', templates.length);
  } else {
    // Simulation mode: load local products file and pick coffee-like items
    const dataPath = path.join(__dirname, '..', 'data', 'all_products_list_updated_v2.json');
    let raw: any[] = [];
    try {
      raw = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    } catch (err) {
      // try workspace root data
      const alt = path.join(process.cwd(), 'data', 'all_products_list_updated_v2.json');
      raw = JSON.parse(fs.readFileSync(alt, 'utf8'));
    }
    const candidates = raw.filter(p => /coffee|espresso|latte|cappuccino|mocha|matcha|hazelnut|cortado|turkish|french/i.test(p.name));
    templates = candidates.map(c => ({ id: Number(c.id), name: c.name }));
    console.log('SIMULATE: Templates to process (approx):', templates.length);
  }

  for (const tmpl of templates) {
    const id = tmpl.id as number;
    const name = (tmpl.name || '').toString().trim();
    console.log('\nProcessing template:', id, name);

    // Rules
    if (/french/i.test(name)) {
      console.log(' - French coffee: ensure sizes with +10/+20');
      await ensureSizeValuesForTemplate(id, 10, 20);
    }

    if (/turkish/i.test(name)) {
      console.log(' - Turkish coffee: remove sizes, add Single/Double (+20) and ensure Franco sugar');
      // remove Size values for this template
      const sizeAttr = await client.searchRead('product.attribute', [['name', '=', 'Size']], ['id']);
      if (sizeAttr && sizeAttr.length) {
        await removeTemplateAttributeValuesByName(id, sizeAttr[0].id, ['Small','Medium','Large']);
      }
      // add Shot values
      await ensureEspressoShots(id, 0, 20, 0); // user asked double +20 only
      // ensure Franco sugar values exist
      const sugarAttr = await client.searchRead('product.attribute', [['name', 'in', ['Sugar Level','Sugar']]], ['id','name']);
      let sugarAttrId;
      if (sugarAttr && sugarAttr.length) sugarAttrId = sugarAttr[0].id;
      else sugarAttrId = await findOrCreateAttribute('Sugar Level');
      if (sugarAttrId) {
        const existing = await findTemplateAttributeValues(id, sugarAttrId);
        const existingNames = existing.map((v: any) => v.name);
        // Ensure Franco sugar values exist on template
        await ensureAttributeLineWithValues(id, sugarAttrId, FRANCO_SUGAR.map(s => ({ name: s, price: 0 })));
        // remove any non-franco sugar values
        const nonFranco = existing.filter((v: any) => !FRANCO_SUGAR.includes(v.name)).map((v: any) => v.id);
        if (nonFranco.length) {
          console.log('  -> removing non-franco sugar values');
          if (!DRY_RUN) await client.rpc('product.template.attribute.value', 'unlink', [nonFranco]);
        }
      }
    }

    if (/espresso avocado/i.test(name) || /espresso avocado/i.test(name.toLowerCase())) {
      console.log(' - Espresso Avocado: remove sizes and sugar; add shot prices double +10, triple +20');
      const sizeAttr = await client.searchRead('product.attribute', [['name', '=', 'Size']], ['id']);
      if (sizeAttr && sizeAttr.length) {
        await removeTemplateAttributeValuesByName(id, sizeAttr[0].id, ['Small','Medium','Large']);
      }
      // remove sugar
      const sugarAttr = await client.searchRead('product.attribute', [['name', 'in', ['Sugar Level','Sugar']]], ['id']);
      if (sugarAttr && sugarAttr.length) {
        const existing = await findTemplateAttributeValues(id, sugarAttr[0].id);
        const ids = existing.map((v: any) => v.id);
        if (ids.length) {
          console.log('  -> removing sugar values from Espresso Avocado');
          if (!DRY_RUN) await client.rpc('product.template.attribute.value', 'unlink', [ids]);
        }
      }
      await ensureEspressoShots(id, 0, 10, 20);
    }

    if (/hazelnut/i.test(name)) {
      console.log(' - Hazelnut: ensure sizes with +10/+20');
      await ensureSizeValuesForTemplate(id, 10, 20);
    }

    // Milk options: if template has an attribute name containing "Milk" then ensure options with price
    // Detect attribute lines to see if milk exists for this template
    const attrLines = await client.searchRead('product.template.attribute.line', [['product_tmpl_id', '=', id]], ['id','attribute_id','value_ids']);
    for (const line of attrLines) {
      try {
        const attr = await client.searchRead('product.attribute', [['id', '=', line.attribute_id[0]]], ['name']);
        const attrName = attr && attr[0] ? attr[0].name : '';
        if (/milk/i.test(attrName)) {
          console.log(' - Has milk attribute', attrName, ': ensuring milk options');
          await ensureMilkOptions(id);
        }
      } catch (err) {
        // ignore
      }
    }

    if (/cortado/i.test(name)) {
      console.log(' - Cortado: remove sizes');
      const sizeAttr = await client.searchRead('product.attribute', [['name', '=', 'Size']], ['id']);
      if (sizeAttr && sizeAttr.length) {
        await removeTemplateAttributeValuesByName(id, sizeAttr[0].id, ['Small','Medium','Large']);
      }
    }

    if (/(cappuccino|mocha|latte|spanish latte)/i.test(name)) {
      console.log(' - Remove sugar level for', name);
      const sugarAttr = await client.searchRead('product.attribute', [['name', 'in', ['Sugar Level','Sugar']]], ['id']);
      if (sugarAttr && sugarAttr.length) {
        const existing = await findTemplateAttributeValues(id, sugarAttr[0].id);
        const ids = existing.map((v: any) => v.id);
        if (ids.length) {
          console.log('  -> removing sugar values');
          if (!DRY_RUN) await client.rpc('product.template.attribute.value', 'unlink', [ids]);
        }
      }
    }

    if (/chocolate/i.test(name) && !/frapp/i.test(name)) {
      console.log(' - Chocolate: ensure dark/white type');
      await ensureChocolateType(id);
    }

    if (/matcha/i.test(name)) {
      console.log(' - Matcha: ensure origins and extras');
      await ensureMatchaOptions(id);
    }

    // Sleep briefly to avoid hitting API rate limits
    await new Promise(res => setTimeout(res, 200));
  }

  console.log('\nDone. Review logs above. To apply changes set APPLY=true and re-run the script.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

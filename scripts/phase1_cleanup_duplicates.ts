import { createOdooClient, OdooClient } from "../src/server/utils/odooClient";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Phase 1.1: Archive duplicate products
 * 
 * This script identifies products with the same name and archives all but one.
 * It keeps the product with the most attributes configured.
 */

// Extend OdooClient to expose rpc for scripts
interface OdooClientWithRpc extends OdooClient {
  rpc<T = any>(model: string, method: string, args?: any[], kwargs?: Record<string, unknown>): Promise<T>;
}

async function main() {
  const odoo = createOdooClient() as OdooClientWithRpc | null;
  if (!odoo) {
    console.error("Odoo not configured");
    process.exit(1);
  }

  console.log("🔍 Scanning for duplicate products...\n");

  // Get all active products
  const products = await odoo.searchRead(
    "product.template",
    [["active", "=", true], ["sale_ok", "=", true]],
    ["id", "name", "categ_id", "list_price", "attribute_line_ids"]
  );

  // Group by normalized name (lowercase, trimmed)
  const byName: Record<string, any[]> = {};
  for (const p of products) {
    // Normalize: lowercase, trim, remove extra spaces
    const key = p.name.toLowerCase().trim().replace(/\s+/g, " ");
    if (!byName[key]) byName[key] = [];
    byName[key].push(p);
  }

  // Find duplicates
  const duplicates: { keep: any; archive: any[] }[] = [];
  
  for (const [name, items] of Object.entries(byName)) {
    if (items.length > 1) {
      // Sort by: most attributes first, then by ID (older first)
      items.sort((a, b) => {
        const aAttrs = a.attribute_line_ids?.length || 0;
        const bAttrs = b.attribute_line_ids?.length || 0;
        if (bAttrs !== aAttrs) return bAttrs - aAttrs;
        return a.id - b.id; // Keep older one if same attrs
      });

      duplicates.push({
        keep: items[0],
        archive: items.slice(1),
      });
    }
  }

  if (duplicates.length === 0) {
    console.log("✅ No duplicate products found!");
    return;
  }

  console.log(`Found ${duplicates.length} sets of duplicates:\n`);

  for (const dup of duplicates) {
    console.log(`📦 "${dup.keep.name}"`);
    console.log(`   Keep: ID ${dup.keep.id} (${dup.keep.attribute_line_ids?.length || 0} attrs, ${dup.keep.list_price} EGP)`);
    for (const arch of dup.archive) {
      console.log(`   Archive: ID ${arch.id} (${arch.attribute_line_ids?.length || 0} attrs, ${arch.list_price} EGP)`);
    }
    console.log();
  }

  // Confirm before archiving
  const totalToArchive = duplicates.reduce((sum, d) => sum + d.archive.length, 0);
  console.log(`\n⚠️  Will archive ${totalToArchive} duplicate products.`);
  console.log("Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n");

  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Archive duplicates
  console.log("🗄️  Archiving duplicates...\n");
  
  let archived = 0;
  for (const dup of duplicates) {
    for (const arch of dup.archive) {
      try {
        await odoo.searchRead("product.template", [["id", "=", arch.id]], ["id"]); // Verify exists
        // Archive by setting active = false
        await odoo.rpc("product.template", "write", [[arch.id], { active: false }]);
        console.log(`   ✅ Archived: "${arch.name}" (ID: ${arch.id})`);
        archived++;
      } catch (err: any) {
        console.error(`   ❌ Failed to archive ID ${arch.id}: ${err.message}`);
      }
    }
  }

  console.log(`\n✅ Done! Archived ${archived} duplicate products.`);
}

main().catch(console.error);

import { config } from "dotenv";
import fs from "fs/promises";
import path from "path";
import { createOdooClient, OdooClient } from "../../src/server/utils/odooClient";

// Load env
const localEnvPath = path.join(process.cwd(), ".env.local");
config({ path: localEnvPath });
config(); // Load .env as fallback

const DATA_FILE = path.join(process.cwd(), "data/flux-dataset.json");

async function main() {
    console.log("🚀 Starting Odoo Image Sync...");

    // 1. Init Odoo
    const odoo = createOdooClient();
    if (!odoo) {
        console.error("❌ Odoo not configured in .env.local");
        process.exit(1);
    }
    console.log("✅ Odoo Client Initialized");

    // 2. Load Dataset
    if (!await fs.stat(DATA_FILE).catch(() => false)) {
        console.error("❌ flux-dataset.json not found.");
        process.exit(1);
    }
    const rawData = JSON.parse(await fs.readFile(DATA_FILE, "utf-8"));
    const products = rawData.products;

    const args = process.argv.slice(2);
    const targetSlug = args.find(a => a.startsWith("--slug="))?.split("=")[1];

    console.log(`📂 Found ${products.length} products in dataset.`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // 3. Iterate
    for (const p of products) {
        if (targetSlug && p.slug !== targetSlug) continue;

        const slug = p.slug;
        const odooId = p.id; // product.template ID

        // We only listen for v1-1.png (Main Image)
        const imagePath = path.join(process.cwd(), "public/products", slug, "v1-1.png");

        try {
            await fs.access(imagePath);
        } catch {
            // Image doesn't exist
            skippedCount++;
            continue;
        }

        console.log(`📤 Syncing [${slug}] (ID: ${odooId})...`);

        try {
            const imageBuffer = await fs.readFile(imagePath);
            const base64Image = imageBuffer.toString("base64");

            // Odoo product.template write
            // Model: product.template
            // Method: write
            // Args: [[id], { image_1920: base64 }]

            // Note: OdooClient.rpc is private?
            // Wait, looking at OdooClient usage in odoo-fetcher, it seems we might need to cast or use public methods.
            // OdooClient.rpc is likely private.
            // But OdooClient has NO public generic write method.
            // I need to check src/server/utils/odooClient.ts access.
            // 'private async rpc' is line 104.
            // However, looking at 'findOrCreatePartner', it calls 'this.rpc'.

            // IF 'rpc' is private, I cannot call it from here.
            // I should verify if I can import it or if I need to extend/hack it.
            // Actually, in TypeScript 'private' creates compile error.
            // Since this is a script using tsx, it might respect it.

            // Workaround: Connect via axios directly using helper or cast to any.
            // (odoo as any).rpc(...)

            // First, get the correct product_tmpl_id
            const prodData = await (odoo as any).searchRead("product.product", [["id", "=", odooId]], ["product_tmpl_id"]);
            if (!prodData || !prodData.length) {
                console.error(`   ❌ Product ${odooId} not found in Odoo (read failed).`);
                errorCount++;
                continue;
            }

            // prodData[0].product_tmpl_id is [id, "Name"]
            const tmplId = prodData[0].product_tmpl_id ? prodData[0].product_tmpl_id[0] : null;

            if (!tmplId) {
                console.error(`   ❌ Could not resolve template ID for product ${odooId}.`);
                errorCount++;
                continue;
            }

            // Write to Template
            await (odoo as any).rpc("product.template", "write", [[tmplId], { image_1920: base64Image }]);

            console.log(`   ✅ Updated.`);
            updatedCount++;

        } catch (err: any) {
            console.error(`   ❌ Failed: ${err.message}`);
            errorCount++;
        }
    }

    console.log(`✨ Sync Complete!`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log(`   Errors:  ${errorCount}`);
}

main();

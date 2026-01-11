import { config } from "dotenv";
import { FluxOdooFetcher } from "./lib/odoo-fetcher";
import { FluxProcessor } from "./lib/processor";
import { FluxStorage } from "./lib/storage";
import { FluxPromptBuilder } from "./lib/prompt-builder";

// Load environment variables immediately
const localEnvPath = require("path").join(process.cwd(), ".env.local");
config({ path: localEnvPath });
config(); // Load .env as fallback/complement

async function main() {
    console.log("🚀 Starting Flux Image Generation Pipeline - Ingestion Phase");

    const fetcher = new FluxOdooFetcher();
    const processor = new FluxProcessor();
    const storage = new FluxStorage();
    const promptBuilder = new FluxPromptBuilder();

    try {
        // 0. Init Prompt Builder
        await promptBuilder.init();

        // 1. Fetch Data
        const [categories, products] = await Promise.all([
            fetcher.fetchCategories(),
            fetcher.fetchProducts()
        ]);

        // 2. Process & Deduplicate
        const cleanDataset = processor.process(products, categories);

        // 3. Generate Prompts for Unique Items
        const datasetWithPrompts = cleanDataset.map(p => {
            const prompts = promptBuilder.generatePrompts(p);
            return {
                ...p,
                fluxPrompt: prompts.main,
                visualSummary: prompts.visualSummary
            };
        });

        console.log(`Generated prompts for ${datasetWithPrompts.length} items.`);

        // 4. Save to Disk
        const payload = {
            meta: {
                generatedAt: new Date().toISOString(),
                totalProducts: products.length,
                uniqueVisuals: datasetWithPrompts.length,
                version: "2.0" // Incremented version
            },
            products: datasetWithPrompts
        };

        await storage.save(payload);

        // EXTRA: Save Review File
        const reviewFile = require("path").join(process.cwd(), "data/catalog-review.json");
        const reviewData = datasetWithPrompts.map(p => ({
            name: p.name,
            slug: p.slug,
            category: p.category,
            visualSummary: p.visualSummary
        }));
        await require("fs/promises").writeFile(reviewFile, JSON.stringify(reviewData, null, 2));

        console.log("✅ Ingestion complete!");
        console.log(`📄 Catalog Review available at: ${reviewFile}`);

    } catch (error) {
        console.error("❌ Fatal error during ingestion:", error);
        process.exit(1);
    }
}

main();

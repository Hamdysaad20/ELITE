import { config } from "dotenv";
import fs from "fs/promises";
import path from "path";
import { FluxGenerator } from "./lib/generator";
import { MockGenerator } from "./lib/mock-generator";
import { FluxPromptBuilder } from "./lib/prompt-builder";

// Load env
config({ path: ".env.local" }); // Load local env for keys

const DATA_FILE = path.join(process.cwd(), "data/flux-dataset.json");

async function main() {
    const args = process.argv.slice(2);
    const isLive = args.includes("--live");
    const isForce = args.includes("--force");
    const targetSlug = args.find(a => a.startsWith("--slug="))?.split("=")[1];

    console.log(`🚀 Starting Image Generation [Mode: ${isLive ? "LIVE ($$$)" : "MOCK (Free)"}]`);
    if (isForce) console.log("⚠️  FORCE MODE: Overwriting existing images.");

    // 1. Load Dataset
    if (!await fs.stat(DATA_FILE).catch(() => false)) {
        console.error("❌ flux-dataset.json not found. Run ingest first.");
        process.exit(1);
    }
    const rawData = JSON.parse(await fs.readFile(DATA_FILE, "utf-8"));
    const products = rawData.products;

    // 2. Init Components
    const generator = isLive ? new FluxGenerator() : new MockGenerator();
    const generatorAny = generator as any; // Type hack for shared interface

    const promptBuilder = new FluxPromptBuilder();
    await promptBuilder.init();

    // 3. Process Loop
    let processedCount = 0;

    for (const p of products) {
        if (targetSlug && p.slug !== targetSlug) continue;

        console.log(`📸 Processing [${p.slug}]...`);

        // Generate Prompts for 3 Variations
        // Expecting p to have full product data from ingest
        const prompts = promptBuilder.generatePrompts(p);

        const variations = [
            { suffix: "v1-1", prompt: prompts.main, logo: true },      // Main: Standard + Logo
            { suffix: "v1-2", prompt: prompts.detail, logo: false }    // Detail: Macro + No Logo
        ];

        for (const v of variations) {
            const fileName = v.suffix;
            const filePath = `public/products/${p.slug}/${fileName}.png`;

            // IDEMPOTENCY CHECK
            if (!isForce) {
                try {
                    await fs.access(path.join(process.cwd(), filePath));
                    continue; // Skip if exists
                } catch {
                    // Generate
                }
            }

            console.log(`   > Generating ${v.suffix} (${isLive ? 'Live' : 'Mock'})...`);

            if (isLive) {
                // FluxGenerator supports applyLogo param
                await (generator as FluxGenerator).generateImage(v.prompt, fileName, p.slug, v.logo);
            } else {
                // MockGenerator ignores extra params usually
                await generatorAny.generateImage(v.prompt, fileName, p.slug);
            }

            processedCount++;
        }
    }

    console.log(`✨ Done! Processed ${processedCount} images.`);
}

async function fileExists(pathStr: string) {
    try {
        await fs.access(pathStr);
        return true;
    } catch {
        return false;
    }
}

main();

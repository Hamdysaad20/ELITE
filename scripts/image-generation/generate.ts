import { config } from "dotenv";
import fs from "fs/promises";
import path from "path";
import { OpenAIGenerator } from "./lib/openai-generator";
import { MockGenerator } from "./lib/mock-generator";
import { FluxPromptBuilder } from "./lib/prompt-builder";
import { ImageValidator } from "./lib/validator";

// Load env
config({ path: ".env.local" }); // Load local env for keys

const DATA_FILE = path.join(process.cwd(), "data/flux-dataset.json");

async function main() {
    const args = process.argv.slice(2);
    const isLive = args.includes("--live");
    const isForce = args.includes("--force");
    const targetSlug = args.find(a => a.startsWith("--slug="))?.split("=")[1];

    console.log(`🚀 Starting Image Generation [Mode: ${isLive ? "LIVE (DALL-E 3 $$$)" : "MOCK (Free)"}]`);
    if (isForce) console.log("⚠️  FORCE MODE: Overwriting existing images.");

    // 1. Load Dataset
    if (!await fs.stat(DATA_FILE).catch(() => false)) {
        console.error("❌ flux-dataset.json not found. Run ingest first.");
        process.exit(1);
    }
    const rawData = JSON.parse(await fs.readFile(DATA_FILE, "utf-8"));
    const products = rawData.products;

    // 2. Init Components
    const generator = isLive ? new OpenAIGenerator() : new MockGenerator();
    const generatorAny = generator as any;
    const validator = new ImageValidator();

    const promptBuilder = new FluxPromptBuilder();
    await promptBuilder.init();

    // 3. Process Loop
    let processedCount = 0;

    for (const p of products) {
        if (targetSlug && p.slug !== targetSlug) continue;

        console.log(`📸 Processing [${p.slug}]...`);

        // Generate Prompts
        const prompts = promptBuilder.generatePrompts(p);

        const variations = [
            { suffix: "v1-1", prompt: prompts.main, logo: true },      // Main: Standard + Logo
            //  { suffix: "v1-2", prompt: prompts.detail, logo: false }    // Detail: Macro + No Logo (Skipping for now to save cost/focus on main)
        ];

        for (const v of variations) {
            const fileName = v.suffix;
            const relativePath = `products/${p.slug}/${fileName}.png`;
            const fullPath = path.join(process.cwd(), "public", relativePath);

            // IDEMPOTENCY CHECK
            if (!isForce) {
                try {
                    await fs.access(fullPath);
                    console.log(`   ⏭️  Skipping existing: ${fileName}`);
                    continue;
                } catch {
                    // Generate
                }
            }

            // RETRY LOOP FOR VALIDATION
            let attempts = 0;
            const maxAttempts = isLive ? 3 : 1;
            let success = false;

            while (attempts < maxAttempts && !success) {
                attempts++;
                console.log(`   > Attempt ${attempts}/${maxAttempts} for ${v.suffix}...`);

                if (isLive) {
                    // 1. Generate
                    await (generator as OpenAIGenerator).generateImage(v.prompt, fileName, p.slug, v.logo);

                    // 2. Validate - DISABLED per user request
                    /*
                    if (v.logo) {
                        // Draw box for debugging/reference (optional, maybe save as _debug.png?)
                        // For now, we validate the generated image directly.
                        // But Validator.drawValidationBox saves to a path.
                        const debugPath = path.join(process.cwd(), "public", `products/${p.slug}/${fileName}_debug.png`);
                        await validator.drawValidationBox(fullPath, debugPath);

                        // Validate
                        const valResult = await validator.validateImage(fullPath, v.prompt, p.baseName);
                        if (valResult.isValid) {
                            console.log(`      ✅ Validation Passed: ${valResult.reason}`);
                            success = true;
                            // Clean up debug file
                            await fs.unlink(debugPath).catch(() => { });
                        } else {
                            console.warn(`      ❌ Validation Failed: ${valResult.reason}`);
                            // If completely failed, we might want to retry.
                            if (attempts < maxAttempts) {
                                console.log("      🔄 Retrying...");
                            } else {
                                console.error("      🛑 Max attempts reached. Keeping the last invalid image.");
                            }
                        }
                    } else {
                        success = true; // No validation for non-logo images for now
                    }
                    */
                    success = true; // Always succeed if validation is disabled

                } else {
                    await generatorAny.generateImage(v.prompt, fileName, p.slug);
                    success = true;
                }
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

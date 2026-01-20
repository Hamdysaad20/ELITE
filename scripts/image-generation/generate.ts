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
    const failedOnly = args.includes("--failed-only");

    console.log(`🚀 Starting Image Generation [Mode: ${isLive ? "LIVE (DALL-E 3 $$$)" : "MOCK (Free)"}]`);
    if (isForce) console.log("⚠️  FORCE MODE: Overwriting existing images.");
    if (failedOnly) console.log("🎯 FAILED-ONLY MODE: Only regenerating products flagged with *_NEEDS_REVIEW.json");

    // 1. Load Dataset
    if (!await fs.stat(DATA_FILE).catch(() => false)) {
        console.error("❌ flux-dataset.json not found. Run ingest first.");
        process.exit(1);
    }
    const rawData = JSON.parse(await fs.readFile(DATA_FILE, "utf-8"));
    let products = rawData.products;

    // Option: process only failed slugs (those with *_NEEDS_REVIEW.json in public/products/<slug>/)
    if (failedOnly) {
        const failedSlugs = await findFailedSlugs();
        if (failedSlugs.size === 0) {
            console.log("✅ No flagged failures found under public/products. Nothing to do.");
            return;
        }
        products = products.filter((p: any) => failedSlugs.has(p.slug));
        console.log(`📌 Found ${failedSlugs.size} failed products. Will process ${products.length} from dataset.`);
    }

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

            // RETRY LOOP FOR VALIDATION WITH ITERATIVE REFINEMENT
            let attempts = 0;
            const maxAttempts = isLive ? 10 : 1;
            let success = false;
            // Track cumulative adjustments across attempts (relative to the base image)
            let currentAdjustment: any = {
                sizeMultiplier: 1.0,
                horizontalOffset: 0,
                verticalOffset: 0,
            };
            let needsManualReview = false;
            let baseImagePath: string | null = null;
            const flagPath = path.join(
                process.cwd(),
                "public/products",
                p.slug,
                `${fileName}_NEEDS_REVIEW.json`,
            );

            while (attempts < maxAttempts && !success) {
                attempts++;
                console.log(`   > Attempt ${attempts}/${maxAttempts} for ${v.suffix}...`);

                if (isLive) {
                    if (attempts === 1) {
                        // First attempt: Generate base image and composite logo
                        // Save base image separately for efficient recomposition on retries
                        const genResult = await (generator as OpenAIGenerator).generateImage(
                            v.prompt, 
                            fileName, 
                            p.slug, 
                            v.logo,
                            undefined, // No adjustment on first attempt
                            true // Save base image separately
                        );

                        if (genResult.error) {
                            console.error(`      ❌ Generation failed: ${genResult.error}`);
                            break;
                        }

                        // Store base image path for potential recomposition
                        if (v.logo && genResult.baseImagePath) {
                            baseImagePath = genResult.baseImagePath;
                        }
                    } else {
                        // Subsequent attempts: Recomposite logo with adjustments (more efficient than regenerating)
                        if (v.logo && baseImagePath && await fileExists(baseImagePath)) {
                            console.log(`      🔄 Recompositing logo with adjustments (using saved base image)...`);
                            await (generator as OpenAIGenerator).compositeOnBaseImage(
                                baseImagePath,
                                fullPath,
                                currentAdjustment
                            );
                        } else if (v.logo) {
                            // Fallback: regenerate if base image not available (shouldn't happen normally)
                            console.log(`      ⚠️  Base image not found, regenerating entire image...`);
                            await (generator as OpenAIGenerator).generateImage(
                                v.prompt, 
                                fileName, 
                                p.slug, 
                                v.logo,
                                currentAdjustment,
                                false // Don't save base on retry
                            );
                        }
                    }

                    // 2. Validate if logo is applied
                    if (v.logo) {
                        const valResult = await validator.validateImage(
                            fullPath, 
                            v.prompt, 
                            p.baseName,
                            attempts
                        );

                        if (valResult.isValid) {
                            console.log(`      ✅ Validation Passed: ${valResult.reason}`);
                            success = true;
                            
                            // Clean up base image and debug files on success
                            if (baseImagePath && await fileExists(baseImagePath)) {
                                await fs.unlink(baseImagePath).catch(() => { });
                            }

                            // If this was previously flagged, remove the flag on success
                            if (await fileExists(flagPath)) {
                                await fs.unlink(flagPath).catch(() => { });
                                console.log(`      🧹 Cleared review flag: ${flagPath}`);
                            }
                            
                            const debugPath = valResult.annotatedImagePath;
                            if (debugPath && attempts === maxAttempts) {
                                // Keep debug file on final attempt for reference
                                console.log(`      📝 Keeping debug image: ${debugPath}`);
                            } else if (debugPath) {
                                // Clean up intermediate debug files
                                await fs.unlink(debugPath).catch(() => { });
                            }
                        } else {
                            console.warn(`      ❌ Validation Failed: ${valResult.reason}`);
                            
                            // Check if we need manual review
                            if (valResult.needsManualReview) {
                                needsManualReview = true;
                            }

                            // If we have adjustments and haven't reached max attempts, retry with adjustments
                            if (valResult.adjustments && attempts < maxAttempts) {
                                // Treat AI suggestions as deltas (relative tweaks) and accumulate.
                                const adj = valResult.adjustments as any;
                                const deltaSize = typeof adj.sizeMultiplier === "number" ? adj.sizeMultiplier : 1.0;
                                const deltaH = typeof adj.horizontalOffset === "number" ? adj.horizontalOffset : 0;
                                const deltaV = typeof adj.verticalOffset === "number" ? adj.verticalOffset : 0;

                                currentAdjustment = {
                                    sizeMultiplier: Math.max(0.5, Math.min(1.5, (currentAdjustment.sizeMultiplier || 1.0) * deltaSize)),
                                    horizontalOffset: Math.max(-250, Math.min(250, (currentAdjustment.horizontalOffset || 0) + deltaH)),
                                    verticalOffset: Math.max(-250, Math.min(250, (currentAdjustment.verticalOffset || 0) + deltaV)),
                                    reason: adj.reason || currentAdjustment.reason,
                                };

                                console.log(`      🔄 Retrying with adjustments (cumulative): ${JSON.stringify(currentAdjustment)}`);
                            } else if (attempts < maxAttempts) {
                                // No adjustments provided but we can still retry
                                console.log(`      🔄 Retrying without specific adjustments...`);
                            } else {
                                // Max attempts reached
                                needsManualReview = true;
                                console.error(`      🛑 Max attempts (${maxAttempts}) reached. Flagging for manual review.`);
                                console.error(`      📝 Debug image saved: ${valResult.annotatedImagePath || 'N/A'}`);
                                
                                // Save a flag file for manual review
                                await fs.writeFile(
                                    flagPath,
                                    JSON.stringify({
                                        slug: p.slug,
                                        fileName: fileName,
                                        reason: valResult.reason,
                                        attempts: attempts,
                                        lastAdjustment: currentAdjustment,
                                        timestamp: new Date().toISOString()
                                    }, null, 2)
                                );
                                console.error(`      🚩 Flag file created: ${flagPath}`);
                            }
                        }
                    } else {
                        // No logo, no validation needed
                        success = true;
                    }

                } else {
                    // Mock mode - no validation
                    await generatorAny.generateImage(v.prompt, fileName, p.slug);
                    success = true;
                }
            }

            // Final status message
            if (needsManualReview && !success) {
                console.log(`   ⚠️  [${p.slug}/${v.suffix}] Requires manual review after ${attempts} attempts`);
            } else if (success) {
                console.log(`   ✅ [${p.slug}/${v.suffix}] Successfully generated and validated`);
            }

            processedCount++;
        }
    }

    console.log(`✨ Done! Processed ${processedCount} images.`);
}

async function findFailedSlugs(): Promise<Set<string>> {
    const out = new Set<string>();
    const productsDir = path.join(process.cwd(), "public/products");
    let entries: any[] = [];
    try {
        entries = await fs.readdir(productsDir, { withFileTypes: true } as any);
    } catch {
        return out;
    }

    for (const ent of entries) {
        if (!ent.isDirectory?.()) continue;
        const slug = ent.name;
        const dir = path.join(productsDir, slug);
        try {
            const files = await fs.readdir(dir);
            if (files.some((f: string) => f.endsWith("_NEEDS_REVIEW.json"))) {
                out.add(slug);
            }
        } catch {
            // ignore
        }
    }

    return out;
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

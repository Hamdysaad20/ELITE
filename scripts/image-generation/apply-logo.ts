import { config } from "dotenv";
import fs from "fs/promises";
import path from "path";
import { FluxPromptBuilder } from "./lib/prompt-builder";
import { LogoCompositor } from "./lib/compositor";
import { ImageValidator } from "./lib/validator";

// Load env (for consistency; not strictly required here)
config({ path: ".env.local" });
config();

const DATA_FILE = path.join(process.cwd(), "data/flux-dataset.json");

async function fileExists(p: string) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const targetSlug = args.find(a => a.startsWith("--slug="))?.split("=")[1];
  const inPlace = !args.includes("--out-suffix=");
  const outSuffix = args.find(a => a.startsWith("--out-suffix="))?.split("=")[1] || "";
  const validate = args.includes("--validate");

  if (!await fileExists(DATA_FILE)) {
    console.error("❌ flux-dataset.json not found. Run ingest first.");
    process.exit(1);
  }

  const rawData = JSON.parse(await fs.readFile(DATA_FILE, "utf-8"));
  const products = rawData.products as any[];

  const promptBuilder = new FluxPromptBuilder();
  await promptBuilder.init();

  const compositor = new LogoCompositor();
  const validator = validate ? new ImageValidator() : null;

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  const normalizeDeltas = (adj: any) => {
    const reasonRaw = String(adj?.reason || "").toLowerCase();
    const out = { ...adj };
    const toNum = (v: any) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
    const vOff = toNum(out.verticalOffset);
    if (typeof vOff === "number" && vOff !== 0) {
      const wantsDown = /\b(down|lower|below)\b/.test(reasonRaw);
      const wantsUp = /\b(up|higher|above)\b/.test(reasonRaw);
      if (wantsDown && vOff < 0) out.verticalOffset = Math.abs(vOff);
      if (wantsUp && vOff > 0) out.verticalOffset = -Math.abs(vOff);
    }
    const hOff = toNum(out.horizontalOffset);
    if (typeof hOff === "number" && hOff !== 0) {
      const wantsLeft = /\b(left)\b/.test(reasonRaw);
      const wantsRight = /\b(right)\b/.test(reasonRaw);
      if (wantsLeft && hOff > 0) out.horizontalOffset = -Math.abs(hOff);
      if (wantsRight && hOff < 0) out.horizontalOffset = Math.abs(hOff);
    }
    return out;
  };

  for (const p of products) {
    if (targetSlug && p.slug !== targetSlug) continue;

    const slug = p.slug;
    const inputPath = path.join(process.cwd(), "public/products", slug, "v1-1.png");
    const backupPath = path.join(process.cwd(), "public/products", slug, "v1-1_no_logo.png");
    const outputPath = inPlace
      ? inputPath
      : path.join(process.cwd(), "public/products", slug, `v1-1${outSuffix}.png`);

    if (!await fileExists(inputPath)) {
      skipped++;
      continue;
    }

    const profile = promptBuilder.isColdProduct(p) ? "iced" : "hot";
    const prompts = promptBuilder.generatePrompts(p);

    try {
      if (inPlace && !await fileExists(backupPath)) {
        await fs.copyFile(inputPath, backupPath);
      }

      const baseBuf = await fs.readFile(inPlace ? backupPath : inputPath);

      // Validation loop (optional)
      let attempts = 0;
      const maxAttempts = validate ? 6 : 1;
      let currentAdj: any = { sizeMultiplier: 1.0, horizontalOffset: 0, verticalOffset: 0 };
      let success = false;

      while (attempts < maxAttempts && !success) {
        attempts++;
        const outBuf = await compositor.composite(baseBuf, currentAdj, profile);
        await fs.writeFile(outputPath, outBuf);

        if (!validate || !validator) {
          success = true;
          break;
        }

        const val = await validator.validateImage(outputPath, prompts.main, p.baseName || p.name || slug, attempts);
        if (val.isValid) {
          success = true;
          // Clear any old flags
          const flagPath = path.join(process.cwd(), "public/products", slug, "v1-1_NEEDS_REVIEW.json");
          await fs.unlink(flagPath).catch(() => {});
          break;
        }

        if (val.adjustments) {
          const adj = normalizeDeltas(val.adjustments as any);
          const dSize = typeof adj.sizeMultiplier === "number" ? adj.sizeMultiplier : 1.0;
          const dH = typeof adj.horizontalOffset === "number" ? adj.horizontalOffset : 0;
          const dV = typeof adj.verticalOffset === "number" ? adj.verticalOffset : 0;
          currentAdj = {
            sizeMultiplier: Math.max(0.5, Math.min(1.5, (currentAdj.sizeMultiplier || 1.0) * dSize)),
            horizontalOffset: Math.max(-250, Math.min(250, (currentAdj.horizontalOffset || 0) + dH)),
            verticalOffset: Math.max(-250, Math.min(250, (currentAdj.verticalOffset || 0) + dV)),
            reason: adj.reason || currentAdj.reason,
          };
        }

        if (attempts === maxAttempts) {
          const flagPath = path.join(process.cwd(), "public/products", slug, "v1-1_NEEDS_REVIEW.json");
          await fs.writeFile(
            flagPath,
            JSON.stringify(
              {
                slug,
                fileName: "v1-1",
                reason: val.reason,
                attempts,
                lastAdjustment: currentAdj,
                timestamp: new Date().toISOString(),
              },
              null,
              2,
            ),
          );
        }
      }

      if (!success) {
        throw new Error("Logo validation did not converge; flagged for review.");
      }

      console.log(
        `✅ Applied logo${validate ? " (validated)" : ""}: [${slug}] (${profile}) -> ${path.relative(process.cwd(), outputPath)}`,
      );
      updated++;
    } catch (e: any) {
      console.error(`❌ Failed: [${slug}] ${e?.message || e}`);
      errors++;
    }
  }

  console.log("✨ Apply-logo complete!");
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Errors:  ${errors}`);
}

main();


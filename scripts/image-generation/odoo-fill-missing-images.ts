import { config } from "dotenv";
import fs from "fs/promises";
import path from "path";
import { createOdooClient } from "@/server/utils/odooClient";
import { FluxPromptBuilder } from "./lib/prompt-builder";
import { FluxGenerator } from "./lib/generator";
import { LogoCompositor } from "./lib/compositor";
import { ImageValidator } from "./lib/validator";

config({ path: path.join(process.cwd(), ".env.local") });
config();

type OdooCategory = {
  id: number;
  name: string;
  display_name?: string;
  parent_id?: [number, string] | number;
};

type OdooTemplate = {
  id: number;
  name: string;
  categ_id?: [number, string] | number;
  list_price?: number;
  sale_ok?: boolean;
  active?: boolean;
};

function slugify(text: string): string {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

function extractBaseName(name: string): string {
  if (!name) return "";
  let base = String(name)
    .replace(/\[.*\]/g, "")
    .replace(/single|double|triple|regular|large|small/gi, "")
    .trim();
  if (/\(\s*iced\s*\)/i.test(base)) {
    base = "Iced " + base.replace(/\(\s*iced\s*\)/i, "");
  }
  base = base.replace(/\(\s*hot\s*\)/i, "");
  base = base.replace(/\(.*\)/g, "").trim();
  return base.replace(/\s+/g, " ").trim();
}

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
  const dryRun = args.includes("--dry-run");
  const limitArg = args.find((a) => a.startsWith("--limit="))?.split("=")[1];
  const limit = limitArg ? Number(limitArg) : undefined;
  const onlySlug = args.find((a) => a.startsWith("--slug="))?.split("=")[1];
  const validateLogo = !args.includes("--no-validate-logo");
  const includeHasImage = args.includes("--include-has-image");
  const skipRegex = /(tip|tips|plate|deposit|delivery|fee|service)/i;

  const odoo = createOdooClient();
  if (!odoo) {
    console.error("❌ Odoo not configured in .env.local");
    process.exit(1);
  }

  console.log("🚀 Odoo Fill Missing Images");
  console.log(`   dryRun=${dryRun} validateLogo=${validateLogo} limit=${limit ?? "∞"} slug=${onlySlug ?? "ALL"}`);

  // Categories (for better drink/food heuristics)
  const categories = await odoo.searchRead<OdooCategory>(
    "product.category",
    [],
    ["id", "name", "display_name", "parent_id"],
  );
  const catById = new Map<number, OdooCategory>();
  for (const c of categories) catById.set(c.id, c);

  // Find templates missing image_1920
  const domain: any[] = [
    ["sale_ok", "=", true],
    ["active", "=", true],
  ];
  if (!includeHasImage) {
    domain.push(["image_1920", "=", false]);
  }

  const fields = ["id", "name", "categ_id", "list_price", "sale_ok", "active"];
  const templates = await odoo.searchReadPaginated<OdooTemplate>(
    "product.template",
    domain,
    fields,
    1000,
  );

  let missing = templates;
  // Skip non-visual utility items (tips, fees, plates, deposits, delivery, etc.)
  missing = missing.filter((t) => !skipRegex.test(String(t.name || "")));
  if (onlySlug) {
    missing = missing.filter((t) => slugify(t.name) === onlySlug);
  }
  if (typeof limit === "number" && Number.isFinite(limit) && limit > 0) {
    missing = missing.slice(0, limit);
  }

  console.log(`📌 Found ${missing.length} product.template records missing image_1920.`);
  if (dryRun) {
    console.log("🧪 Dry run: listing first 25:");
    for (const t of missing.slice(0, 25)) {
      console.log(`- [${t.id}] ${t.name}`);
    }
    return;
  }

  const promptBuilder = new FluxPromptBuilder();
  await promptBuilder.init();

  const generator = new FluxGenerator();
  const compositor = new LogoCompositor();
  const validator = validateLogo ? new ImageValidator() : null;

  let generated = 0;
  let synced = 0;
  let skipped = 0;
  let errors = 0;

  for (const t of missing) {
    const name = t.name;
    const slug = slugify(name);
    const catId = Array.isArray(t.categ_id) ? t.categ_id[0] : (t.categ_id as number | undefined);
    const cat = catId ? catById.get(catId) : undefined;
    const categoryName = (cat?.name || cat?.display_name || "Unknown") as string;

    const product: any = {
      id: String(t.id), // template id
      name,
      slug,
      category: categoryName,
      attributes: {},
      baseName: extractBaseName(name),
    };

    const prompts = promptBuilder.generatePrompts(product);
    const logoProfile = promptBuilder.isColdProduct(product) ? "iced" : "hot";
    const isFood = promptBuilder.isFoodProduct(product);

    const outDir = path.join(process.cwd(), "public/products", slug);
    const outPath = path.join(outDir, "v1-1.png");
    const basePath = path.join(outDir, "v1-1_no_logo.png");

    try {
      await fs.mkdir(outDir, { recursive: true });

      // 1) Generate NO-LOGO base (we always generate without baked branding)
      const genRes = await generator.generateImage(prompts.main, "v1-1", slug, false);
      if (genRes.error) {
        console.error(`❌ Generation failed [${slug}]: ${genRes.error}`);
        errors++;
        continue;
      }
      generated++;

      // FOOD: keep as-is (plated), do NOT apply cup logo overlay
      if (isFood) {
        // Sync the generated plated image directly to Odoo
        const buf = await fs.readFile(outPath);
        const b64 = buf.toString("base64");
        await (odoo as any).rpc("product.template", "write", [[t.id], { image_1920: b64 }]);
        synced++;
        console.log(`✅ Generated + synced (food/plate): [${t.id}] ${slug}`);
        continue;
      }

      // Keep a copy as no-logo base (for drinks)
      await fs.copyFile(outPath, basePath);

      // 2) Apply logo (+ optional validation loop)
      const baseBuf = await fs.readFile(basePath);
      const shouldValidateLogo = validateLogo;
      if (!shouldValidateLogo || !validator) {
        const composited = await compositor.composite(baseBuf, undefined, logoProfile);
        await fs.writeFile(outPath, composited);
      } else {
        let attempts = 0;
        const maxAttempts = 6;
        let adj: any = { sizeMultiplier: 1.0, horizontalOffset: 0, verticalOffset: 0 };
        let ok = false;

        const normalizeDeltas = (raw: any) => {
          const reasonRaw = String(raw?.reason || "").toLowerCase();
          const out = { ...raw };
          const v = typeof out.verticalOffset === "number" ? out.verticalOffset : 0;
          const h = typeof out.horizontalOffset === "number" ? out.horizontalOffset : 0;
          if (/\b(down|lower|below)\b/.test(reasonRaw) && v < 0) out.verticalOffset = Math.abs(v);
          if (/\b(up|higher|above)\b/.test(reasonRaw) && v > 0) out.verticalOffset = -Math.abs(v);
          if (/\b(left)\b/.test(reasonRaw) && h > 0) out.horizontalOffset = -Math.abs(h);
          if (/\b(right)\b/.test(reasonRaw) && h < 0) out.horizontalOffset = Math.abs(h);
          return out;
        };

        while (attempts < maxAttempts && !ok) {
          attempts++;
          const composited = await compositor.composite(baseBuf, adj, logoProfile);
          await fs.writeFile(outPath, composited);

          const val = await validator.validateImage(outPath, prompts.main, product.baseName || name, attempts);
          if (val.isValid) {
            ok = true;
            break;
          }
          if (val.adjustments) {
            const d = normalizeDeltas(val.adjustments as any);
            const dSize = typeof d.sizeMultiplier === "number" ? d.sizeMultiplier : 1.0;
            const dH = typeof d.horizontalOffset === "number" ? d.horizontalOffset : 0;
            const dV = typeof d.verticalOffset === "number" ? d.verticalOffset : 0;
            adj = {
              sizeMultiplier: Math.max(0.5, Math.min(1.5, (adj.sizeMultiplier || 1.0) * dSize)),
              horizontalOffset: Math.max(-250, Math.min(250, (adj.horizontalOffset || 0) + dH)),
              verticalOffset: Math.max(-250, Math.min(250, (adj.verticalOffset || 0) + dV)),
              reason: d.reason || adj.reason,
            };
          }
        }

        if (!ok) {
          const flagPath = path.join(outDir, "v1-1_NEEDS_REVIEW.json");
          await fs.writeFile(
            flagPath,
            JSON.stringify(
              {
                slug,
                fileName: "v1-1",
                reason: "Logo validation did not converge",
                attempts,
                lastAdjustment: adj,
                timestamp: new Date().toISOString(),
              },
              null,
              2,
            ),
          );
          console.warn(`⚠️ Logo validation did not converge for [${slug}]. Flagged for review.`);
        }
      }

      // 3) Sync to Odoo template
      const buf = await fs.readFile(outPath);
      const b64 = buf.toString("base64");
      await (odoo as any).rpc("product.template", "write", [[t.id], { image_1920: b64 }]);
      synced++;

      console.log(`✅ Generated + synced: [${t.id}] ${slug} (${logoProfile})`);
    } catch (e: any) {
      console.error(`❌ Failed [${slug}]: ${e?.message || e}`);
      errors++;
      continue;
    }
  }

  console.log("✨ Done!");
  console.log(`   Generated: ${generated}`);
  console.log(`   Synced:    ${synced}`);
  console.log(`   Skipped:   ${skipped}`);
  console.log(`   Errors:    ${errors}`);
}

main();


import axios from "axios";
import fs from "fs/promises";
import path from "path";
import { LogoCompositor } from "./compositor";
import type { LogoAdjustment } from "./validator";
import type { LogoProfile } from "./compositor";

interface GenerationResult {
    url?: string;
    error?: string;
    prompt: string;
}

export class FluxGenerator {
    private static lastRequestAtMs = 0;
    private endpoint: string;
    private apiKey: string;
    private model: string;
    private minIntervalMs: number;
    private outputDir: string;
    private compositor: LogoCompositor;

    constructor() {
        this.endpoint = process.env.AZURE_FLUX_ENDPOINT || "";
        this.apiKey = process.env.AZURE_FLUX_KEY || "";
        this.model =
            process.env.AZURE_FLUX_MODEL ||
            process.env.FLUX_MODEL ||
            "flux.2-pro";
        // Your Azure deployment shows 4 requests/minute → ~15s between requests.
        // Add a small safety buffer to reduce 429s during batch regen.
        const envMin = Number(process.env.AZURE_FLUX_MIN_INTERVAL_MS || process.env.FLUX_MIN_INTERVAL_MS);
        this.minIntervalMs = Number.isFinite(envMin) && envMin > 0 ? envMin : 16_000;
        this.outputDir = path.join(process.cwd(), "public/products");
        this.compositor = new LogoCompositor();

        if (!this.endpoint || !this.apiKey) {
            console.warn("⚠️ AZURE_FLUX_ENDPOINT or AZURE_FLUX_KEY is missing. Generator will fail.");
        }
    }

    private async throttle() {
        const now = Date.now();
        const elapsed = now - FluxGenerator.lastRequestAtMs;
        const waitMs = this.minIntervalMs - elapsed;
        if (waitMs > 0) {
            await new Promise<void>(resolve => setTimeout(resolve, waitMs));
        }
        FluxGenerator.lastRequestAtMs = Date.now();
    }

    async generateImage(
        prompt: string,
        fileName: string,
        slug: string,
        applyLogo: boolean = true,
        adjustment?: LogoAdjustment,
        saveBaseImage: boolean = false,
        logoProfile: LogoProfile = "hot",
    ): Promise<GenerationResult & { baseImagePath?: string }> {
        console.log(`🎨 Generating image for [${slug}] (${applyLogo ? "With Logo" : "No Logo"})...`);

        try {
            await this.throttle();

            // Azure BlackForestLabs payload (matches portal curl sample)
            const payload = {
                prompt: prompt,
                model: this.model,
                width: 1024,
                height: 1024,
                n: 1
            };

            const response = await axios.post(this.endpoint, payload, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.apiKey}`
                }
            });

            // Azure AI Response (some endpoints return b64_json, others return a URL)
            const relativePath = `products/${slug}/${fileName}.png`;
            const fullPath = path.join(this.outputDir, `${slug}/${fileName}.png`);

            let baseImagePath: string | undefined;
            if (saveBaseImage && applyLogo) {
                baseImagePath = path.join(this.outputDir, `${slug}/${fileName}_base.png`);
            }

            const b64 = response.data?.data?.[0]?.b64_json;
            const url = response.data?.data?.[0]?.url;

            if (typeof b64 === "string" && b64.length > 0) {
                await this.saveBase64(b64, fullPath, applyLogo, adjustment, baseImagePath, logoProfile);
                return { url: relativePath, prompt, baseImagePath };
            }

            if (typeof url === "string" && url.length > 0) {
                await this.downloadAndSave(url, fullPath, applyLogo, adjustment, baseImagePath, logoProfile);
                return { url: relativePath, prompt, baseImagePath };
            }

            throw new Error(`Unknown response format: ${JSON.stringify(response.data).substring(0, 200)}...`);

        } catch (error: any) {
            console.error(`❌ Generation failed for [${slug}]:`, error?.response?.data || error.message);
            // Fallback to Kontext Pro logic could go here if implemented
            return { error: error.message, prompt };
        }
    }

    /**
     * Composites the logo on an existing (base) image with adjustments.
     * This is used by the retry loop in `generate.ts` to avoid re-generating.
     */
    async compositeOnBaseImage(
        baseImagePath: string,
        outputPath: string,
        adjustment?: LogoAdjustment,
        logoProfile: LogoProfile = "hot",
    ): Promise<void> {
        const baseBuffer = await fs.readFile(baseImagePath);
        const compositedBuffer = await this.compositor.composite(baseBuffer, adjustment, logoProfile);
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.writeFile(outputPath, compositedBuffer);
    }

    private async saveBase64(
        base64Data: string,
        destPath: string,
        applyLogo: boolean,
        adjustment?: LogoAdjustment,
        baseImagePath?: string,
        logoProfile: LogoProfile = "hot",
    ) {
        await fs.mkdir(path.dirname(destPath), { recursive: true });

        const buffer: Buffer = Buffer.from(base64Data, "base64");

        // Save base image (no logo) if requested
        if (baseImagePath) {
            await fs.mkdir(path.dirname(baseImagePath), { recursive: true });
            await fs.writeFile(baseImagePath, buffer);
        }

        let outBuffer = buffer;

        // Apply Logo Overlay ONLY if requested
        if (applyLogo) {
            outBuffer = await this.compositor.composite(outBuffer, adjustment, logoProfile);
        }

        await fs.writeFile(destPath, outBuffer);
    }

    private async downloadAndSave(
        url: string,
        destPath: string,
        applyLogo: boolean,
        adjustment?: LogoAdjustment,
        baseImagePath?: string,
        logoProfile: LogoProfile = "hot",
    ) {
        await fs.mkdir(path.dirname(destPath), { recursive: true });

        const response = await axios({ url, responseType: "arraybuffer" });
        const buffer: Buffer = Buffer.from(response.data);

        // Save base image (no logo) if requested
        if (baseImagePath) {
            await fs.mkdir(path.dirname(baseImagePath), { recursive: true });
            await fs.writeFile(baseImagePath, buffer);
        }

        let outBuffer = buffer;

        // Apply Logo Overlay ONLY if requested
        if (applyLogo) {
            outBuffer = await this.compositor.composite(outBuffer, adjustment, logoProfile);
        }

        await fs.writeFile(destPath, outBuffer);
    }
}

import axios from "axios";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { LogoCompositor } from "./compositor";

interface GenerationResult {
    url?: string;
    error?: string;
    prompt: string;
}

export class FluxGenerator {
    private endpoint: string;
    private apiKey: string;
    private outputDir: string;
    private compositor: LogoCompositor;

    constructor() {
        this.endpoint = process.env.AZURE_FLUX_ENDPOINT || "";
        this.apiKey = process.env.AZURE_FLUX_KEY || "";
        this.outputDir = path.join(process.cwd(), "public/products");
        this.compositor = new LogoCompositor();

        if (!this.endpoint || !this.apiKey) {
            console.warn("⚠️ AZURE_FLUX_ENDPOINT or AZURE_FLUX_KEY is missing. Generator will fail.");
        }
    }

    async generateImage(prompt: string, fileName: string, slug: string, applyLogo: boolean = true): Promise<GenerationResult> {
        console.log(`🎨 Generating image for [${slug}] (${applyLogo ? "With Logo" : "No Logo"})...`);

        try {
            // Azure AI FLUX.2-pro Payload based on user documentation
            const payload = {
                prompt: prompt,
                model: "flux.2-pro", // Exact string from docs
                size: "1024x1024",
                n: 1
            };

            const response = await axios.post(this.endpoint, payload, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.apiKey}`
                }
            });

            // Azure AI Response (curl example shows piping .data[0].b64_json)
            let base64Image = "";

            if (response.data?.data?.[0]?.b64_json) {
                base64Image = response.data.data[0].b64_json;
            } else if (response.data?.data?.[0]?.url) {
                const url = response.data.data[0].url;
                await this.downloadAndSave(url, path.join(process.cwd(), "public/products", `products/${slug}/${fileName}.png`), applyLogo);
                return { url: `products/${slug}/${fileName}.png`, prompt };
            } else {
                throw new Error(`Unknown response format: ${JSON.stringify(response.data).substring(0, 200)}...`);
            }

            // Save Base64
            const relativePath = `products/${slug}/${fileName}.png`;
            const fullPath = path.join(process.cwd(), "public/products", `${slug}/${fileName}.png`);

            await this.saveBase64(base64Image, fullPath, applyLogo);

            return { url: relativePath, prompt };

        } catch (error: any) {
            console.error(`❌ Generation failed for [${slug}]:`, error?.response?.data || error.message);
            // Fallback to Kontext Pro logic could go here if implemented
            return { error: error.message, prompt };
        }
    }

    private async saveBase64(base64Data: string, destPath: string, applyLogo: boolean) {
        await fs.mkdir(path.dirname(destPath), { recursive: true });

        let buffer: Buffer = Buffer.from(base64Data, 'base64');

        // Apply Logo Overlay ONLY if requested
        if (applyLogo) {
            buffer = await this.compositor.composite(buffer);
        }

        await fs.writeFile(destPath, buffer);
    }

    private async downloadAndSave(url: string, destPath: string, applyLogo: boolean) {
        await fs.mkdir(path.dirname(destPath), { recursive: true });

        const response = await axios({ url, responseType: "arraybuffer" });
        let buffer: Buffer = Buffer.from(response.data);

        // Apply Logo Overlay ONLY if requested
        if (applyLogo) {
            buffer = await this.compositor.composite(buffer as Buffer);
        }

        await fs.writeFile(destPath, buffer);
    }
}

import axios from "axios";
import fs from "fs/promises";
import path from "path";
import { LogoCompositor } from "./compositor";
import { LogoAdjustment } from "./validator";
import type { LogoProfile } from "./compositor";

interface GenerationResult {
    url?: string;
    error?: string;
    prompt: string;
}

export class OpenAIGenerator {
    private apiKey: string;
    private outputDir: string;
    private compositor: LogoCompositor;

    constructor() {
        this.apiKey = process.env.AZURE_OPENAI_API_KEY || process.env.OPENAI_API_KEY || "";
        if (!this.apiKey) {
            console.warn("⚠️ AZURE_OPENAI_API_KEY/OPENAI_API_KEY is missing. Generator will fail.");
        }
        this.outputDir = path.join(process.cwd(), "public/products");
        this.compositor = new LogoCompositor();
    }

    private normalizeAzureEndpoint(endpoint: string): string {
        let base = endpoint.trim().replace(/\/+$/, "");
        if (base.endsWith("/openai")) base = base.slice(0, -"/openai".length);
        return base;
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
            let url = "https://api.openai.com/v1/images/generations";
            let headers: Record<string, string> = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.apiKey}`
            };

            const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
            const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT_DALLE || "dall-e-3"; // or "dalle3"

            if (azureEndpoint) {
                // Azure OpenAI format
                // https://{resource}.openai.azure.com/openai/deployments/{deployment}/images/generations?api-version={version}
                const apiVersion = process.env.AZURE_OPENAI_API_VERSION_IMAGES || "2024-02-01";
                // Ensure endpoint doesn't end with slash
                const baseUrl = this.normalizeAzureEndpoint(azureEndpoint);
                url = `${baseUrl}/openai/deployments/${azureDeployment}/images/generations?api-version=${apiVersion}`;

                headers = {
                    "Content-Type": "application/json",
                    "api-key": this.apiKey
                };
                console.log(`   > Using Azure OpenAI: ${azureDeployment}`);
            } else {
                console.log(`   > Using Standard OpenAI`);
            }

            const response = await axios.post(
                url,
                {
                    model: azureEndpoint ? undefined : "dall-e-3", // Azure infers model from deployment
                    prompt: prompt,
                    n: 1,
                    size: "1024x1024",
                    response_format: "b64_json",
                    quality: "hd",
                    style: "vivid"
                },
                { headers }
            );

            const base64Image = response.data?.data?.[0]?.b64_json || response.data?.data?.[0]?.url; // Fallback handle URL if needed (though we asked for b64)

            if (!base64Image) {
                throw new Error("No image data returned from OpenAI");
            }

            // Save Base64
            const relativePath = `products/${slug}/${fileName}.png`;
            const fullPath = path.join(process.cwd(), "public/products", `${slug}/${fileName}.png`);

            // Save base image separately if requested (for efficient recomposition)
            let baseImagePath: string | undefined;
            if (saveBaseImage && applyLogo) {
                baseImagePath = path.join(process.cwd(), "public/products", `${slug}/${fileName}_base.png`);
                await this.saveBaseImage(base64Image, baseImagePath);
            }

            await this.saveBase64(base64Image, fullPath, applyLogo, adjustment, logoProfile);

            return { url: relativePath, prompt, baseImagePath };

        } catch (error: any) {
            console.error(`❌ Generation failed for [${slug}]:`, error?.response?.data || error.message);
            return { error: error.message, prompt };
        }
    }

    private async saveBase64(
        base64Data: string, 
        destPath: string, 
        applyLogo: boolean,
        adjustment?: LogoAdjustment,
        logoProfile: LogoProfile = "hot",
    ) {
        await fs.mkdir(path.dirname(destPath), { recursive: true });

        let buffer: Buffer = Buffer.from(base64Data, 'base64');

        // Apply Logo Overlay ONLY if requested
        if (applyLogo) {
            buffer = await this.compositor.composite(buffer, adjustment, logoProfile);
        }

        await fs.writeFile(destPath, buffer);
    }

    /**
     * Recomposites the logo on an existing image with adjustments.
     * This is more efficient than regenerating the entire image.
     */
    async recompositeLogo(
        imagePath: string,
        adjustment: LogoAdjustment
    ): Promise<void> {
        console.log(`   🔧 Recompositing logo with adjustments...`);
        
        try {
            const imageBuffer = await fs.readFile(imagePath);
            // Remove existing logo by using the base image (we'll need to save base separately)
            // For now, we'll composite on top - this might cause double logos
            // Better approach: save base image separately on first generation
            const compositedBuffer = await this.compositor.composite(imageBuffer, adjustment);
            await fs.writeFile(imagePath, compositedBuffer);
        } catch (error: any) {
            console.error(`   ❌ Recomposition failed:`, error.message);
            throw error;
        }
    }

    /**
     * Saves the base image (without logo) for later recomposition
     */
    async saveBaseImage(base64Data: string, baseImagePath: string): Promise<void> {
        await fs.mkdir(path.dirname(baseImagePath), { recursive: true });
        const buffer = Buffer.from(base64Data, 'base64');
        await fs.writeFile(baseImagePath, buffer);
    }

    /**
     * Composites logo on a saved base image
     */
    async compositeOnBaseImage(
        baseImagePath: string,
        outputPath: string,
        adjustment?: LogoAdjustment,
        logoProfile: LogoProfile = "hot",
    ): Promise<void> {
        const baseBuffer = await fs.readFile(baseImagePath);
        const compositedBuffer = await this.compositor.composite(baseBuffer, adjustment, logoProfile);
        await fs.writeFile(outputPath, compositedBuffer);
    }
}

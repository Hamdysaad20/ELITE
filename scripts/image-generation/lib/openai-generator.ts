import axios from "axios";
import fs from "fs/promises";
import path from "path";
import { LogoCompositor } from "./compositor";

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

    async generateImage(prompt: string, fileName: string, slug: string, applyLogo: boolean = true): Promise<GenerationResult> {
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
                const apiVersion = "2024-02-01";
                // Ensure endpoint doesn't end with slash
                const baseUrl = azureEndpoint.replace(/\/+$/, "");
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

            await this.saveBase64(base64Image, fullPath, applyLogo);

            return { url: relativePath, prompt };

        } catch (error: any) {
            console.error(`❌ Generation failed for [${slug}]:`, error?.response?.data || error.message);
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
}

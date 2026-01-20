import axios from "axios";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

interface ValidationResult {
    isValid: boolean;
    reason: string;
    annotatedImagePath?: string;
}

export class ImageValidator {
    private apiKey: string;
    private outputDir: string;

    constructor() {
        this.apiKey = process.env.AZURE_OPENAI_API_KEY || process.env.OPENAI_API_KEY || "";
        if (!this.apiKey) {
            console.warn("⚠️ AZURE_OPENAI_API_KEY/OPENAI_API_KEY is missing. Validator will fail.");
        }
        this.outputDir = path.join(process.cwd(), "public/products");
    }

    /**
     * Draws a red bounding box around the expected subject area or logo area.
     * For now, we draw a box in the center where the logo usually goes to visualize the target area.
     * Or better: we draw a box around the entire subject if detected/trimmed, or just a static "safe zone".
     * The prompt asked: "drow red box and we validate it with ai to see if it was the right placment"
     */
    async drawValidationBox(imagePath: string, destPath: string): Promise<void> {
        try {
            const image = sharp(imagePath);
            const metadata = await image.metadata();
            const width = metadata.width || 1024;
            const height = metadata.height || 1024;

            // Define the "Ideal Logo Zone" (e.g., center-ish)
            // Based on Compositor logic: Center horizontally, slightly lower than center vertically
            const boxWidth = Math.round(width * 0.40); // 40% width
            const boxHeight = Math.round(boxWidth); // Square-ish or following logo aspect
            const left = Math.round((width - boxWidth) / 2);
            const top = Math.round((height - boxHeight) / 2) + Math.round(height * 0.10);

            // Create a generic SVG rectangle to overlay
            const svgRect = `
                <svg width="${width}" height="${height}">
                    <rect x="${left}" y="${top}" width="${boxWidth}" height="${boxHeight}" 
                          style="fill:none;stroke:red;stroke-width:5" />
                </svg>
            `;

            await image
                .composite([{ input: Buffer.from(svgRect), blend: 'over' }])
                .toFile(destPath);

        } catch (error) {
            console.error("Error drawing validation box:", error);
            // Copy original if fail
            await fs.copyFile(imagePath, destPath);
        }
    }

    async validateImage(imagePath: string, prompt: string, baseName: string): Promise<ValidationResult> {
        console.log(`🔍 Validating image for [${baseName}]...`);

        try {
            // Read image as base64
            const imageBuffer = await fs.readFile(imagePath);
            const base64Image = imageBuffer.toString('base64');
            const dataUrl = `data:image/png;base64,${base64Image}`;

            const checkPrompt = `
You are a Quality Assurance AI for a premium coffee shop.
We have generated an image of a drink: "${baseName}".
A Red Box has been drawn on the image to indicate the ideal logo placement area (center of the cup).

Please validate the following:
1. **Logo Placement**: Is the logo (if present) reasonably inside or near the red box? It should not be floating in the air or off-center.
2. **Consistency**: Does the image look like a high-quality product photo?
3. **Constraints**: 
    - NO whole fruits laying around (only slices or purees inside/on top).
    - NO cherries.
    - NO raw ingredients disjointed from the drink.
4. **Specifics**: 
    - If it is a Frappe, does it have drizzle? 
    - If it is a Milkshake (Vanilla), does it have sparkles?

Return your response in JSON format:
{
    "isValid": boolean,
    "reason": "Short explanation of failure or success"
}
`;

            const payload = {
                model: "gpt-4o",
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: checkPrompt },
                            {
                                type: "image_url",
                                image_url: {
                                    url: dataUrl
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 300,
                response_format: { type: "json_object" }
            };

            let url = "https://api.openai.com/v1/chat/completions";
            let headers: Record<string, string> = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.apiKey}`
            };

            const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
            const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT_GPT4 || "gpt-4o";

            if (azureEndpoint) {
                const apiVersion = "2024-02-15-preview";
                const baseUrl = azureEndpoint.replace(/\/+$/, "");
                url = `${baseUrl}/openai/deployments/${azureDeployment}/chat/completions?api-version=${apiVersion}`;

                headers = {
                    "Content-Type": "application/json",
                    "api-key": this.apiKey
                };
                // Azure doesn't strictly need 'model' in payload if deployment covers it, but keeping it usually harmless.
                // Actually sometimes it complains. Let's delete it for Azure if possible, or keep it.
                // Some Azure versions ignore it, some don't.
            }

            const response = await axios.post(url, payload, { headers });

            const content = response.data?.choices?.[0]?.message?.content;
            if (!content) throw new Error("No validation response");

            const result = JSON.parse(content);
            return {
                isValid: result.isValid,
                reason: result.reason
            };

        } catch (error: any) {
            console.error("❌ Validation error:", error?.response?.data || error.message);
            return { isValid: false, reason: "Validation process failed: " + (error?.response?.data?.error?.message || error.message) };
        }
    }
}

import axios from "axios";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

interface ValidationResult {
    isValid: boolean;
    reason: string;
    annotatedImagePath?: string;
    adjustments?: LogoAdjustment;
    needsManualReview?: boolean;
}

export interface LogoAdjustment {
    sizeMultiplier?: number; // 0.8 = 20% smaller, 1.2 = 20% larger
    horizontalOffset?: number; // pixels to shift left (-) or right (+)
    verticalOffset?: number; // pixels to shift up (-) or down (+)
    reason?: string;
}

export class ImageValidator {
    private apiKey: string;
    private outputDir: string;
    private isAzure: boolean;
    private azureEndpoint?: string;
    private azureChatDeployment?: string;

    constructor() {
        this.apiKey = process.env.AZURE_OPENAI_API_KEY || process.env.OPENAI_API_KEY || "";
        if (!this.apiKey) {
            console.warn("⚠️ AZURE_OPENAI_API_KEY/OPENAI_API_KEY is missing. Validator will fail.");
        }
        this.outputDir = path.join(process.cwd(), "public/products");
        this.azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
        this.azureChatDeployment =
            process.env.AZURE_OPENAI_DEPLOYMENT_CHAT ||
            process.env.AZURE_OPENAI_DEPLOYMENT_GPT4O ||
            process.env.AZURE_OPENAI_DEPLOYMENT_GPT4 ||
            process.env.AZURE_OPENAI_DEPLOYMENT_GPT41 ||
            undefined;
        this.isAzure = Boolean(this.azureEndpoint);
    }

    private normalizeAzureEndpoint(endpoint: string): string {
        // Accept either:
        // - https://{resource}.openai.azure.com/
        // - https://{resource}.cognitiveservices.azure.com/
        // And tolerate users pasting ".../openai/..." variants.
        let base = endpoint.trim().replace(/\/+$/, "");
        // If someone provides ".../openai", strip it so we can append "/openai/deployments/..."
        if (base.endsWith("/openai")) base = base.slice(0, -"/openai".length);
        return base;
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

            // Define the "Ideal Logo Zone" (must match compositor's cup-body safe zone)
            // Compositor fallback subjectBox:
            //   left = 0.22w, top = 0.20h, width = 0.56w, height = 0.70h
            // Compositor logo center:
            //   y = top + 0.60 * height  => 0.20h + 0.42h = 0.62h
            // Logo width baseline:
            //   0.30 * subjectBox.width => 0.30 * 0.56w = 0.168w
            // So we draw a slightly-larger "ideal zone" around it (~0.20w).
            const boxWidth = Math.round(width * 0.20); // ~20% width
            const boxHeight = Math.round(boxWidth); // square-ish (logo mark)
            const left = Math.round((width - boxWidth) / 2);
            const centerY = Math.round(height * 0.62);
            const top = Math.round(centerY - boxHeight / 2);

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

    async validateImage(
        imagePath: string, 
        prompt: string, 
        baseName: string,
        attemptNumber: number = 1
    ): Promise<ValidationResult> {
        console.log(`🔍 Validating image for [${baseName}] (Attempt ${attemptNumber})...`);

        try {
            // First, draw the validation box to show expected logo area
            const debugPath = path.join(
                path.dirname(imagePath),
                path.basename(imagePath, '.png') + '_debug.png'
            );
            await this.drawValidationBox(imagePath, debugPath);

            // Read image as base64
            const imageBuffer = await fs.readFile(imagePath);
            const base64Image = imageBuffer.toString('base64');
            const dataUrl = `data:image/png;base64,${base64Image}`;

            // Read debug image (with red box) for validation
            const debugBuffer = await fs.readFile(debugPath);
            const debugBase64 = debugBuffer.toString('base64');
            const debugDataUrl = `data:image/png;base64,${debugBase64}`;

            const checkPrompt = `
You are a Quality Assurance AI for a premium coffee shop.
We have generated an image of a drink: "${baseName}".

I will show you TWO images:
1. The original generated image
2. The same image with a RED BOUNDING BOX indicating where the logo SHOULD be placed (center of the cup)

Your task is to validate the logo placement:

**CRITICAL VALIDATION CRITERIA:**
1. **Logo Position**: 
   - Is the logo (the black/white sticker with "ELITE" text) INSIDE the red bounding box?
   - Is the logo positioned on the CUP itself (not floating in air, not on background)?
   - Is the logo within the cup's borders (not extending beyond the cup edges)?

2. **Logo Size**:
   - Judge size relative to the RED BOX (the box represents the intended logo zone).
   - The logo should typically occupy about **60–95% of the red box width** (not tiny, not overflowing).
   - It should still look reasonable relative to the cup width (roughly 30–50% of the cup's visible body width).

3. **Visual Quality**:
   - Does the image look like a high-quality product photo?
   - Is the logo clearly visible and readable?

4. **Content Constraints**: 
   - NO whole fruits laying around (only slices or purees inside/on top).
   - NO cherries.
   - NO raw ingredients disjointed from the drink.

5. **Product-Specific Checks**: 
   - If it is a Frappe, does it have drizzle? 
   - If it is a Milkshake (Vanilla), does it have sparkles?

**IMPORTANT**: If the logo placement or size is incorrect, provide specific adjustment recommendations.

Return your response in JSON format:
{
    "isValid": boolean,
    "reason": "Detailed explanation of validation result",
    "logoDetected": boolean,
    "logoInsideBox": boolean,
    "logoOnCup": boolean,
    "logoSizeReasonable": boolean,
    "adjustments": {
        "sizeMultiplier": number (0.7-1.3, where 1.0 = no change, 0.8 = make 20% smaller, 1.2 = make 20% larger),
        "horizontalOffset": number (pixels to shift: negative = left, positive = right, 0 = no change),
        "verticalOffset": number (pixels to shift: negative = up, positive = down, 0 = no change),
        "reason": "Why these adjustments are needed"
    }
}

If isValid is false, you MUST provide adjustments. If isValid is true, adjustments can be null or empty.
`;

            const payload: any = {
                // NOTE: For Azure OpenAI Chat Completions, "model" should NOT be set (deployment determines it).
                // For standard OpenAI, we keep a reasonable default.
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
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: debugDataUrl
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 500,
                response_format: { type: "json_object" }
            };

            let url = "https://api.openai.com/v1/chat/completions";
            let headers: Record<string, string> = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.apiKey}`
            };

            if (this.isAzure) {
                // Your deployment UI shows:
                // https://{resource}.cognitiveservices.azure.com/openai/deployments/{deployment}/chat/completions?api-version=2025-01-01-preview
                const apiVersion =
                    process.env.AZURE_OPENAI_API_VERSION_CHAT || "2025-01-01-preview";
                const baseUrl = this.normalizeAzureEndpoint(this.azureEndpoint || "");
                const deployment = this.azureChatDeployment;
                if (!deployment) {
                    throw new Error(
                        "AZURE_OPENAI_DEPLOYMENT_CHAT is not set (and no fallback AZURE_OPENAI_DEPLOYMENT_GPT4/AZURE_OPENAI_DEPLOYMENT_GPT41 was found).",
                    );
                }

                url = `${baseUrl}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
                console.log(`   > Validator using Azure OpenAI chat deployment: ${deployment} (api-version=${apiVersion})`);

                headers = {
                    "Content-Type": "application/json",
                    "api-key": this.apiKey
                };
                // Azure: remove model field (deployment determines the model)
                delete payload.model;
            }

            const postOnce = async (finalUrl: string, finalHeaders: Record<string, string>) =>
                axios.post(finalUrl, payload, { headers: finalHeaders });

            let response;
            try {
                response = await postOnce(url, headers);
            } catch (err: any) {
                // If Azure deployment name is misconfigured, auto-fallback to a known good deployment.
                // Your resource has a deployment named "gpt-4o".
                const azureCode = err?.response?.data?.error?.code;
                const azureMsg = err?.response?.data?.error?.message || err?.message;
                const isDeploymentNotFound =
                    this.isAzure && (azureCode === "DeploymentNotFound" || String(azureMsg).includes("DeploymentNotFound"));

                if (isDeploymentNotFound && this.isAzure) {
                    const baseUrl = this.normalizeAzureEndpoint(this.azureEndpoint || "");
                    const apiVersion =
                        process.env.AZURE_OPENAI_API_VERSION_CHAT || "2025-01-01-preview";

                    const fallbackDeployment = "gpt-4o";
                    if ((this.azureChatDeployment || "") !== fallbackDeployment) {
                        const fallbackUrl = `${baseUrl}/openai/deployments/${fallbackDeployment}/chat/completions?api-version=${apiVersion}`;
                        console.log(
                            `   ⚠️ Validator deployment "${this.azureChatDeployment}" not found. Retrying with fallback deployment "${fallbackDeployment}"...`,
                        );
                        // Update in-memory for this run so subsequent attempts use the working deployment
                        this.azureChatDeployment = fallbackDeployment;
                        url = fallbackUrl;
                        response = await postOnce(fallbackUrl, headers);
                    } else {
                        throw err;
                    }
                } else {
                    throw err;
                }
            }

            const content = response.data?.choices?.[0]?.message?.content;
            if (!content) throw new Error("No validation response");

            const result = JSON.parse(content);
            
            const validationResult: ValidationResult = {
                isValid: result.isValid || false,
                reason: result.reason || "No reason provided",
                annotatedImagePath: debugPath,
                needsManualReview: false
            };

            // Extract adjustments if provided
            if (result.adjustments) {
                validationResult.adjustments = {
                    sizeMultiplier: result.adjustments.sizeMultiplier || 1.0,
                    horizontalOffset: result.adjustments.horizontalOffset || 0,
                    verticalOffset: result.adjustments.verticalOffset || 0,
                    reason: result.adjustments.reason || "AI recommended adjustment"
                };
            }

            return validationResult;

        } catch (error: any) {
            console.error("❌ Validation error:", error?.response?.data || error.message);
            return { 
                isValid: false, 
                reason: "Validation process failed: " + (error?.response?.data?.error?.message || error.message),
                needsManualReview: true
            };
        }
    }
}

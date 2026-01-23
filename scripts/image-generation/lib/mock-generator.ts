import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import util from "util";

const execPromise = util.promisify(exec);

interface GenerationResult {
    url?: string;
    error?: string;
    prompt: string;
}

export class MockGenerator {
    private outputDir: string;

    constructor() {
        this.outputDir = path.join(process.cwd(), "public/images/products");
    }

    async generateImage(prompt: string, fileName: string, slug: string): Promise<GenerationResult> {
        console.log(`🧪 [MOCK] Generating image for [${slug}]...`);

        // Simulate delay
        await new Promise(r => setTimeout(r, 500));

        try {
            const relativePath = `products/${slug}/${fileName}.png`;
            const fullPath = path.join(process.cwd(), "public/images", relativePath);

            // Ensure dir existence
            await fs.mkdir(path.dirname(fullPath), { recursive: true });

            // Generate a placeholder image using ImageMagick if available, or just a dummy text file renamed to png if not (simulating content)
            // Since we don't know if ImageMagick is installed, we'll write a simple SVG -> PNG or just a text buffer.
            // Easiest is to create a tiny valid PNG buffer.

            // Minimal 1x1 Pixel PNG Base64
            const base64Png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
            const buffer = Buffer.from(base64Png, 'base64');

            await fs.writeFile(fullPath, buffer);
            console.log(`✅ [MOCK] Saved placeholder to ${relativePath}`);

            return { url: relativePath, prompt };

        } catch (error: any) {
            console.error(`❌ [MOCK] Generation failed for [${slug}]:`, error.message);
            return { error: error.message, prompt };
        }
    }
}

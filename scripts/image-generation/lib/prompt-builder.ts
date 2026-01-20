import fs from "fs/promises";
import path from "path";

export interface NormalizedProduct {
    id: string;
    name: string;
    slug: string;
    category: string;
    attributes: Record<string, string[]>;
    baseName: string;
    fluxPrompt?: PromptVariations;
}

export interface PromptVariations {
    main: string;
    detail: string;
    lifestyle: string;
    visualSummary: string;
}

export class FluxPromptBuilder {
    private templatesDir = path.join(process.cwd(), "scripts/image-generation/templates");
    private templateCache = new Map<string, string>();

    async init() {
        // Preload all templates
        const templates = [
            "iced-drink.txt", "hot-coffee.txt",
            "detail-iced.txt", "detail-hot.txt",
            "lifestyle-iced.txt", "lifestyle-hot.txt"
        ];

        for (const t of templates) {
            const content = await fs.readFile(path.join(this.templatesDir, t), "utf-8");
            this.templateCache.set(t, content);
        }
    }

    generatePrompts(product: NormalizedProduct): PromptVariations {
        const isCold = this.isColdDrink(product);
        const type = isCold ? "iced" : "hot";

        const mainTplName = isCold ? "iced-drink.txt" : "hot-coffee.txt";
        const detailTplName = isCold ? "detail-iced.txt" : "detail-hot.txt";
        const lifestyleTplName = isCold ? "lifestyle-iced.txt" : "lifestyle-hot.txt";

        // Derived Visual Attributes
        const visualAttrs = this.deriveVisualAttributes(product);
        const placeholders = {
            drinkName: product.baseName,
            name: product.baseName, // Alias for new templates
            ...visualAttrs
        };

        const visualSummary = this.buildVisualSummary(product.baseName, visualAttrs, isCold);

        return {
            main: this.fillTemplate(mainTplName, placeholders),
            detail: this.fillTemplate(detailTplName, placeholders),
            lifestyle: this.fillTemplate(lifestyleTplName, placeholders),
            visualSummary
        };
    }

    private buildVisualSummary(name: string, attrs: any, isCold: boolean): string {
        if (isCold) {
            const sideDesc = attrs.layers ? attrs.layers : `Uniform ${attrs.color} liquid`;
            const topDesc = attrs.toppings && attrs.toppings !== "clean, minimal presentation" ? `Top: ${attrs.toppings}` : "Top: Standard flat/dome lid";

            return `1. ${name} in Clear Plastic Cup (Cold/Condensation).\n` +
                `2. Side View: ${sideDesc}. ${topDesc}.`;
        } else {
            const topDesc = attrs.surfaceTexture + (attrs.toppings && attrs.toppings !== "clean, minimal presentation" ? ` with ${attrs.toppings}` : "");
            return `1. ${name} in a Paper Cup. Color: ${attrs.color}.\n` +
                `2. Top View: ${topDesc}.`;
        }
    }

    private fillTemplate(tplName: string, data: Record<string, string>): string {
        const template = this.templateCache.get(tplName) || "";
        return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => data[key] || "");
    }

    private isColdDrink(p: NormalizedProduct): boolean {
        const coldKeywords = ["iced", "cold", "smoothie", "shake", "frappe", "soda", "juice", "mojito", "lemonade"];
        const name = p.name.toLowerCase();
        const cat = p.category.toLowerCase();

        // Explicit attribute check?
        // For now keyword match
        if (coldKeywords.some(k => name.includes(k) || cat.includes(k))) return true;

        // Default to hot for "Coffee" / "Tea" unless specified
        return false;
    }

    private deriveVisualAttributes(p: NormalizedProduct) {
        const name = p.name.toLowerCase();
        const isCold = this.isColdDrink(p);

        // Default values
        let color = "rich brown coffee color";
        let layers = isCold ? "consistent liquid texture" : ""; // Hot drinks have NO layers
        let toppings = "clean, minimal presentation";
        let cupStyle = isCold
            ? "clear plastic PET takeaway cup with visible external condensation droplets (no glass)"
            : "single-wall paper takeaway cup with white lid (lid removed for photo, no glass/ceramic)";
        let surfaceTexture = isCold ? "ice cubes and liquid surface" : "smooth crema or foam";

        // Logic Rules
        // Global enhancements
        if (!isCold) {
            // Add subtle steam to all hot drinks for "feeling"
            // We append this to surfaceTexture or create a generic atmosphere descriptor
            // Let's modify the template data later, or just append to surfaceTexture.
            surfaceTexture += ". Delicate wisps of steam rising from the cup";
        }

        if (name.includes("matcha")) {
            color = "vibrant creamy green";
            surfaceTexture = "fine microfoam with green tint";
        }

        if (name.includes("strawberry") && name.includes("matcha")) {
            color = "pink and green layers";
            layers = "distinct layers: bottom layer of thick strawberry puree (pink), top layer of creamy matcha latte (green)";
            toppings = "swirl of red strawberry sauce at the bottom";
        }
        else if (name.includes("escobar")) {
            color = "gradient from orange to blue";
            layers = "stunning tri-layer effect: Bottom layer of orange peach and passion fruit syrup. Middle section of clear soda with full ice cubes. Top layer of vibrant Blue Curaçao syrup creating a gradient.";
            toppings = "fruit puree swirl at the very bottom";
        }
        else if (name.includes("chocolate") || name.includes("mocha") || name.includes("hot chocolate")) { // Added hot chocolate
            color = "rich dark chocolate brown";
            toppings = "chocolate powder dusting";
            if (name.includes("hot chocolate")) {
                // Specific rule: 3 big white pices not colored marchemillo flamed with fire
                toppings = "3 big white marshmallows, flame-toasted/browned with a torch for texture";
            }
        } else if (name.includes("strawberry")) {
            color = "pastel pink";
            layers = isCold ? "creamy pink texture" : "";
            toppings = "strawberry sauce drizzle";
        } else if (name.includes("mango")) {
            color = "vibrant yellow-orange";
            layers = isCold ? "thick smoothie texture" : "";
        } else if (name.includes("latte")) {
            color = "light creamy tan";
            surfaceTexture = "latte art (heart or rosette)";
        } else if (name.includes("americano") || name.includes("espresso")) {
            color = "dark black coffee with golden crema";
            // Override default cup for Espresso/Americano if hot, but user said "All Hot = Paper"
            // So we keep the default paper cup.
            layers = ""; // No layers for hot
        } else if (name.includes("black cat")) {
            color = "deep purple/blue soda";
            layers = "blueberry soda base with fresh lemon juice";
            toppings = "lemon slice and fresh mint garnish";
        } else if (name.includes("mojito")) {
            color = "clear/cloudy soda with green tint";
            layers = "soda water with muddled fresh mint leaves and lime wedges";
            toppings = "lots of fresh mint and lime slices. NO whole fruits.";
        } else if (name.includes("hibiscus")) {
            color = "deep translucent red tea";
            layers = isCold ? "refreshing red tea over ice" : "";
            surfaceTexture = isCold ? "ice cubes" : "clear red surface";
            toppings = isCold ? "lemon slice" : "clean, minimal presentation";
            if (!isCold) cupStyle = "single-wall paper takeaway cup with white lid (lid removed for photo, no glass/ceramic)";
        } else if (name.includes("water")) {
            color = "crystal clear water";
            layers = "";
            surfaceTexture = "still water surface";
            toppings = "clean, minimal presentation";
            cupStyle = "clear plastic PET bottle or cup"; // Water usually in bottle? Or cup? User said takeaway.
        } else if (name.includes("frappe")) {
            color = "creamy blended texture";
            surfaceTexture = "high swirl of whipped cream"; // Frappe usually implies whip
            toppings = "rich drizzle of sauce (matching flavor) on the whipped cream. Appetizing drips on the cup sides";
        } else if (name.includes("turkish")) {
            color = "very dark, thick coffee";
            surfaceTexture = "thick foam (face) with bubbles";
            cupStyle = "traditional small paper espresso cup";
        } else if (name.includes("shake") || name.includes("milkshake")) {
            color = "thick creamy milkshake texture";
            surfaceTexture = "whipped cream";
            if (name.includes("vanilla")) {
                toppings = "silver edible sparkles on whipped cream";
            }
        } else if (name.includes("taro") || name.includes("boba")) {
            // "boba at the bottom and iced cubes and the taro milk drink but at the top we have a fomey bubbly layer as we used the shaker... with drips"
            color = name.includes("taro") ? "soft lavender purple" : "milky tea color";
            layers = "bottom layer of black tapioca pearls (boba) and ice cubes. Main body is creamy liquid";
            surfaceTexture = "thick foamy bubbly layer (shaken tea effect)";
            cupStyle += ". Appetizing condensation and drips running down the side";
        }

        // CONSTRAINT ENFORCEMENT
        // "full fruits parts we don't have", "cherry ... don't have"
        // "we work with sauses, toppings and jars of cruches frutres"
        const forbiddenConstraint = "Constraint: DO NOT include whole fruits, whole berries, or cherries. Use only sauces, crushes, or purees.";

        // Append constraint to a suitable field or ensure it's in the template. 
        // Since we return specific fields, let's append it to 'toppings' or 'layers' where appropriate,
        // or we need to update the caller to include this.
        // For now, let's append to 'toppings' if it's not "clean".
        if (toppings !== "clean, minimal presentation") {
            toppings += `. ${forbiddenConstraint}`;
        }

        // Checking attributes from Odoo
        if (p.attributes) {
            if (JSON.stringify(p.attributes).toLowerCase().includes("whipped cream") && !toppings.includes("whipped cream")) {
                toppings += ", swirl of whipped cream on top";
            }
        }

        return { color, layers, toppings, cupStyle, surfaceTexture };
    }
}

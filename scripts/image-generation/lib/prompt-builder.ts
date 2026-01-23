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
            "lifestyle-iced.txt", "lifestyle-hot.txt",
            "food-item.txt",
        ];

        for (const t of templates) {
            const content = await fs.readFile(path.join(this.templatesDir, t), "utf-8");
            this.templateCache.set(t, content);
        }
    }

    generatePrompts(product: NormalizedProduct): PromptVariations {
        const isCold = this.isColdDrink(product);
        const isFood = this.isFoodItem(product);
        const safeBaseName = this.sanitizePromptName(product.baseName || product.name);

        const mainTplName = isFood ? "food-item.txt" : (isCold ? "iced-drink.txt" : "hot-coffee.txt");
        const detailTplName = isCold ? "detail-iced.txt" : "detail-hot.txt";
        const lifestyleTplName = isCold ? "lifestyle-iced.txt" : "lifestyle-hot.txt";

        // Derived Visual Attributes
        const visualAttrs = this.deriveVisualAttributes(product);
        const placeholders = {
            drinkName: safeBaseName,
            name: safeBaseName, // Alias for new templates
            ...visualAttrs
        };

        const visualSummary = this.buildVisualSummary(safeBaseName, visualAttrs, isCold);

        return {
            main: this.fillTemplate(mainTplName, placeholders),
            detail: this.fillTemplate(detailTplName, placeholders),
            lifestyle: this.fillTemplate(lifestyleTplName, placeholders),
            visualSummary
        };
    }

    /**
     * Exposes the same cold/hot heuristic used for prompt selection so other scripts
     * (e.g. logo overlay) can stay consistent.
     */
    isColdProduct(product: NormalizedProduct): boolean {
        return this.isColdDrink(product);
    }

    isFoodProduct(product: NormalizedProduct): boolean {
        return this.isFoodItem(product);
    }

    private buildVisualSummary(name: string, attrs: any, isCold: boolean): string {
        if (isCold) {
            const sideDesc = attrs.layers ? attrs.layers : `Uniform ${attrs.color} liquid`;
            const topDesc =
                attrs.toppings && attrs.toppings !== "clean, minimal presentation"
                    ? `Top: ${attrs.toppings}`
                    : "Top: Open-top cup (NO lid, NO straw)";

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

    private sanitizePromptName(name: string): string {
        if (!name) return "";
        let safe = String(name);
        // Avoid blocked terms in image generation prompts (e.g., "hemp").
        safe = safe.replace(/\bhemp\s+milk\b/gi, "seed milk");
        safe = safe.replace(/\bhemp\s+seeds?\b/gi, "nutty seeds");
        safe = safe.replace(/\bhemp\b/gi, "seed");
        return safe;
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

    private isFoodItem(p: NormalizedProduct): boolean {
        const name = p.name.toLowerCase();
        const cat = p.category.toLowerCase();
        // If it's cold/hot drink, it's not food.
        if (this.isColdDrink(p)) return false;
        // Heuristic: common food keywords/categories
        const foodKeywords = [
            "food",
            "sandwich", "cake", "bakery", "dessert", "cookie", "croissant", "muffin",
            "snack", "breakfast", "salad", "toast", "wrap", "panini", "waffle", "donut",
            "brownie", "brownies", "baguette", "ciabatta", "bread", "bun", "bagel", "brioche", "pita",
            "pastry", "pie", "tart", "steak",
            "chicken", "bbq", "ranch",
        ];
        if (foodKeywords.some(k => name.includes(k) || cat.includes(k))) return true;
        // Default: not food (hot drinks, etc.)
        return false;
    }

    private deriveVisualAttributes(p: NormalizedProduct) {
        const name = p.name.toLowerCase();
        const isCold = this.isColdDrink(p);
        const isCustom =
            name.includes("custom") ||
            String(p.slug || "").toLowerCase().startsWith("custom-");

        // Default values
        let color = "rich brown coffee color";
        let layers = isCold ? "consistent liquid texture" : ""; // Hot drinks have NO layers
        let toppings = "clean, minimal presentation";
        // Cup rules (per your spec):
        // - Iced: ONE consistent smart cup, same shape/curves, 16oz, clear/transparent, NO lid/cover/straw
        // - Hot: branded orange cup, 4oz for espresso/turkish, 16oz for all other hot drinks, NO lid/cover
        const isSmallHot =
            !isCold && (name.includes("espresso") || name.includes("turkish"));
        const cupSizeOz = isCold ? "16" : isSmallHot ? "4" : "16";

        const cupDescription = isCold
            ? "a standardized 16oz clear plastic PET iced cup (transparent), with the exact same consistent cup silhouette (shape and curves) used for ALL iced drinks; open-top (NO lid, NO cover, NO straw)"
            : `a standardized ${cupSizeOz}oz matte paper cup with a burnt orange body, white rim, and white base; open-top (NO lid, NO cover)`;

        // Keep legacy variable (some templates may still reference it)
        // (mutable because some product-specific branches append minor notes like "drips")
        let cupStyle = cupDescription;
        let surfaceTexture = isCold ? "ice cubes and liquid surface" : "smooth crema or foam";

        // Text rules default (no text/logos baked into generation)
        let textRules =
            "ABSOLUTELY NO readable text, letters, numbers, labels, or brand names anywhere in the image.\n" +
            "ABSOLUTELY NO watermarks or model text such as 'FLUX', 'FLUX.2', 'AI', or any signature.\n" +
            "Cup surface must be BLANK/unbranded (no printed patterns, no graphics).\n" +
            "No text, no logos.";

        // Custom items: show as black cutout with a big '?' (per provided reference)
        let customOverlay = "";
        if (isCustom) {
            textRules =
                "CUSTOM PLACEHOLDER ITEM RULES:\n" +
                "- Render the entire cup + drink as a clean, solid BLACK cutout/silhouette (like a product cutout).\n" +
                "- Add ONE large WHITE question mark '?' centered on the cup front.\n" +
                "- No other text, no logos, no letters, no numbers besides that single '?'.";
            customOverlay =
                "SPECIAL INSTRUCTION (CUSTOM ITEM): the drink should look like a placeholder cutout. " +
                "Cup and drink are a solid black silhouette; a single large white '?' is printed/overlaid on the cup front.";
            // Make the liquid description generic so model doesn't hallucinate specific flavors
            color = "solid matte black silhouette (no visible flavor color)";
            layers = isCold ? "no visible layers (silhouette cutout)" : "";
            surfaceTexture = isCold ? "flat top surface (silhouette cutout)" : "flat top surface (silhouette cutout)";
            toppings = "clean, minimal presentation";
        }

        // Logic Rules
        // Global enhancements
        if (!isCold) {
            // Add subtle steam to all hot drinks for "feeling"
            // We append this to surfaceTexture or create a generic atmosphere descriptor
            // Let's modify the template data later, or just append to surfaceTexture.
            surfaceTexture += ". Delicate wisps of steam rising from the cup";
        }

        if (!isCustom && name.includes("matcha")) {
            // Matcha should always be green (avoid generic latte overrides)
            if (isCold && (name.includes("latte") || name.includes("matcha latte"))) {
                color =
                    "two-tone: creamy milk white at the bottom and vibrant matcha green on top (NOT coffee brown / NOT latte tan), with a beautiful swirling gradient mixing zone in the middle";
                layers =
                    "CLEARLY VISIBLE distinct layers: bottom layer of cold milk (white), top layer of vivid matcha (green), with a marbled mixing transition in the middle (amazing swirl). No uniform blending.";
                surfaceTexture = "matcha foam/microfoam on the top green layer with ice visible (no latte art)";
                // Avoid powder garnish as it triggers 'raw ingredient' constraints in validation
                toppings = "clean, minimal presentation (NO powder garnish, NO matcha powder dusting, NO garnish cubes)";
            } else {
                color = "vivid matcha green (NOT coffee brown / NOT latte tan)";
                surfaceTexture = isCold
                    ? "matcha foam on top with ice visible (no latte art)"
                    : "solid vivid matcha-green microfoam surface, smooth and uniform (NO latte art, NO heart/rosette, NO white foam patterns, NO powder dusting, NO garnish cubes)";
                toppings = "clean, minimal presentation (NO powder garnish, NO matcha powder dusting, NO garnish cubes)";
            }
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
        } else if (name.includes("latte") && !name.includes("matcha")) {
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
            toppings = "fresh mint leaves and a subtle citrus syrup swirl (no slices)";
        } else if (name.includes("mojito")) {
            color = "clear/cloudy soda with green tint";
            // No lime wedges/slices; use syrup + mint only
            layers =
                "soda water with muddled fresh mint leaves, lime syrup integrated into the liquid, and lots of ice";
            toppings =
                "lots of fresh mint leaves and subtle lime syrup swirl (no slices, no wedges)";
        } else if (name.includes("hibiscus")) {
            color = "deep translucent red tea";
            layers = isCold ? "refreshing red tea over ice" : "";
            surfaceTexture = isCold ? "ice cubes" : "clear red surface";
            toppings = isCold ? "subtle citrus syrup swirl (no slices)" : "clean, minimal presentation";
        } else if (name.includes("water")) {
            color = "crystal clear water";
            layers = "";
            surfaceTexture = "still water surface";
            toppings = "clean, minimal presentation";
        } else if (name.includes("frappe")) {
            color = "creamy blended texture";
            surfaceTexture = "high swirl of whipped cream"; // Frappe usually implies whip
            toppings = "rich drizzle of sauce (matching flavor) on the whipped cream. Appetizing drips on the cup sides";
        } else if (name.includes("turkish")) {
            color = "very dark, thick coffee";
            surfaceTexture = "thick foam (face) with bubbles";
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

        // CONSTRAINT ENFORCEMENT (STRICT)
        // User requirement: NO fruit parts/slices around the cup. Only sauces/crush/toppings.
        const forbiddenConstraint =
            "STRICT CONSTRAINTS: NO whole fruits, NO fruit slices, NO wedges, NO fruit pieces, NO fruit chunks/cubes (e.g., mango cubes), " +
            "NO berries (e.g., blueberries/raspberries), NO cherries, and NO raw ingredients placed around the cup. " +
            "NO props around the cup (no ice cubes outside, no beans, no garnish on the table). " +
            "Use ONLY sauces, purees, drizzles, crushed toppings (Ostenberg-style), crumbs, powders, and syrups integrated with the drink.";

        // Always append so it applies even when toppings are 'clean'
        if (toppings === "clean, minimal presentation") {
            toppings = `clean, minimal presentation. ${forbiddenConstraint}`;
        } else {
            toppings += `. ${forbiddenConstraint}`;
        }

        // Checking attributes from Odoo
        if (p.attributes) {
            if (JSON.stringify(p.attributes).toLowerCase().includes("whipped cream") && !toppings.includes("whipped cream")) {
                toppings += ", swirl of whipped cream on top";
            }
        }

        return { color, layers, toppings, cupStyle, surfaceTexture, cupDescription, cupSizeOz, customOverlay, textRules };
    }
}

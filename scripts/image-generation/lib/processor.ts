import { RawOdooProduct, RawOdooCategory } from "./odoo-fetcher";

interface NormalizedProduct {
    id: string; // Odoo ID as string
    name: string;
    slug: string;
    category: string;
    categoryId: number;
    sku: string;
    price: number;
    attributes: Record<string, string[]>;
    isDrink: boolean;
    baseName: string; // Name without size/variant info for grouping
}

// Regex to identify Drink categories (case insensitive)
const DRINK_CATEGORY_REGEX = /coffee|tea|drink|beverage|juice|smoothie|shake|water|soda|mocktail|latte|espresso|frappe|mojito|cocktail|matcha/i;
// Regex to exclude Food categories explicitly if needed
const FOOD_CATEGORY_REGEX = /sandwich|food|cake|bakery|dessert|snack|breakfast|salad|cookie|croissant|muffin/i;
// Regex to exclude utility/service items
const EXCLUDE_REGEX = /extra|service|offer|delivery|tip|discount|fee/i;

export class FluxProcessor {

    process(products: RawOdooProduct[], categories: RawOdooCategory[]): NormalizedProduct[] {
        const categoryMap = new Map(categories.map(c => [c.id, c]));

        const normalized = products.map(p => this.normalize(p, categoryMap));

        // Filter out items that are definitely NOT drinks (if we want to be strict)
        // Or just mark them. The requirement says "drinks only" in ingestion phase.
        const drinks = normalized.filter(p => p.isDrink);

        console.log(`Processed ${products.length} products. Found ${drinks.length} drinks.`);

        // Deduplicate logic
        return this.deduplicate(drinks);
    }

    private normalize(p: RawOdooProduct, categoryMap: Map<number, RawOdooCategory>): NormalizedProduct {
        const catId = Array.isArray(p.categ_id) ? p.categ_id[0] : (p.categ_id as number);
        const category = categoryMap.get(catId);
        const categoryName = category ? category.display_name : "Unknown";
        const categorySimpleName = category ? category.name : "Unknown";

        const isDrink = this.isDrinkCategory(p.name, categoryName);

        const slug = this.slugify(p.name);
        const baseName = this.extractBaseName(p.name);

        return {
            id: String(p.id),
            name: p.name,
            slug,
            category: categorySimpleName,
            categoryId: catId,
            sku: p.default_code || "",
            price: p.list_price || 0,
            attributes: p.attributes || {},
            isDrink,
            baseName
        };
    }

    private isDrinkCategory(name: string, categoryName: string): boolean {
        const checkStr = `${name} ${categoryName}`;
        if (EXCLUDE_REGEX.test(checkStr)) return false;
        if (FOOD_CATEGORY_REGEX.test(checkStr)) return false;

        return DRINK_CATEGORY_REGEX.test(checkStr);
    }

    private slugify(text: string): string {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')     // Replace spaces with -
            .replace(/[^\w-]+/g, '')  // Remove all non-word chars
            .replace(/--+/g, '-');    // Replace multiple - with single -
    }

    private extractBaseName(name: string): string {
        // Remove common variant indicators to find the "Visual Master"
        let base = name
            .replace(/\[.*\]/g, '') // Remove [L]
            .replace(/single|double|triple|regular|large|small/gi, '')
            .trim();

        // Handle Suffixes like "Spanish Latte (Iced)" -> "Iced Spanish Latte"
        if (/\(\s*iced\s*\)/i.test(base)) {
            base = "Iced " + base.replace(/\(\s*iced\s*\)/i, '');
        }

        // Handle "(Hot)" -> Remove it (Implied default)
        base = base.replace(/\(\s*hot\s*\)/i, '');

        // Handle generic parenthesis removal (safely after checks)
        base = base.replace(/\(.*\)/g, '').trim();

        // Handle Hibiscus Tea -> Hibiscus? Or just treat them as separate but similar?
        // Let's normalize spaces
        return base.replace(/\s+/g, ' ').trim();
    }

    private deduplicate(products: NormalizedProduct[]): NormalizedProduct[] {
        // Group by slug or baseName
        // For now, we want 1 image per "Visual Product".
        // "Latte Single" and "Latte Double" look the same.

        const uniqueMap = new Map<string, NormalizedProduct>();

        for (const p of products) {
            // Create a deduplication key. 
            // If we use baseName, we merge sizes.
            // If we use slug, we might keep too many variations.
            const key = this.slugify(p.baseName);

            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, p);
            } else {
                // If we already have this product, we might want to keep the one with more info?
                // Or just the first one.
                // For now, keep the first one found.
            }
        }

        const unique = Array.from(uniqueMap.values());
        console.log(`Deduplicated to ${unique.length} unique visual products.`);
        return unique;
    }
}

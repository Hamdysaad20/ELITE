/**
 * Mapping utility for Old Items images
 * Maps product names to local static files in /public/Old Items/
 */

// List of available files in public/Old Items/
// Generated based on directory listing
const AVAILABLE_OLD_ITEMS = new Set([
    "Cappuccino-1.png",
    "Cappuccino.png",
    "Caramel Frappé.png",
    "Chai Latte-1.png",
    "Chai Latte.png",
    "Chocolate Milkshake-1.png",
    "Chocolate Milkshake.png",
    "Chocolate-1.png",
    "Chocolate.png",
    "Classic Lemon Soda-1.png",
    "Classic Lemon Soda.png",
    "Classic Tea-1.png",
    "Classic Tea.png",
    "Coffee Frappé-1.png",
    "Coffee Frappé.png",
    "Cortado-1.png",
    "Cortado.png",
    "Espresso Macchiato-1.png",
    "Espresso Macchiato.png",
    "Espresso-1.png",
    "Espresso.png",
    "Flat White-1.png",
    "Flat White.png",
    "Golden Peach Sunrise-1.png",
    "Golden Peach Sunrise.png",
    "Iced Americano-1.png",
    "Iced Americano.png",
    "Iced Cappuccino-1.png",
    "Iced Cappuccino.png",
    "Iced Caramel Macchiato-1.png",
    "Iced Caramel Macchiato.png",
    "Iced Chai Latte-1.png",
    "Iced Chai Latte.png",
    "Iced Chocolate-1.png",
    "Iced Chocolate.png",
    "Iced Latte-1.png",
    "Iced Latte.png",
    "Iced Matcha Latte-1.png",
    "Iced Matcha Latte.png",
    "Iced Mocha-1.png",
    "Iced Mocha.png",
    "Iced STRAWBERRY MATCHA latte-1.png",
    "Iced STRAWBERRY MATCHA latte.png",
    "Karak Chai-1.png",
    "Karak Chai.png",
    "Kinder Milkshake-1.png",
    "Kinder Milkshake.png",
    "Latte-1.png",
    "Latte.png",
    "Matcha Latte-1.png",
    "Matcha Latte.png",
    "Mocha Frappé-1.png",
    "Mocha Frappé.png",
    "Mocha-1.png",
    "Mocha.png",
    "Oreo Milkshake-1.png",
    "Oreo Milkshake.png",
    "PRINTING_CUP.png",
    "Passion Fruit Soda-1.png",
    "Passion Fruit Soda.png",
    "Raspberry & Pineapple-1.png",
    "Raspberry & Pineapple.png",
    "Spanish Latte-1.png",
    "Spanish Latte.png",
    "Turkish Coffee-1.png",
    "Turkish Coffee.png",
    "Vanilla Frappé-1.png",
    "Vanilla Frappé.png",
    "Vanilla Milkshake-1.png",
    "Vanilla Milkshake.png",
    "americano-1.png",
    "americano.png"
]);

/**
 * Get the local image path for a product from Old Items
 * STRICTLY prefers names ending in "-1.png" as per requirement
 */
export function getOldItemImage(productName: string): string | null {
    if (!productName) return null;

    // Clean the name slightly if needed (trim)
    const cleanName = productName.trim();

    // STRICT requirement: Try exact name + "-1.png"
    const candidate = `${cleanName}-1.png`;

    if (AVAILABLE_OLD_ITEMS.has(candidate)) {
        return `/Old Items/${candidate}`;
    }

    return null;
}

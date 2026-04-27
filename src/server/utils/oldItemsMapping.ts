/**
 * Mapping utility for Old Items images
 * Maps product names to local static files in /public/Old Items/
 */

// List of available files in public/Old Items/
// Generated based on directory listing
const AVAILABLE_OLD_ITEMS = new Set([
  "Americano-1.png",
  "Banana Latte-1.png",
  "Banana Latte.png",
  "Black Cat-1.png",
  "Black Cat.png",
  "Black Late-1.png",
  "Black Late.png",
  "Blue Latte-1.png",
  "Blue Latte.png",
  "Boba Chocolate-1.png",
  "Boba Chocolate.png",
  "Boba Spanish Latte-1.png",
  "Boba Spanish Latte.png",
  "Boba Taro-1.png",
  "Boba Taro.png",
  "Cappuccino-1.png",
  "Cappuccino.png",
  "Caramel Frappé-1.png",
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
  "Dragon Fruit Frappé-1.png",
  "Dragon Fruit Frappé.png",
  "Elite Chocolate-1.png",
  "Escobar-1.png",
  "Escobar.png",
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
  "Mango Matcha-1.png",
  "Mango Matcha.png",
  "Matcha Cloud-1.png",
  "Matcha Cloud.png",
  "Matcha Frappé-1.png",
  "Matcha Frappé.png",
  "Matcha Latte-1.png",
  "Matcha Latte.png",
  "Mix Choco Mango Shake-1.png",
  "Mix Choco Mango Shake.png",
  "Mocha Frappé-1.png",
  "Mocha Frappé.png",
  "Mocha-1.png",
  "Mocha.png",
  "Oreo Milkshake-1.png",
  "Oreo Milkshake.png",
  "Passion Fruit Soda-1.png",
  "Passion Fruit Soda.png",
  "Raspberry & Pineapple-1.png",
  "Raspberry & Pineapple.png",
  "Spanish Latte-1.png",
  "Spanish Latte.png",
  "Strawberry Matcha-1.png",
  "Strawberry Matcha.png",
  "Taro Latte-1.png",
  "Taro Latte.png",
  "Taro Matcha-1.png",
  "Taro Matcha.png",
  "Turkish Coffee-1.png",
  "Turkish Coffee.png",
  "Vanilla Frappé-1.png",
  "Vanilla Frappé.png",
  "Vanilla Milkshake-1.png",
  "Vanilla Milkshake.png",
  "americano.png",
]);

export function hasOldItemImageFile(fileName: string): boolean {
  return AVAILABLE_OLD_ITEMS.has(fileName);
}

export function getOldItemImageCandidates(productName: string): string[] {
  if (!productName) return [];

  const cleanName = productName.trim();
  const candidates = [`${cleanName}-1.png`, `${cleanName}.png`];

  return candidates.filter((candidate) => AVAILABLE_OLD_ITEMS.has(candidate));
}

// Pre-built lowercase index for case-insensitive lookups
const LOWER_TO_ORIGINAL = new Map<string, string>(
  [...AVAILABLE_OLD_ITEMS].map((f) => [f.toLowerCase(), f]),
);

/**
 * Get the local image path for a product from Old Items.
 * Tries exact case first, then falls back to case-insensitive match so that
 * template-renamed products (e.g. "Turkish Coffee" vs "turkish coffee") still
 * resolve correctly after the variant deduplication renames.
 */
export function getOldItemImage(productName: string): string | null {
  if (!productName) return null;

  const cleanName = productName.trim();
  const candidate = `${cleanName}-1.png`;

  // Exact match (fast path)
  if (AVAILABLE_OLD_ITEMS.has(candidate)) {
    return `/Old Items/${candidate}`;
  }

  // Case-insensitive fallback
  const original = LOWER_TO_ORIGINAL.get(candidate.toLowerCase());
  if (original) {
    return `/Old Items/${original}`;
  }

  return null;
}

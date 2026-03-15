import { NextRequest } from "next/server";
import {
    jsonResponse,
    successResponse,
} from "@/server/utils/apiHelpers";
import { getProductsSafe, Product } from "@/server/services/product.service";

export type LovedByLocalProduct = {
    id: string;
    name: string;
    image: string;
    category: string;
    categoryId?: string;
    reason?: string; // Why this product was recommended
};

/**
 * Hardcoded bestseller products used as fallback
 * when database is unavailable
 */
const FALLBACK_PRODUCTS: LovedByLocalProduct[] = [
    {
        id: "cappuccino",
        name: "Cappuccino",
        image: "/Old Items/Cappuccino-1.png",
        category: "Classics",
        categoryId: "classics",
        reason: "Customer favorite",
    },
    {
        id: "matcha-latte",
        name: "Matcha Latte",
        image: "/Old Items/Matcha Latte-1.png",
        category: "Specialty",
        categoryId: "specialty",
        reason: "Trending now",
    },
    {
        id: "iced-latte",
        name: "Iced Latte",
        image: "/Old Items/Iced Latte-1.png",
        category: "Iced",
        categoryId: "iced",
        reason: "Refreshing",
    },
    {
        id: "mocha",
        name: "Mocha",
        image: "/Old Items/Mocha-1.png",
        category: "Specialty",
        categoryId: "specialty",
        reason: "Most loved",
    },
];

/**
 * GET /api/recommendations/loved-by-locals
 *
 * Returns 4 recommended products for the "Loved by Locals" section
 * Simple strategy: Pick from high-quality products with images
 *
 * Fallback: Returns hardcoded bestsellers if database unavailable
 */
export async function GET(request: NextRequest) {
    try {
        // Try to fetch products, but have fallback ready
        let allProducts: Product[] = [];
        let usingFallback = false;

        try {
            const { products: fetchedProducts } = await getProductsSafe();
            allProducts = Array.isArray(fetchedProducts) ? fetchedProducts : [];
        } catch (err) {
            console.warn(
                "Could not fetch products from database, using fallback",
                err instanceof Error ? err.message : String(err),
            );
            usingFallback = true;
        }

        // Filter available products with images
        const featuredProducts = allProducts
            .filter((p) => p.available !== false && p.images && p.images.length > 0)
            .sort((a, b) => {
                // Prioritize by sequence (lower = featured)
                const seqDiff = (a.sequence ?? 999) - (b.sequence ?? 999);
                if (seqDiff !== 0) return seqDiff;
                // Then by name for consistency
                return (a.name || "").localeCompare(b.name || "");
            });

        // If we have at least 4 products, pick evenly distributed ones
        let selectedProducts: LovedByLocalProduct[] = [];

        if (featuredProducts.length >= 4) {
            // Pick every nth product to get variety across the list
            const step = Math.floor(featuredProducts.length / 4);
            for (let i = 0; i < 4; i++) {
                const product = featuredProducts[i * step];
                if (product) {
                    selectedProducts.push({
                        id: product.id,
                        name: product.name || "Unknown",
                        image: (product.images?.[0]) || "/images/placeholder.svg",
                        category: product.category?.name || "Beverages",
                        categoryId: product.categoryId,
                        reason: "Customer favorite",
                    });
                }
            }
        } else if (featuredProducts.length > 0) {
            // If less than 4, just use what we have
            selectedProducts = featuredProducts.slice(0, 4).map((product) => ({
                id: product.id,
                name: product.name || "Unknown",
                image: (product.images?.[0]) || "/images/placeholder.svg",
                category: product.category?.name || "Beverages",
                categoryId: product.categoryId,
                reason: "Popular choice",
            }));
        }

        // If still no products (database down), use hardcoded fallback
        if (selectedProducts.length === 0) {
            selectedProducts = FALLBACK_PRODUCTS;
            usingFallback = true;
        }

        return jsonResponse(
            successResponse({
                products: selectedProducts,
                isUsing: usingFallback ? "fallback" : "live-data",
                count: selectedProducts.length,
            }),
        );
    } catch (error) {
        console.error("[LOVED_BY_LOCALS] Unexpected error:", error);
        // Even if something goes wrong, return fallback products
        return jsonResponse(
            successResponse({
                products: FALLBACK_PRODUCTS,
                isUsing: "fallback",
                error: error instanceof Error ? error.message : "Unknown error",
            }),
        );
    }
}

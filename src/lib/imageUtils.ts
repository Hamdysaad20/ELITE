/**
 * Image utility functions for handling Odoo images, fallbacks, and validation
 */

import { extractBaseName, slugify } from "@/lib/utils";
import { hasOldItemImageFile } from "@/server/utils/oldItemsMapping";

/**
 * Marker used when images are stripped from list view for performance
 * The actual image will be fetched on-demand when viewing product details
 */
export const HAS_IMAGE_MARKER = "has-image";

/**
 * Check if image is a stripped marker (indicating full image needs to be fetched)
 */
export function isImageMarker(src: string | undefined | null): boolean {
  return src === HAS_IMAGE_MARKER;
}

/**
 * Validates if a string is a valid image URL or base64
 */
export function isValidImage(src: string | undefined | null): boolean {
  if (!src || typeof src !== "string") return false;

  // The "has-image" marker is not a valid displayable image
  if (src === HAS_IMAGE_MARKER) return false;

  // Check if base64
  if (src.startsWith("data:image/")) return true;

  // Check if URL
  try {
    new URL(src);
    return true;
  } catch {
    // Check if relative path
    return src.startsWith("/") || src.startsWith("./");
  }
}

/**
 * Get fallback image by type
 */
export function getFallbackImage(
  type: "product" | "category" | "user" = "product",
): string {
  const fallbacks = {
    product: "/images/PRINTING_CUP.png",
    category: "/images/PRINTING_CUP.png",
    user: "/images/PRINTING_CUP.png",
  };

  return fallbacks[type];
}

/**
 * Extract first valid image from array or return fallback
 */
export function getFirstValidImage(
  images: (string | undefined | null)[] | undefined | null,
  fallback?: string,
): string {
  if (!images || !Array.isArray(images)) {
    return fallback || getFallbackImage("product");
  }

  const validImage = images.find((img) => isValidImage(img));
  return validImage || fallback || getFallbackImage("product");
}

/**
 * Convert Odoo base64 image to optimized format
 * Note: This is a placeholder - actual optimization would require server-side processing
 */
export function optimizeOdooImage(
  base64: string,
  quality: number = 80,
): string {
  // For now, just return the base64 as-is
  // In production, you might want to:
  // 1. Decode the base64
  // 2. Resize the image
  // 3. Compress it
  // 4. Re-encode to base64
  return base64;
}

/**
 * Preload an image to improve perceived performance
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!isValidImage(src)) {
      reject(new Error("Invalid image source"));
      return;
    }

    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

/**
 * Preload multiple images
 */
export async function preloadImages(sources: string[]): Promise<void> {
  const validSources = sources.filter(isValidImage);
  await Promise.all(validSources.map(preloadImage));
}

/**
 * Get image dimensions
 */
export function getImageDimensions(
  src: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    if (!isValidImage(src)) {
      reject(new Error("Invalid image source"));
      return;
    }

    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

/**
 * Check if image is base64
 */
export function isBase64Image(src: string): boolean {
  return typeof src === "string" && src.startsWith("data:image/");
}

/**
 * Get image size category for lazy loading priority
 */
export function getImagePriority(index: number, totalImages: number): boolean {
  // Prioritize first 3 images
  return index < 3;
}

/**
 * Sanitize image array - remove nulls, undefineds, and invalid images
 */
export function sanitizeImages(
  images: (string | undefined | null)[] | undefined | null,
): string[] {
  if (!images || !Array.isArray(images)) return [];
  return images.filter((img): img is string => isValidImage(img));
}

/**
 * Local product image candidates from Old Items directory.
 * Tries "base name" and the full name so we can handle variants consistently.
 * Uses the -1.png naming convention from Old Items directory.
 */
export function getLocalProductImageCandidates(
  name: string | undefined | null,
  filename: string = "-1.png",
): string[] {
  if (!name) return [];
  const base = extractBaseName(name);
  const names = [base, name].filter(Boolean);

  // Strict candidates that are known to exist in the Old Items manifest.
  const strictCandidates = names
    .filter(Boolean)
    .map((n) => `${n}${filename}`)
    .filter((fileName) => hasOldItemImageFile(fileName));

  // Heuristic fallbacks constrained to the same "-1" naming requirement only.
  const heuristicCandidates = names.map((n) => `${n}${filename}`);

  const uniqueCandidates = Array.from(
    new Set([...strictCandidates, ...heuristicCandidates]),
  );

  return uniqueCandidates.map((c) => `/Old Items/${c}`);
}

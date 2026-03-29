"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

// Remember failed sources across component mounts to avoid repeated 404 spam.
const globalFailedSrcs = new Set<string>();

function toFailureKey(src: string): string {
  // Normalize Old Items URLs so cache-buster query params don't cause retries.
  if (src.startsWith("/Old Items/")) {
    return src.split("?")[0];
  }
  return src;
}

interface ImageWithFallbackProps {
  src?: string | string[];
  alt: string;
  fallbackSrc?: string;
  width?: number;
  height?: number;
  className?: string;
  fill?: boolean;
  priority?: boolean;
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  showErrorIcon?: boolean;
  onError?: () => void;
  onLoad?: () => void;
  quality?: number;
  sizes?: string;
}

const DEFAULT_FALLBACK = "/images/placeholder.svg";

export default function ImageWithFallback({
  src,
  alt,
  fallbackSrc = DEFAULT_FALLBACK,
  width,
  height,
  className,
  fill = false,
  priority = false,
  objectFit = "cover",
  showErrorIcon = true,
  onError,
  onLoad,
  quality,
  sizes,
}: ImageWithFallbackProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [hasGlobalError, setHasGlobalError] = useState(false);
  const [failedSrcs, setFailedSrcs] = useState<Set<string>>(
    () => new Set(globalFailedSrcs),
  );
  const [isLoading, setIsLoading] = useState(true);

  // Handle multiple images - create array
  const rawImages = Array.isArray(src) ? src : src ? [src] : [];
  // Filter out images that have failed to load
  const images = rawImages.filter((img) => !failedSrcs.has(toFailureKey(img)));

  // Reset failure state if src prop changes entirely (optional, but good practice)
  const rawImagesKey = JSON.stringify(rawImages);
  useEffect(() => {
    setFailedSrcs(new Set(globalFailedSrcs));
    setHasGlobalError(false);
    setCurrentImageIndex(0);
  }, [rawImagesKey]);

  const currentSrc = images[currentImageIndex % images.length];
  const hasMultipleImages = images.length > 1;

  // Auto-rotate images if multiple
  useEffect(() => {
    if (!hasMultipleImages) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [hasMultipleImages, images.length]);

  const handleError = () => {
    if (currentSrc) {
      console.warn(`Image load failed: ${currentSrc}`);
      const failureKey = toFailureKey(currentSrc);
      globalFailedSrcs.add(failureKey);
      setFailedSrcs((prev) => {
        const next = new Set(prev);
        next.add(failureKey);
        return next;
      });
      // Reset loading to allow next image to try loading
      setIsLoading(true);
    } else {
      // Should not happen if filtered correctly, but safety net
      setHasGlobalError(true);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  // No images provided or all failed - show fallback
  if (!currentSrc || hasGlobalError || images.length === 0) {
    return (
      <div
        className={cn(
          "relative bg-elite-dark-cream flex items-center justify-center",
          className,
        )}
        style={
          fill
            ? undefined
            : {
                width: width || "100%",
                height: height || "100%",
              }
        }
      >
        {showErrorIcon ? (
          <div className="flex flex-col items-center justify-center gap-2 text-elite-burgundy/40">
            <ImageOff className="w-8 h-8" />
            <span className="text-xs font-cabin">No image</span>
          </div>
        ) : fallbackSrc ? (
          <Image
            src={fallbackSrc}
            alt={alt || "Placeholder"}
            fill={fill}
            width={fill ? undefined : width || 200}
            height={fill ? undefined : height || 200}
            className={className}
            style={fill ? { objectFit } : undefined}
            quality={quality}
          />
        ) : null}
      </div>
    );
  }

  // Check if image is base64
  const isBase64 = currentSrc.startsWith("data:");
  const isOldItemsPath = currentSrc.startsWith("/Old Items/");

  return (
    <div className={cn("relative", fill && "w-full h-full")}>
      {/* Loading placeholder */}
      {isLoading && (
        <div
          className={cn(
            "absolute inset-0 bg-elite-dark-cream animate-pulse",
            className,
          )}
        />
      )}

      {/* Actual image */}
      {isBase64 ? (
        // Base64 image (from Odoo)
        <img
          src={currentSrc}
          alt={alt}
          className={cn(className, isLoading && "opacity-0")}
          onError={handleError}
          onLoad={handleLoad}
          style={
            fill
              ? {
                  width: "100%",
                  height: "100%",
                  objectFit,
                }
              : {
                  width: width || "100%",
                  height: height || "100%",
                  objectFit,
                }
          }
        />
      ) : (
        // Regular URL - use Next.js Image optimization
        <Image
          src={currentSrc}
          alt={alt}
          fill={fill}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          priority={priority}
          className={cn(className, isLoading && "opacity-0")}
          style={fill ? { objectFit } : undefined}
          onError={handleError}
          onLoad={handleLoad}
          quality={quality}
          sizes={sizes}
          unoptimized={isOldItemsPath}
        />
      )}

      {/* Image dots indicator for multiple images */}
      {hasMultipleImages && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all",
                index === currentImageIndex % images.length
                  ? "bg-elite-cream w-4"
                  : "bg-elite-cream/50 hover:bg-elite-cream/75",
              )}
              aria-label={`View image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

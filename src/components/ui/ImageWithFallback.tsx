"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

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
}: ImageWithFallbackProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Handle multiple images - create array
  const images = Array.isArray(src) ? src : src ? [src] : [];
  const currentSrc = images[currentImageIndex];
  const hasMultipleImages = images.length > 1;

  // Auto-rotate images if multiple
  useEffect(() => {
    if (!hasMultipleImages || imageError) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [hasMultipleImages, images.length, imageError]);

  const handleError = () => {
    setImageError(true);
    setIsLoading(false);
    onError?.();
  };

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  // No images provided or all failed - show fallback
  if (!currentSrc || imageError) {
    return (
      <div
        className={cn(
          "relative bg-elite-dark-cream flex items-center justify-center",
          className
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
            width={fill ? undefined : width}
            height={fill ? undefined : height}
            className={className}
            style={fill ? { objectFit } : undefined}
          />
        ) : null}
      </div>
    );
  }

  // Check if image is base64
  const isBase64 = currentSrc.startsWith("data:");

  return (
    <div className="relative">
      {/* Loading placeholder */}
      {isLoading && (
        <div
          className={cn(
            "absolute inset-0 bg-elite-dark-cream animate-pulse",
            className
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
        />
      )}

      {/* Image dots indicator for multiple images */}
      {hasMultipleImages && !imageError && images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all",
                index === currentImageIndex
                  ? "bg-elite-cream w-4"
                  : "bg-elite-cream/50 hover:bg-elite-cream/75"
              )}
              aria-label={`View image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

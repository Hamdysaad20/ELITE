/**
 * Shared component utilities and common patterns
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines CSS classes using clsx and tailwind-merge for optimal class resolution
 *
 * @param inputs - CSS class values to combine
 * @returns Merged CSS class string
 *
 * @example
 * ```tsx
 * <div className={cn('bg-red-500', isActive && 'bg-blue-500')} />
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Common button variants for consistent styling across the app
 */
export const buttonVariants = {
  primary:
    "bg-elite-burgundy text-elite-cream hover:bg-elite-burgundy/90 transition-colors",
  secondary:
    "bg-elite-cream text-elite-burgundy border border-elite-burgundy hover:bg-elite-burgundy hover:text-elite-cream transition-colors",
  outline:
    "border border-elite-burgundy text-elite-burgundy hover:bg-elite-burgundy hover:text-elite-cream transition-colors",
  ghost: "text-elite-burgundy hover:bg-elite-cream transition-colors",
  danger: "bg-elite-burgundy text-white hover:bg-elite-dark-burgundy transition-colors",
} as const;

/**
 * Common size variants for buttons and inputs
 */
export const sizeVariants = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
  xl: "px-8 py-4 text-xl",
} as const;

/**
 * Common loading states for components
 */
export const loadingStates = {
  skeleton: "animate-pulse bg-elite-light-gray rounded",
  spinner:
    "animate-spin rounded-full border-2 border-elite-burgundy border-t-transparent",
  dots: "animate-bounce",
} as const;

/**
 * Generates a button className based on variant and size
 *
 * @param variant - Button style variant
 * @param size - Button size variant
 * @param className - Additional custom classes
 * @returns Combined button className
 */
export function getButtonClassName(
  variant: keyof typeof buttonVariants = "primary",
  size: keyof typeof sizeVariants = "md",
  className?: string,
): string {
  return cn(
    "inline-flex items-center justify-center rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-elite-burgundy focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
    buttonVariants[variant],
    sizeVariants[size],
    className,
  );
}

/**
 * Common input styling for forms
 */
export const inputClassName = cn(
  "flex h-10 w-full rounded-md border border-elite-gray bg-background px-3 py-2 text-sm",
  "ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium",
  "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2",
  "focus-visible:ring-elite-burgundy focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
);

/**
 * Common card styling
 */
export const cardClassName = cn(
  "rounded-lg border bg-card text-card-foreground shadow-sm",
);

/**
 * Animation classes for common UI patterns
 */
export const animations = {
  fadeIn: "animate-in fade-in duration-200",
  fadeOut: "animate-out fade-out duration-200",
  slideInFromTop: "animate-in slide-in-from-top-2 duration-300",
  slideInFromBottom: "animate-in slide-in-from-bottom-2 duration-300",
  slideInFromLeft: "animate-in slide-in-from-left-2 duration-300",
  slideInFromRight: "animate-in slide-in-from-right-2 duration-300",
  scaleIn: "animate-in zoom-in-95 duration-200",
  scaleOut: "animate-out zoom-out-95 duration-200",
} as const;

/**
 * Responsive breakpoint utilities
 */
export const breakpoints = {
  sm: "(min-width: 640px)",
  md: "(min-width: 768px)",
  lg: "(min-width: 1024px)",
  xl: "(min-width: 1280px)",
  "2xl": "(min-width: 1536px)",
} as const;

/**
 * Hook for responsive media queries
 *
 * @param query - CSS media query string
 * @returns Boolean indicating if the query matches
 */
export function useMediaQuery(query: string): boolean {
  if (typeof window === "undefined") return false;

  const mediaQuery = window.matchMedia(query);
  return mediaQuery.matches;
}

/**
 * Debounce utility for performance optimization
 *
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Format currency for display
 *
 * @param amount - Amount in numeric format
 * @param currency - Currency code (default: EGP)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency = "EGP"): string {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Truncate text to a specified length
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

/**
 * Generate a random ID for components
 *
 * @param prefix - Optional prefix for the ID
 * @returns Random ID string
 */
export function generateId(prefix = "id"): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

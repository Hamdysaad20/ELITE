// Re-export common utilities from componentUtils
export {
  cn,
  formatCurrency,
  truncateText,
  generateId,
  debounce,
  getButtonClassName,
  buttonVariants,
  sizeVariants,
  inputClassName,
  cardClassName,
  animations,
} from "./componentUtils";

// Navigation state management utilities
export function createNavigationState() {
  if (typeof window === "undefined") return null;

  const state = {
    currentPage: window.location.pathname,
    previousPage: sessionStorage.getItem("previousPage") || "",
    navigationCount: parseInt(sessionStorage.getItem("navigationCount") || "0"),
  };

  // Update navigation state
  sessionStorage.setItem("previousPage", state.currentPage);
  sessionStorage.setItem(
    "navigationCount",
    (state.navigationCount + 1).toString(),
  );

  return state;
}

// Clean up navigation state on page unload
export function cleanupNavigationState() {
  if (typeof window === "undefined") return;

  // Clear any stale state
  sessionStorage.removeItem("previousPage");
  sessionStorage.removeItem("navigationCount");
}

// Prevent layout shifts during navigation
export function preventLayoutShift() {
  if (typeof window === "undefined") return;

  const body = document.body;
  if (!body || !body.classList) return;

  // Add loading class to body
  body.classList.add("page-transition", "loading");

  // Remove loading class after a short delay
  setTimeout(() => {
    if (body.classList) {
      body.classList.remove("loading");
      body.classList.add("loaded");
    }
  }, 100);
}

// Reset page state for fresh navigation
export function resetPageState() {
  if (typeof window === "undefined") return;

  const body = document.body;
  if (!body || !body.classList) return;

  // Remove transition classes
  body.classList.remove("page-transition", "loading", "loaded");

  // Reset scroll position
  window.scrollTo(0, 0);

  // Clear any animation states
  const animatedElements = document.querySelectorAll(
    ".drink-overlay-animation",
  );
  animatedElements.forEach((el) => {
    if (el.classList) {
      el.classList.remove("animated");
    }
  });
}

// Define a custom type for the 'metric' parameter
interface WebVitalMetric {
  name: string;
  value: number;
}

// Utility function to log Web Vitals metrics
export function reportWebVitals(metric: WebVitalMetric) {
  switch (metric.name) {
    case "FCP":
      console.log("First Contentful Paint:", metric.value);
      break;
    case "LCP":
      console.log("Largest Contentful Paint:", metric.value);
      break;
    case "FID":
      console.log("First Input Delay:", metric.value);
      break;
    case "CLS":
      console.log("Cumulative Layout Shift:", metric.value);
      break;
    case "TTFB":
      console.log("Time to First Byte:", metric.value);
      break;
    default:
      break;
  }
}

// Initialize Web Vitals
export function initWebVitals() {
  // getCLS(reportWebVitals);
  // getFID(reportWebVitals);
  // getLCP(reportWebVitals);
  // getTTFB(reportWebVitals);
  // getFCP(reportWebVitals);
}

/**
 * Normalizes text to a URL-friendly slug
 * Matches the logic used in image generation script
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')  // Remove all non-word chars
    .replace(/--+/g, '-');    // Replace multiple - with single -
}

/**
 * Extracts the base product name by removing size/variant indicators
 * Matches the logic used in image generation script
 */
export function extractBaseName(name: string): string {
  if (!name) return "";

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

  // Normalize spaces
  return base.replace(/\s+/g, ' ').trim();
}

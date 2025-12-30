/**
 * Application-wide constants and configuration values
 */

// API Configuration
export const API_CONFIG = {
  DEFAULT_USER_ID: "demo-user",
  DEFAULT_TIMEOUT: 10000,
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "/api",
} as const;

// Business Logic Constants
export const CART_CONFIG = {
  MAX_QUANTITY: 99,
  MIN_QUANTITY: 1,
  TAX_RATE: 0.14, // 14% tax
  DEFAULT_DELIVERY_FEE: 15,
} as const;

// UI Constants
export const UI_CONFIG = {
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 300,
  SCROLL_OFFSET: 50,
  ITEMS_PER_PAGE: 20,
} as const;

// Error Messages - Simple, informative, actionable
export const ERROR_MESSAGES = {
  GENERIC: "Something went wrong. Please try again.",
  NETWORK: "Connection problem. Check your internet and try again.",
  TIMEOUT: "Request took too long. Please try again.",
  VALIDATION: "Please check your information and try again.",
  NOT_FOUND: "Item not found.",
  CART_EMPTY: "Your cart is empty. Add items to continue.",
  ADDRESS_REQUIRED: "Please select a delivery address.",
  RATE_LIMIT: "Too many requests. Please wait a moment and try again.",
  ORDER_FAILED: "Could not place order. Please try again.",
  PAYMENT_FAILED: "Payment could not be processed. Please try again.",
  PAYMENT_CANCELLED: "Payment was cancelled. You can try again.",
  PAYMENT_TIMEOUT: "Payment took too long. Please try again.",
  SESSION_EXPIRED: "Your session expired. Please sign in again.",
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  ITEM_ADDED: "Item added to cart successfully",
  ITEM_REMOVED: "Item removed from cart",
  CART_CLEARED: "Cart cleared successfully",
  ORDER_CREATED: "Order created successfully",
} as const;

// Feature Flags
export const FEATURES = {
  ODOO_INTEGRATION: process.env.NODE_ENV === "production",
  AI_SUGGESTIONS: true,
  REVIEWS: true,
  REWARDS: true,
} as const;

// Theme Configuration
export const THEME_CONFIG = {
  COLORS: {
    PRIMARY: "#8B0000", // elite-burgundy
    SECONDARY: "#FDF5E6", // elite-cream
    SUCCESS: "#10B981",
    WARNING: "#F59E0B",
    ERROR: "#EF4444",
    INFO: "#3B82F6",
  },
  BREAKPOINTS: {
    SM: "640px",
    MD: "768px",
    LG: "1024px",
    XL: "1280px",
    "2XL": "1536px",
  },
} as const;

// Menu Configuration
export const MENU_CONFIG = {
  CATEGORIES: {
    DRINKS: "drinks",
    FOOD: "food",
    AT_HOME: "at-home-coffee",
  },
  DEFAULT_SIZE: "Medium",
  IMAGE_PLACEHOLDER: "/images/placeholder.jpg",
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  PHONE: /^[\+]?[1-9][\d]{0,15}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  NOTES_MAX_LENGTH: 500,
} as const;

// Date/Time Configuration
export const DATE_CONFIG = {
  DEFAULT_LOCALE: "en-US",
  TIMEZONE: "Africa/Cairo",
  DATE_FORMAT: "MMM dd, yyyy",
  TIME_FORMAT: "HH:mm",
  DATETIME_FORMAT: "MMM dd, yyyy HH:mm",
} as const;

export const INVENTORY_ROLES = [
  "barista",
  "head_barista",
  "manager",
  "admin",
] as const;
export type InventoryRole = (typeof INVENTORY_ROLES)[number];

export const SHIFTS = ["morning", "evening"] as const;
export type Shift = (typeof SHIFTS)[number];

export const LOCATIONS = ["bar", "storage"] as const;
export type Location = (typeof LOCATIONS)[number];

export const COUNT_METHODS = ["direct", "column_pair", "pack"] as const;
export type CountMethod = (typeof COUNT_METHODS)[number];

export const COUNT_TYPES = ["regular", "audit", "correction"] as const;
export type CountType = (typeof COUNT_TYPES)[number];

export const COUNT_STATUSES = [
  "draft",
  "submitted",
  "reviewed",
  "flagged",
] as const;
export type CountStatus = (typeof COUNT_STATUSES)[number];

export const SHIFT_SESSION_STATUSES = [
  "open",
  "closed",
  "handed_over",
] as const;
export type ShiftSessionStatus = (typeof SHIFT_SESSION_STATUSES)[number];

export const RECEIPT_STATUSES = ["pending", "partial", "received"] as const;
export type ReceiptStatus = (typeof RECEIPT_STATUSES)[number];

export const PAYMENT_METHODS = [
  "cash",
  "transfer",
  "vodafone_cash",
  "deferred",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const WASTE_CATEGORIES = [
  "spilled",
  "expired",
  "damaged",
  "quality",
  "staff_error",
  "overprep",
  "other",
] as const;
export type WasteCategory = (typeof WASTE_CATEGORIES)[number];

export const TRANSFER_UNITS = [
  "column",
  "piece",
  "bottle",
  "kg",
  "liter",
  "carton",
  "can",
  "bag",
  "box",
  "roll",
  "pack",
  "bundle",
  "jar",
] as const;
export type TransferUnit = (typeof TRANSFER_UNITS)[number];

export const ITEM_SECTIONS = [
  "cups_packaging",
  "syrups_sauces",
  "crushes_powders",
  "jello_toppings",
  "coffee_beverages",
  "sweets_additions",
  "fresh_fruits",
  "cleaning_supplies",
  "other",
] as const;
export type ItemSection = (typeof ITEM_SECTIONS)[number];

export const CONSUMPTION_CONFIDENCE = [
  "complete",
  "partial",
  "unreliable",
] as const;
export type ConsumptionConfidence = (typeof CONSUMPTION_CONFIDENCE)[number];

export const WASTE_REASON_PRESETS: Record<WasteCategory, string[]> = {
  spilled: ["barista_dropped", "broken", "spilled_during_prep"],
  expired: ["past_expiry", "went_bad", "opened_too_long"],
  damaged: ["packaging_torn", "damaged_in_storage"],
  quality: ["taste_off", "color_changed"],
  staff_error: ["wrong_order", "wrong_preparation", "wrong_amount"],
  overprep: ["over_prepared", "did_not_sell"],
  other: [],
};

export const DEFAULT_SUPPLIERS = [
  "cups_supplier",
  "syrups_supplier",
  "coffee_supplier",
  "milk_supplier",
  "cleaning_supplier",
  "fruits_supplier",
  "sweets_supplier",
  "general_supplier",
] as const;

export const QUICK_QUANTITIES = [1, 2, 3, 5, 10] as const;

export const SHIFT_CUTOFF_HOUR = 14;

export function suggestShift(): Shift {
  const hour = new Date().getHours();
  return hour < SHIFT_CUTOFF_HOUR ? "morning" : "evening";
}

export function canAccessInventory(role: string | undefined): boolean {
  if (!role) return false;
  return (
    role === "admin" ||
    role === "manager" ||
    role === "barista" ||
    role === "head_barista"
  );
}

export function canAccessStorageCount(role: string | undefined): boolean {
  if (!role) return false;
  return role === "admin" || role === "manager" || role === "head_barista";
}

export function canAccessManagerRoutes(role: string | undefined): boolean {
  if (!role) return false;
  return role === "admin" || role === "manager";
}

export function canAccessAdminRoutes(role: string | undefined): boolean {
  return role === "admin";
}

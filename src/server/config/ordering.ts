export const ORDERING_DISABLED_MESSAGE =
  "Online ordering is temporarily unavailable. Please try again later.";

const DISABLED_VALUES = new Set(["0", "false", "no", "off"]);

export function getOrderingStatus(): {
  orderingEnabled: boolean;
  orderingMessage?: string;
} {
  const raw = process.env.ORDERING_ENABLED;
  const normalized = raw?.trim().toLowerCase() ?? "true";
  const orderingEnabled = !DISABLED_VALUES.has(normalized);

  return {
    orderingEnabled,
    orderingMessage: orderingEnabled ? undefined : ORDERING_DISABLED_MESSAGE,
  };
}

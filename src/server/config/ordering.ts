import { ORDERING_DISABLED_MESSAGE } from "@/lib/constants";

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

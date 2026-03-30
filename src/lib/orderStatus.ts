export const ORDER_STATUS_CANONICAL = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
] as const;

export type CanonicalOrderStatus = (typeof ORDER_STATUS_CANONICAL)[number];

const ALIASES: Record<string, CanonicalOrderStatus> = {
  DELIVERING: "OUT_FOR_DELIVERY",
  COMPLETED: "DELIVERED",
};

const STATUS_PRIORITY: Record<CanonicalOrderStatus, number> = {
  PENDING: 10,
  CONFIRMED: 20,
  PREPARING: 30,
  READY: 40,
  OUT_FOR_DELIVERY: 50,
  DELIVERED: 60,
  CANCELLED: 999,
};

export function normalizeOrderStatus(
  status: string | null | undefined,
): CanonicalOrderStatus {
  const raw = String(status || "").toUpperCase();

  if ((ORDER_STATUS_CANONICAL as readonly string[]).includes(raw)) {
    return raw as CanonicalOrderStatus;
  }

  if (ALIASES[raw]) {
    return ALIASES[raw];
  }

  return "PENDING";
}

export function resolveOrderStatusPriority(
  current: string,
  saleMapped: string | null,
  posMapped: string | null,
): CanonicalOrderStatus {
  const statuses = [current, saleMapped || "", posMapped || ""].map((value) =>
    normalizeOrderStatus(value),
  );

  if (statuses.includes("CANCELLED")) {
    return "CANCELLED";
  }

  return statuses.reduce((prev, curr) =>
    STATUS_PRIORITY[curr] > STATUS_PRIORITY[prev] ? curr : prev,
  );
}

export function isFinalOrderStatus(status: string): boolean {
  const normalized = normalizeOrderStatus(status);
  return normalized === "DELIVERED" || normalized === "CANCELLED";
}

export function mapSaleStateToOrderStatus(
  saleState?: string,
): CanonicalOrderStatus | null {
  switch ((saleState || "").toLowerCase()) {
    case "draft":
    case "sent":
      return "PENDING";
    case "sale":
      return "CONFIRMED";
    case "done":
      return "DELIVERED";
    case "cancel":
      return "CANCELLED";
    default:
      return null;
  }
}

export function mapPosStateToOrderStatus(
  posState?: string,
): CanonicalOrderStatus | null {
  switch ((posState || "").toLowerCase()) {
    case "draft":
      return "PENDING";
    case "paid":
    case "invoiced":
      return "CONFIRMED";
    case "done":
      return "DELIVERED";
    case "cancel":
    case "cancelled":
      return "CANCELLED";
    default:
      return null;
  }
}

export function getAcceptedOrderStatusValues(): string[] {
  return [...ORDER_STATUS_CANONICAL, ...Object.keys(ALIASES)];
}

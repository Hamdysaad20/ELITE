export type TotalStatus =
  | "ok"
  | "warning"
  | "order_now"
  | "backup_order"
  | "empty";

export type BarStatus = "ok" | "bar_empty" | "empty";

export type StatusReason =
  | "minimum_stock"
  | "backup_threshold"
  | "alert_level"
  | "empty"
  | "healthy";

export type AuditWarning =
  | "negative_stock"
  | "missing_minimum"
  | "alert_below_minimum"
  | "target_below_minimum"
  | "never_counted"
  | "stale_count";

export interface InventoryRuleInput {
  unit: string;
  packSize?: number | null;
  minimumStock: number;
  alertLevel: number;
  maximumStock: number;
  backupThreshold?: number | null;
}

export interface StockCalculationInput extends InventoryRuleInput {
  storageQty: number;
  barQty: number;
  averageDailyUsage?: number;
  lastCountedAt?: Date | string | null;
  now?: Date;
}

export interface StockCalculation {
  storageQty: number;
  barQty: number;
  totalQty: number;
  minimumStock: number;
  alertLevel: number;
  targetStock: number;
  fallbackThreshold: number;
  backupThreshold: number;
  totalStatus: TotalStatus;
  barStatus: BarStatus;
  statusReason: StatusReason;
  suggestedOrderQty: number;
  averageDailyUsage: number;
  daysRemaining: number | null;
  auditWarnings: AuditWarning[];
}

const PIECE_UNITS = new Set(["piece", "pieces", "حبة"]);

export function roundQty(value: number): number {
  return Math.round(value * 100) / 100;
}

export function defaultBackupThresholdForUnit(
  unit: string,
  packSize?: number | null,
): number {
  if (PIECE_UNITS.has(unit.toLowerCase()) && packSize && packSize > 1) {
    return packSize;
  }
  return 1;
}

export function calculateStockLevel(
  input: StockCalculationInput,
): StockCalculation {
  const minimumStock = Number(input.minimumStock) || 0;
  const alertLevel = Number(input.alertLevel) || 0;
  const targetStock = Math.max(Number(input.maximumStock) || 0, 0);
  const configuredBackup = Number(input.backupThreshold) || 0;
  const fallbackThreshold =
    configuredBackup > 0
      ? configuredBackup
      : defaultBackupThresholdForUnit(input.unit, input.packSize);
  const storageQty = roundQty(Number(input.storageQty) || 0);
  const barQty = roundQty(Number(input.barQty) || 0);
  const totalQty = roundQty(storageQty + barQty);
  const averageDailyUsage = roundQty(Number(input.averageDailyUsage) || 0);

  let barStatus: BarStatus = "ok";
  if (barQty <= 0 && totalQty <= 0) barStatus = "empty";
  else if (barQty <= 0 && totalQty > 0) barStatus = "bar_empty";

  let totalStatus: TotalStatus = "ok";
  let statusReason: StatusReason = "healthy";
  if (totalQty <= 0) {
    totalStatus = "empty";
    statusReason = "empty";
  } else if (minimumStock > 0 && totalQty <= minimumStock) {
    totalStatus = "order_now";
    statusReason = "minimum_stock";
  } else if (minimumStock <= 0 && totalQty <= fallbackThreshold) {
    totalStatus = "backup_order";
    statusReason = "backup_threshold";
  } else if (alertLevel > 0 && totalQty <= alertLevel) {
    totalStatus = "warning";
    statusReason = "alert_level";
  }

  const effectiveTarget =
    targetStock > 0
      ? targetStock
      : Math.max(minimumStock, alertLevel, fallbackThreshold);
  const suggestedOrderQty =
    totalStatus === "ok" || totalStatus === "warning"
      ? 0
      : roundQty(Math.max(effectiveTarget - totalQty, 0));

  const daysRemaining =
    averageDailyUsage > 0
      ? roundQty(Math.max(totalQty, 0) / averageDailyUsage)
      : null;

  const auditWarnings: AuditWarning[] = [];
  if (totalQty < 0 || storageQty < 0 || barQty < 0) {
    auditWarnings.push("negative_stock");
  }
  if (minimumStock <= 0) auditWarnings.push("missing_minimum");
  if (minimumStock > 0 && alertLevel > 0 && alertLevel < minimumStock) {
    auditWarnings.push("alert_below_minimum");
  }
  if (
    minimumStock > 0 &&
    effectiveTarget > 0 &&
    effectiveTarget < minimumStock
  ) {
    auditWarnings.push("target_below_minimum");
  }

  if (!input.lastCountedAt) {
    auditWarnings.push("never_counted");
  } else {
    const now = input.now ?? new Date();
    const lastCountedAt = new Date(input.lastCountedAt);
    const ageMs = now.getTime() - lastCountedAt.getTime();
    if (Number.isFinite(ageMs) && ageMs > 1000 * 60 * 60 * 24 * 7) {
      auditWarnings.push("stale_count");
    }
  }

  return {
    storageQty,
    barQty,
    totalQty,
    minimumStock,
    alertLevel,
    targetStock: effectiveTarget,
    fallbackThreshold,
    backupThreshold: fallbackThreshold,
    totalStatus,
    barStatus,
    statusReason,
    suggestedOrderQty,
    averageDailyUsage,
    daysRemaining,
    auditWarnings,
  };
}

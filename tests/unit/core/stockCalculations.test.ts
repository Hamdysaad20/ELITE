import { describe, expect, it } from "vitest";
import {
  calculateStockLevel,
  defaultBackupThresholdForUnit,
} from "@/lib/inventory/stockCalculations";

describe("inventory stock calculations", () => {
  it("uses configurable backup thresholds when minimum stock is missing", () => {
    const result = calculateStockLevel({
      unit: "bottle",
      packSize: 1,
      storageQty: 0.5,
      barQty: 0,
      minimumStock: 0,
      alertLevel: 0,
      maximumStock: 6,
      backupThreshold: 0.75,
      lastCountedAt: new Date(),
    });

    expect(result.totalStatus).toBe("backup_order");
    expect(result.statusReason).toBe("backup_threshold");
    expect(result.suggestedOrderQty).toBe(5.5);
    expect(result.auditWarnings).toContain("missing_minimum");
  });

  it("uses pack size as the default backup threshold for piece-based items", () => {
    expect(defaultBackupThresholdForUnit("piece", 50)).toBe(50);
    expect(defaultBackupThresholdForUnit("bottle", 50)).toBe(1);
  });

  it("flags negative stock and invalid rule configuration", () => {
    const result = calculateStockLevel({
      unit: "kg",
      storageQty: -1,
      barQty: 0,
      minimumStock: 5,
      alertLevel: 2,
      maximumStock: 3,
      backupThreshold: 1,
      lastCountedAt: null,
    });

    expect(result.totalStatus).toBe("empty");
    expect(result.auditWarnings).toEqual(
      expect.arrayContaining([
        "negative_stock",
        "alert_below_minimum",
        "target_below_minimum",
        "never_counted",
      ]),
    );
  });

  it("calculates days remaining from recent average usage", () => {
    const result = calculateStockLevel({
      unit: "liter",
      storageQty: 8,
      barQty: 2,
      minimumStock: 4,
      alertLevel: 6,
      maximumStock: 12,
      backupThreshold: 1,
      averageDailyUsage: 2.5,
      lastCountedAt: new Date(),
    });

    expect(result.daysRemaining).toBe(4);
    expect(result.totalStatus).toBe("ok");
  });
});

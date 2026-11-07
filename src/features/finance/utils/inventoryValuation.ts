import type {
  InventoryValuationReport,
  InventoryValuationRow,
  InventoryValuationMetrics,
} from "@/features/finance/types/inventoryValuationTypes";

export type ValuationMetricKey =
  | "openingInventoryValueMmk"
  | "inventoryValueMmk"
  | "purchaseCostMmk"
  | "landedCostMmk"
  | "cogsMmk"
  | "purchaseReturnsMmk"
  | "salesReturnsMmk"
  | "damagedStockValueMmk"
  | "inventoryAdjustmentsMmk"
  | "reconciliationVarianceMmk";

const METRIC_KEYS: ValuationMetricKey[] = [
  "openingInventoryValueMmk",
  "inventoryValueMmk",
  "purchaseCostMmk",
  "landedCostMmk",
  "cogsMmk",
  "purchaseReturnsMmk",
  "salesReturnsMmk",
  "damagedStockValueMmk",
  "inventoryAdjustmentsMmk",
  "reconciliationVarianceMmk",
];

export const parseReportAmount = (
  value: number | null | undefined,
): number | null => {
  if (value === null || value === undefined) return null;
  return Number.isFinite(value) ? value : null;
};

export const formatReportAmount = (
  value: number | null | undefined,
  currency: string,
): string => {
  const parsed = parseReportAmount(value);
  return parsed === null
    ? "Unavailable"
    : `${currency} ${parsed.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
};

/**
 * Combine shop-scoped reports without manufacturing totals. A metric is only
 * available when every requested shop supplied a value. Completeness and
 * missing components are preserved from the service response.
 */
export const combineShopValuationReports = (
  reports: InventoryValuationReport[],
): InventoryValuationReport | null => {
  if (reports.length === 0) return null;

  const metrics = {} as InventoryValuationMetrics;
  METRIC_KEYS.forEach((key) => {
    if (
      key === "landedCostMmk" ||
      key === "salesReturnsMmk" ||
      key === "damagedStockValueMmk" ||
      key === "inventoryAdjustmentsMmk" ||
      key === "reconciliationVarianceMmk"
    ) {
      metrics[key] = null;
      return;
    }
    const values = reports.map((report) => parseReportAmount(report.metrics[key]));
    metrics[key] =
      values.every((value) => value !== null)
        ? values.reduce<number>((total, value) => total + (value as number), 0)
        : null;
  });

  return {
    complete: reports.every((report) => report.complete),
    missingComponents: [...new Set(reports.flatMap((report) => report.missingComponents))],
    coverageFrom: reports.every((report) => report.coverageFrom === reports[0].coverageFrom)
      ? reports[0].coverageFrom
      : null,
    metrics,
    valuation: reports.flatMap((report) => report.valuation),
  };
};

export const isValuationRowInScope = (
  row: InventoryValuationRow,
  authorizedShopIds: string[],
  selectedShopIds: string[],
): boolean => {
  if (!row.shopId) return false;
  const normalizedShopId = row.shopId.trim().toLowerCase();
  const authorized = new Set(
    authorizedShopIds.map((id) => id.trim().toLowerCase()),
  );
  const selected = new Set(selectedShopIds.map((id) => id.trim().toLowerCase()));
  return authorized.has(normalizedShopId) && selected.has(normalizedShopId);
};

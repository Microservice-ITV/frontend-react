import { describe, expect, it } from "vitest";
import {
  combineShopValuationReports,
  formatReportAmount,
  isValuationRowInScope,
} from "./inventoryValuation";
import type {
  InventoryValuationReport,
  InventoryValuationRow,
} from "@/features/finance/types/inventoryValuationTypes";

const makeReport = (
  inventoryValueMmk: number | null,
): InventoryValuationReport => ({
  complete: false,
  missingComponents: ["saleReturnEventsNotAvailableFromSource"],
  coverageFrom: "2026-01-01T00:00:00.000Z",
  metrics: {
    openingInventoryValueMmk: 10,
    inventoryValueMmk,
    purchaseCostMmk: 20,
    landedCostMmk: null,
    cogsMmk: 3,
    purchaseReturnsMmk: 1,
    salesReturnsMmk: null,
    damagedStockValueMmk: null,
    inventoryAdjustmentsMmk: null,
    reconciliationVarianceMmk: null,
  },
  valuation: [],
});

const makeRow = (shopId: string): InventoryValuationRow => ({
  sku: "SKU-1",
  productId: "product-1",
  variantId: "variant-1",
  warehouseId: "warehouse-1",
  shopId,
  onHandQty: 3,
  averageUnitCostMmk: 4,
  inventoryValueMmk: 12,
  valuationVersion: 1,
  asOf: "2026-10-30T00:00:00.000Z",
});

describe("inventory valuation helpers", () => {
  it("keeps unavailable values distinct from a reported zero", () => {
    expect(formatReportAmount(undefined, "MMK")).toBe("Unavailable");
    expect(formatReportAmount(null, "MMK")).toBe("Unavailable");
    expect(formatReportAmount(0, "MMK")).toBe("MMK 0.00");
  });

  it("does not mark an aggregate complete when any authorized shop omits a metric", () => {
    const first = makeReport(120.5);
    first.valuation = [makeRow("shop-a")];
    const second = makeReport(null);
    second.valuation = [makeRow("shop-b")];
    const combined = combineShopValuationReports([first, second]);

    expect(combined?.metrics.inventoryValueMmk).toBeNull();
    expect(combined?.complete).toBe(false);
    expect(combined?.valuation).toHaveLength(2);
  });

  it("sums known MMK metrics while preserving incompleteness metadata", () => {
    const first = makeReport(120.5);
    first.valuation = [makeRow("shop-a")];
    const second = makeReport(9.5);
    second.valuation = [makeRow("shop-b")];
    const combined = combineShopValuationReports([first, second]);

    expect(combined?.metrics.inventoryValueMmk).toBe(130);
    expect(combined?.metrics.purchaseCostMmk).toBe(40);
    expect(combined?.complete).toBe(false);
    expect(combined?.missingComponents).toEqual([
      "saleReturnEventsNotAvailableFromSource",
    ]);
    expect(combined?.valuation).toHaveLength(2);
  });

  it("includes only selected shops that are also authorized", () => {
    const authorized = ["shop-a", "shop-b"];
    expect(
      isValuationRowInScope(
        makeRow("SHOP-A"),
        authorized,
        ["shop-a"],
      ),
    ).toBe(true);
    expect(
      isValuationRowInScope(
        makeRow("shop-c"),
        authorized,
        ["shop-c"],
      ),
    ).toBe(false);
    expect(
      isValuationRowInScope(makeRow(""), authorized, authorized),
    ).toBe(false);
  });
});

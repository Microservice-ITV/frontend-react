/**
 * Response body returned by Accounting's GET /reports/inventory-valuation.
 * The report is a plain JSON body (not the { success, data } warehouse
 * envelope). These fields mirror inventory-valuation.service.ts.
 */
export interface InventoryValuationMetrics {
  openingInventoryValueMmk: number | null;
  inventoryValueMmk: number | null;
  purchaseCostMmk: number | null;
  landedCostMmk: null;
  cogsMmk: number | null;
  purchaseReturnsMmk: number | null;
  salesReturnsMmk: null;
  damagedStockValueMmk: null;
  inventoryAdjustmentsMmk: null;
  reconciliationVarianceMmk: null;
}

export interface InventoryValuationRow {
  sku: string | null;
  productId: string;
  variantId: string;
  warehouseId: string;
  shopId: string;
  onHandQty: number;
  averageUnitCostMmk: number | null;
  inventoryValueMmk: number | null;
  valuationVersion: number;
  asOf: string;
}

export interface InventoryValuationReport {
  complete: boolean;
  missingComponents: string[];
  coverageFrom: string | null;
  totalInventoryQuantity?: number | null;
  totalAvailableQuantity?: number | null;
  quantityAsOf?: string | null;
  inventoryAsOf?: string | null;
  metrics: InventoryValuationMetrics;
  valuation: InventoryValuationRow[];
  movementHistory?: {
    items: InventoryValuationMovement[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface InventoryValuationMovement {
  sourceEventId: string;
  eventType: string;
  movementType: string | null;
  sourceDocumentId: string | null;
  sourceDocumentType: string | null;
  correlationId: string;
  productId: string | null;
  sku: string | null;
  variantId: string | null;
  shopId: string | null;
  warehouseId: string | null;
  quantity: number | null;
  availableQty: number | null;
  onHandQty: number | null;
  reportedUnitCost: number | null;
  currency: string | null;
  occurredAt: string;
  blockReason: string;
}

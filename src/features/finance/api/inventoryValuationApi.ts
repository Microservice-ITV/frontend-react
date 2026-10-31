import { accountingClient } from "@/lib/api/accountingClient";
import type { InventoryValuationReport } from "@/features/finance/types/inventoryValuationTypes";

export interface InventoryValuationReportFilters {
  from: string;
  to: string;
  shopId?: string;
  shopIds?: string[];
  warehouseId?: string;
  sku?: string;
  historyPage?: number;
  historyPageSize?: number;
}

export const inventoryValuationApi = {
  getReport(filters: InventoryValuationReportFilters) {
    return accountingClient.get<InventoryValuationReport>(
      "/reports/inventory-valuation",
      {
        params: {
          from: filters.from,
          to: filters.to,
          ...(filters.shopId ? { shop_id: filters.shopId } : {}),
          ...(filters.shopIds?.length
            ? { shop_ids: filters.shopIds.join(",") }
            : {}),
          ...(filters.warehouseId
            ? { warehouse_id: filters.warehouseId }
            : {}),
          ...(filters.sku ? { sku: filters.sku } : {}),
          ...(filters.historyPage ? { page: filters.historyPage } : {}),
          ...(filters.historyPageSize
            ? { page_size: filters.historyPageSize }
            : {}),
        },
      },
    );
  },
};

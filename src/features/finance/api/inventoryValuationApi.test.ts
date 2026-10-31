import { beforeEach, expect, it, vi } from "vitest";

const get = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/accountingClient", () => ({
  accountingClient: { get },
}));

import { inventoryValuationApi } from "./inventoryValuationApi";

beforeEach(() => {
  get.mockReset();
});

it("uses the accounting valuation route and backend snake_case filter names", () => {
  inventoryValuationApi.getReport({
    from: "2026-10-01T00:00:00.000Z",
    to: "2026-10-30T23:59:59.999Z",
    shopIds: ["authorized-shop", "second-authorized-shop"],
    warehouseId: "warehouse-1",
    sku: "SKU-1",
    historyPage: 2,
    historyPageSize: 10,
  });

  expect(get).toHaveBeenCalledWith(
    "/reports/inventory-valuation",
    {
      params: {
        from: "2026-10-01T00:00:00.000Z",
        to: "2026-10-30T23:59:59.999Z",
        shop_ids: "authorized-shop,second-authorized-shop",
        warehouse_id: "warehouse-1",
        sku: "SKU-1",
        page: 2,
        page_size: 10,
      },
    },
  );
});

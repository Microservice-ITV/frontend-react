import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const mocks = vi.hoisted(() => ({
  authGet: vi.fn(),
  getInventoryReport: vi.fn(),
  role: "FINANCE_MANAGER",
}));

vi.mock("@/app/hooks", () => ({
  useAppSelector: (selector: (state: unknown) => unknown) =>
    selector({ auth: { user: { id: "manager-1", active_shop_id: "shop-a" } } }),
}));

vi.mock("@/app/rbac/normalizers", () => ({
  extractRoleFromUser: () => mocks.role,
}));

vi.mock("@/lib/api/authClient", () => ({
  authClient: { get: mocks.authGet },
}));

vi.mock("@/features/finance/api/inventoryValuationApi", () => ({
  inventoryValuationApi: { getReport: mocks.getInventoryReport },
}));

import InventoryValuationPage from "./InventoryValuationPage";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mocks.role = "FINANCE_MANAGER";
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <InventoryValuationPage />
    </MemoryRouter>,
  );

const mockAccess = (shopId = "shop-a") => {
  mocks.authGet.mockResolvedValue({
    data: {
      data: {
        access_context: {
          shops: [{ shop_id: shopId, shop_name: "Shop A" }],
          active_shop: { shop_id: shopId },
        },
      },
    },
  });
};

it("loads authorized Accounting valuation and source history without consulting Warehouse APIs", async () => {
  mockAccess();
  mocks.getInventoryReport.mockResolvedValue({
    data: {
      complete: false,
      missingComponents: ["landedCostSourceUnavailable"],
      coverageFrom: "2026-01-01T00:00:00.000Z",
      totalInventoryQuantity: 4,
      totalAvailableQuantity: 3,
      quantityAsOf: "2026-10-30T12:00:00.000Z",
      inventoryAsOf: "2026-10-30T12:00:00.000Z",
      metrics: {
        inventoryValueMmk: 1200,
        purchaseCostMmk: 300,
        landedCostMmk: null,
        cogsMmk: 100,
        purchaseReturnsMmk: 0,
        salesReturnsMmk: null,
        damagedStockValueMmk: null,
        inventoryAdjustmentsMmk: null,
        openingInventoryValueMmk: 900,
        reconciliationVarianceMmk: null,
      },
      valuation: [{
        sku: "RICE-001",
        productId: "product-1",
        variantId: "variant-1",
        warehouseId: "warehouse-1",
        shopId: "shop-a",
        onHandQty: 4,
        averageUnitCostMmk: 300,
        inventoryValueMmk: 1200,
        valuationVersion: 3,
        asOf: "2026-10-30T12:00:00.000Z",
      }],
      movementHistory: {
        items: [{
          sourceEventId: "receipt-event-1",
          eventType: "purchase.goods_received",
          movementType: "PURCHASE_RECEIVED",
          sourceDocumentId: "receipt-1",
          sourceDocumentType: "PURCHASE_RECEIPT",
          correlationId: "receipt-1",
          productId: "product-1",
          sku: null,
          variantId: "variant-1",
          shopId: "shop-a",
          warehouseId: "warehouse-1",
          quantity: 2,
          availableQty: null,
          onHandQty: null,
          reportedUnitCost: 12.5,
          currency: null,
          occurredAt: "2026-10-30T09:59:00.000Z",
          blockReason: "Currency is not present.",
        }],
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      },
    },
  });

  renderPage();

  expect(await screen.findAllByText("MMK 1,200.00")).toHaveLength(2);
  expect(screen.getByText("RICE-001")).toBeInTheDocument();
  expect(screen.getAllByText("warehouse-1").length).toBeGreaterThan(0);
  expect(screen.getAllByText("Shop A").length).toBeGreaterThan(0);
  expect(screen.getByText("Total Inventory Quantity")).toBeInTheDocument();
  expect(screen.getByText("Inventory movement history")).toBeInTheDocument();
  expect(screen.getByText("PURCHASE_RECEIVED")).toBeInTheDocument();
  expect(screen.getByText("Unknown")).toBeInTheDocument();
  await waitFor(() => expect(mocks.getInventoryReport).toHaveBeenCalledTimes(1));
  expect(mocks.getInventoryReport.mock.calls[0][0].shopIds).toEqual(["shop-a"]);
  expect(mocks.getInventoryReport.mock.calls[0][0].historyPageSize).toBe(20);
});

it("does not display accounting data after a report authorization failure", async () => {
  mocks.role = "SHOP_OWNER";
  mockAccess("shop-a");
  mocks.getInventoryReport.mockRejectedValue({
    response: {
      status: 403,
      data: { error: "User is not authorized for the selected shop" },
    },
  });

  renderPage();

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "User is not authorized for the selected shop",
  );
  expect(
    screen.queryByText("Accounting inventory data could not be loaded."),
  ).not.toBeInTheDocument();
  expect(screen.queryByText("Inventory movement history")).not.toBeInTheDocument();
  expect(mocks.getInventoryReport.mock.calls[0][0].shopIds).toEqual(["shop-a"]);
});

it("shows an empty state when Accounting has no valuation or source history", async () => {
  mockAccess();
  mocks.getInventoryReport.mockResolvedValue({
    data: {
      complete: false,
      missingComponents: ["inventoryValueSnapshotUnavailable"],
      coverageFrom: null,
      totalInventoryQuantity: null,
      totalAvailableQuantity: null,
      quantityAsOf: null,
      inventoryAsOf: null,
      metrics: {
        inventoryValueMmk: null,
        purchaseCostMmk: null,
        landedCostMmk: null,
        cogsMmk: null,
        purchaseReturnsMmk: null,
        salesReturnsMmk: null,
        damagedStockValueMmk: null,
        inventoryAdjustmentsMmk: null,
        openingInventoryValueMmk: null,
        reconciliationVarianceMmk: null,
      },
      valuation: [],
      movementHistory: {
        items: [],
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 0,
      },
    },
  });

  renderPage();

  expect(await screen.findByText(/No verified valuation rows/)).toBeInTheDocument();
  expect(screen.getByText("No Accounting source events match these filters.")).toBeInTheDocument();
});

import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const mocks = vi.hoisted(() => ({
  accountingGet: vi.fn(),
  authGet: vi.fn(),
  listExpenses: vi.fn(),
  listPendingApprovals: vi.fn(),
}));

vi.mock("@/app/hooks", () => ({
  useAppSelector: (selector: (state: unknown) => unknown) =>
    selector({
      auth: {
        user: { id: "manager-1", active_shop_id: "shop-a" },
      },
    }),
}));

vi.mock("@/app/rbac/normalizers", () => ({
  extractRoleFromUser: () => "FINANCE_MANAGER",
}));

vi.mock("@/app/rbac/hooks", () => ({
  useCan: () => false,
}));

vi.mock("@/lib/api/authClient", () => ({
  authClient: { get: mocks.authGet },
}));

vi.mock("@/lib/api/accountingClient", () => ({
  accountingClient: { get: mocks.accountingGet },
}));

vi.mock("@/features/accounting/adapters/accountingExpensesAdapter", () => ({
  accountingExpensesAdapter: {
    list: mocks.listExpenses,
    listPendingApprovals: mocks.listPendingApprovals,
  },
}));

import ShopFinanceDashboardPage from "./ShopFinanceDashboardPage";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it("keeps inventory valuation off the Finance Dashboard", async () => {
  mocks.authGet.mockResolvedValue({
    data: {
      data: {
        access_context: {
          active_shop: { shop_id: "shop-a" },
          shops: [
            { shop_id: "shop-a", shop_name: "Shop A" },
            { shop_id: "shop-b", shop_name: "Shop B" },
          ],
        },
      },
    },
  });
  mocks.accountingGet.mockResolvedValue({
    data: {
      reports: [
        {
          currency: "MMK",
          revenue: { grossSales: 0 },
          actualRevenue: 0,
          profit: { currentProfitOrLoss: 0 },
          expenses: { operatingExpenses: 0 },
          breakdown: [],
          entries: [],
        },
      ],
      entries: [
        {
          id: "income-1",
          direction: "CREDIT",
          amount: "67.94",
          currency: "MMK",
          account: { code: "4000", name: "Revenue", type: "INCOME" },
          memo: "COD sales revenue (shop=shop-a)",
          journalEntry: {
            referenceType: "COD_REVENUE",
            referenceId: "revenue-1",
            narration: "COD revenue",
            entryDate: "2026-10-29T00:00:00.000Z",
            status: "POSTED",
          },
        },
      ],
    },
  });
  mocks.listExpenses.mockResolvedValue([]);
  mocks.listPendingApprovals.mockResolvedValue([]);

  render(
    <MemoryRouter>
      <ShopFinanceDashboardPage />
    </MemoryRouter>,
  );

  expect(
    await screen.findByRole("heading", { name: "Finance Manager Dashboard" }),
  ).toBeInTheDocument();
  expect(screen.getByText("MMK 67.94")).toBeInTheDocument();
  expect(
    screen.getByText("Total Income").closest(".rounded-xl"),
  ).toHaveClass("bg-emerald-50");
  expect(
    screen.queryByRole("heading", { name: "Inventory valuation" }),
  ).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Warehouse")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("SKU")).not.toBeInTheDocument();
  const profitLossRequest = mocks.accountingGet.mock.calls.find(
    ([path, config]) => path === "/reports/profit-loss" && config?.params,
  );
  expect(profitLossRequest?.[1].params.shopId).toBeUndefined();
});

import { describe, expect, it } from "vitest";
import {
  toSellerTransactionRows,
} from "./SellerFinanceTransactionsPage";
import type { AccountingIncomeLine } from "@/features/accounting/types/accountingTypes";

const line = (
  overrides: Partial<AccountingIncomeLine> = {},
): AccountingIncomeLine => ({
  id: "line-1",
  direction: "CREDIT",
  amount: "50000",
  currency: "MMK",
  memo: "Customer payment (shop=shop-1)",
  account: { code: "4000", name: "Sales revenue", type: "INCOME" },
  journalEntry: {
    referenceType: "ORDER",
    referenceId: "order-1",
    narration: "Customer payment",
    entryDate: "2026-10-19T00:00:00.000Z",
    status: "POSTED",
  },
  ...overrides,
});

describe("seller accounting transactions", () => {
  it("maps authorized income and expense ledger lines to money in and out", () => {
    const rows = toSellerTransactionRows(
      [
        line(),
        line({
          id: "line-2",
          direction: "DEBIT",
          amount: "5000",
          memo: "Delivery expense (shop=shop-1)",
          account: { code: "5000", name: "Delivery expense", type: "EXPENSE" },
        }),
      ],
      new Set(["shop-1"]),
    );

    expect(rows).toHaveLength(2);
    expect(rows.map(({ direction, amount }) => ({ direction, amount }))).toEqual([
      { direction: "Money In", amount: 50000 },
      { direction: "Money Out", amount: 5000 },
    ]);
  });

  it("shows ledger reference IDs instead of long memo descriptions", () => {
    const [income, expense] = toSellerTransactionRows(
      [
        line({
          memo: "COD sales revenue recognized on order confirmation",
        }),
        line({
          id: "line-2",
          direction: "DEBIT",
          account: { code: "5000", name: "Delivery expense", type: "EXPENSE" },
          journalEntry: {
            referenceType: "EXPENSE",
            referenceId: "DELI-INVOICE-20261009-0003",
            narration: "Delivery expense",
            entryDate: "2026-10-19T00:00:00.000Z",
            status: "POSTED",
          },
        }),
      ],
      new Set(["shop-1"]),
    );

    expect(income.description).toBe("ORDER-191026-0001");
    expect(expense.description).toBe("DELI-INVOICE-091026-0003");
  });

  it("excludes transactions for shops the seller cannot access", () => {
    expect(toSellerTransactionRows([line()], new Set(["another-shop"]))).toEqual(
      [],
    );
  });

  it("uses the sole authorized shop when the ledger line has no shop metadata", () => {
    const row = line({ memo: null });

    expect(toSellerTransactionRows([row], new Set(["shop-1"]))).toHaveLength(1);
  });
});

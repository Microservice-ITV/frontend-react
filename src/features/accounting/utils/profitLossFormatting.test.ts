import { describe, expect, it } from "vitest";
import type { ProfitLossCurrencyReport } from "../types/accountingTypes";
import {
  getProfitSummaryCardColors,
  mergeProfitLossReports,
} from "./profitLossFormatting";

const report = (
  currency: string,
  amounts: { grossSales: number; revenue: number; expenses: number },
): ProfitLossCurrencyReport => ({
  currency,
  complete: false,
  missingComponents: ["shipping"],
  revenue: {
    grossSales: amounts.grossSales,
    discounts: 0,
    netSales: amounts.grossSales,
    refunds: null,
    tax: null,
    platformFundedItemDiscounts: 0,
    sellerFundedShippingDiscounts: 0,
    platformFundedShippingDiscounts: 0,
  },
  actualRevenue: amounts.revenue,
  refunds: null,
  tax: null,
  expenses: {
    operatingExpenses: amounts.expenses,
    cogs: null,
    paymentFees: null,
    commission: null,
    shipping: null,
  },
  profit: {
    currentProfitOrLoss: amounts.revenue - amounts.expenses,
    grossProfit: null,
    netProfit: null,
    ledgerProfit: {
      totalIncome: amounts.revenue,
      totalExpense: amounts.expenses,
      netProfit: amounts.revenue - amounts.expenses,
      label: "Partial profit/loss",
    },
  },
  commissionStatus: "unresolved",
  breakdown: [{
    period: "2026-10-01",
    grossSales: amounts.grossSales,
    discounts: 0,
    refunds: null,
    cogs: null,
    paymentFees: null,
    shipping: null,
    platformFundedItemDiscounts: 0,
    sellerFundedShippingDiscounts: 0,
    platformFundedShippingDiscounts: 0,
    actualRevenue: amounts.revenue,
    operatingExpenses: amounts.expenses,
    currentProfitOrLoss: amounts.revenue - amounts.expenses,
  }],
});

describe("mergeProfitLossReports", () => {
  it("combines currency buckets and presents their totals as MMK", () => {
    const merged = mergeProfitLossReports([
      report("MMK", { grossSales: 1000, revenue: 900, expenses: 100 }),
      report("USD", { grossSales: 50, revenue: 40, expenses: 5 }),
    ]);

    expect(merged?.currency).toBe("MMK");
    expect(merged?.revenue.grossSales).toBe(1050);
    expect(merged?.actualRevenue).toBe(940);
    expect(merged?.expenses.operatingExpenses).toBe(105);
    expect(merged?.profit.currentProfitOrLoss).toBe(835);
    expect(merged?.breakdown).toHaveLength(1);
    expect(merged?.breakdown[0]).toMatchObject({
      grossSales: 1050,
      actualRevenue: 940,
      operatingExpenses: 105,
      currentProfitOrLoss: 835,
    });

  });

  it("returns no report when the service returns no currency buckets", () => {
    expect(mergeProfitLossReports([])).toBeUndefined();
  });
});

describe("profit and loss summary card colors", () => {
  it("uses green for profit", () => {
    expect(getProfitSummaryCardColors(100)).toMatchObject({
      card: expect.stringContaining("emerald"),
      icon: "text-emerald-600",
      value: "text-emerald-700",
    });
  });

  it("uses red for loss", () => {
    expect(getProfitSummaryCardColors(-100)).toMatchObject({
      card: expect.stringContaining("red"),
      icon: "text-red-600",
      value: "text-red-700",
    });
  });

  it("uses neutral colors when profit is zero or unavailable", () => {
    expect(getProfitSummaryCardColors(0).card).toContain("slate");
    expect(getProfitSummaryCardColors(null).value).toBe("text-slate-900");
  });
});

import type { ProfitLossCurrencyReport } from "../types/accountingTypes";

export const formatProfitLossValue = (value: number | null) =>
  value === null
    ? 'Not available'
    : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const getProfitSummaryCardColors = (profit: number | null) => {
  if (profit === null) {
    return {
      card: 'border-slate-200 bg-gradient-to-br from-slate-50/80 to-white',
      icon: 'text-slate-500',
      value: 'text-slate-900',
    }
  }
  if (profit < 0) {
    return {
      card: 'border-red-100 bg-gradient-to-br from-red-50/80 to-white',
      icon: 'text-red-600',
      value: 'text-red-700',
    }
  }
  if (profit > 0) {
    return {
      card: 'border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white',
      icon: 'text-emerald-600',
      value: 'text-emerald-700',
    }
  }
  return {
    card: 'border-slate-200 bg-gradient-to-br from-slate-50/80 to-white',
    icon: 'text-slate-500',
    value: 'text-slate-900',
  }
}

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

const sumNullable = (values: Array<number | null>) =>
  values.every((value): value is number => value !== null)
    ? sum(values)
    : null;

export const mergeProfitLossReports = (
  reports: ProfitLossCurrencyReport[],
): ProfitLossCurrencyReport | undefined => {
  const [firstReport] = reports;
  if (!firstReport) return undefined;

  const breakdownByPeriod = new Map<string, ProfitLossCurrencyReport["breakdown"]>();
  for (const report of reports) {
    for (const point of report.breakdown) {
      const periodPoints = breakdownByPeriod.get(point.period) ?? [];
      periodPoints.push(point);
      breakdownByPeriod.set(point.period, periodPoints);
    }
  }

  const breakdown = [...breakdownByPeriod.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([period, points]) => ({
      period,
      grossSales: sum(points.map((point) => point.grossSales)),
      discounts: sumNullable(points.map((point) => point.discounts)),
      refunds: null,
      cogs: null,
      paymentFees: null,
      shipping: null,
      platformFundedItemDiscounts: sumNullable(points.map((point) => point.platformFundedItemDiscounts)),
      sellerFundedShippingDiscounts: sumNullable(points.map((point) => point.sellerFundedShippingDiscounts)),
      platformFundedShippingDiscounts: sumNullable(points.map((point) => point.platformFundedShippingDiscounts)),
      actualRevenue: sum(points.map((point) => point.actualRevenue)),
      operatingExpenses: sum(points.map((point) => point.operatingExpenses)),
      currentProfitOrLoss: sum(points.map((point) => point.currentProfitOrLoss)),
    }));

  return {
    ...firstReport,
    currency: "MMK",
    missingComponents: [...new Set(reports.flatMap((report) => report.missingComponents))],
    revenue: {
      ...firstReport.revenue,
      grossSales: sum(reports.map((report) => report.revenue.grossSales)),
      discounts: sumNullable(reports.map((report) => report.revenue.discounts)),
      netSales: sumNullable(reports.map((report) => report.revenue.netSales)),
      platformFundedItemDiscounts: sumNullable(reports.map((report) => report.revenue.platformFundedItemDiscounts)),
      sellerFundedShippingDiscounts: sumNullable(reports.map((report) => report.revenue.sellerFundedShippingDiscounts)),
      platformFundedShippingDiscounts: sumNullable(reports.map((report) => report.revenue.platformFundedShippingDiscounts)),
    },
    actualRevenue: sum(reports.map((report) => report.actualRevenue)),
    expenses: {
      ...firstReport.expenses,
      operatingExpenses: sum(reports.map((report) => report.expenses.operatingExpenses)),
    },
    profit: {
      ...firstReport.profit,
      currentProfitOrLoss: sum(reports.map((report) => report.profit.currentProfitOrLoss)),
      ledgerProfit: {
        ...firstReport.profit.ledgerProfit,
        totalIncome: sum(reports.map((report) => report.profit.ledgerProfit.totalIncome)),
        totalExpense: sum(reports.map((report) => report.profit.ledgerProfit.totalExpense)),
        netProfit: sum(reports.map((report) => report.profit.ledgerProfit.netProfit)),
      },
    },
    breakdown,
  };
};

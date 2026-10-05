import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ProfitLossCurrencyReport, ProfitLossOverviewResponse } from "../types/accountingTypes";
import type { AccountingExpense } from "../types/expenseTypes";
import { accountingExpensesAdapter } from "../adapters/accountingExpensesAdapter";
import { accountingClient } from "@/lib/api/accountingClient";
import { Download, RefreshCw, TrendingUp, Wallet, CircleDollarSign, ChartColumnIncreasing, CalendarDays } from "lucide-react";
import * as XLSX from "xlsx";

type PeriodRow = ProfitLossCurrencyReport["breakdown"][number];
type ReportQuery = {
  from: string;
  to: string;
  groupBy: "day" | "month";
};
type ExpenseSlice = {
  name: string;
  value: number;
  percentage: number;
  color: string;
};

const COLORS = ["#5791f5", "#ffb454", "#9277e8", "#32c4aa", "#f16c98", "#7cb7d9"];

const localDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addDays = (date: string, amount: number) => {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
};

const toUtcBoundary = (date: string) => `${date}T00:00:00.000Z`;

const formatDate = (value: string, groupBy: "day" | "month" = "day") => {
  const date = new Date(`${value}${value.length === 7 ? "-01" : ""}T00:00:00.000Z`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-US", groupBy === "month"
      ? { month: "short", year: "numeric", timeZone: "UTC" }
      : { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
};

const money = (value: number, currency: string) =>
  `${currency} ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const getErrorMessage = (error: unknown) => {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { error?: unknown } } }).response;
    if (typeof response?.data?.error === "string") return response.data.error;
  }
  return error instanceof Error && error.message ? error.message : "Unable to load the profit and loss report.";
};

const periodDays = (from: string, to: string) => {
  const start = new Date(toUtcBoundary(from)).getTime();
  const end = new Date(toUtcBoundary(addDays(to, 1))).getTime();
  return Math.max(1, Math.round((end - start) / 86_400_000));
};

const reportQuery = (from: string, to: string): ReportQuery => ({
  from: toUtcBoundary(from),
  to: toUtcBoundary(addDays(to, 1)),
  groupBy: periodDays(from, to) <= 62 ? "day" : "month",
});

const previousQuery = (from: string, to: string): ReportQuery => {
  const days = periodDays(from, to);
  return reportQuery(addDays(from, -days), addDays(from, -1));
};

const fetchReport = async (query: ReportQuery) => {
  const response = await accountingClient.get<ProfitLossOverviewResponse>("/reports/profit-loss", {
    params: query,
  });
  return response.data;
};

const reportTotal = (report: ProfitLossCurrencyReport | undefined) => ({
  revenue: report?.actualRevenue ?? 0,
  grossSales: report?.revenue.grossSales ?? 0,
  expenses: report?.expenses.operatingExpenses ?? 0,
  profit: report?.profit.currentProfitOrLoss ?? 0,
});

const comparisonLabel = (current: number, previous: number) => {
  if (previous === 0) return current === 0 ? "0% vs. previous period" : "New vs. previous period";
  const change = ((current - previous) / Math.abs(previous)) * 100;
  return `${change >= 0 ? "+" : ""}${change.toFixed(1)}% vs. previous period`;
};

const getExpenseSlices = (
  expenses: AccountingExpense[],
  report: ProfitLossCurrencyReport | undefined,
  from: string,
  to: string,
): ExpenseSlice[] => {
  if (!report) return [];

  const amounts = new Map<string, number>();
  for (const expense of expenses) {
    if (
      expense.status !== "APPROVED" ||
      expense.scope === "PLATFORM" ||
      expense.expenseDate.slice(0, 10) < from ||
      expense.expenseDate.slice(0, 10) > to ||
      (report && expense.currency !== report.currency)
    ) continue;

    const label = expense.expenseType?.name ?? "Other operating expenses";
    amounts.set(label, (amounts.get(label) ?? 0) + Number(expense.amount));
  }

  const entries = [...amounts.entries()].sort((left, right) => right[1] - left[1]);
  const total = entries.reduce((sum, [, amount]) => sum + amount, 0);
  return entries.map(([name, value], index) => ({
    name,
    value,
    percentage: total > 0 ? (value / total) * 100 : 0,
    color: COLORS[index % COLORS.length],
  }));
};

const SellerProfitLossPage = () => {
  const today = new Date();
  const [fromDate, setFromDate] = useState(() => localDateInput(new Date(today.getFullYear(), today.getMonth(), 1)));
  const [toDate, setToDate] = useState(() => localDateInput(today));
  const [report, setReport] = useState<ProfitLossOverviewResponse | null>(null);
  const [previousReport, setPreviousReport] = useState<ProfitLossOverviewResponse | null>(null);
  const [expenses, setExpenses] = useState<AccountingExpense[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [status, setStatus] = useState<"loading" | "succeeded" | "failed">("loading");
  const [error, setError] = useState<string | null>(null);
  const [comparisonError, setComparisonError] = useState(false);
  const [expenseError, setExpenseError] = useState(false);

  const loadReport = async () => {
    setStatus("loading");
    setError(null);
    setComparisonError(false);
    setExpenseError(false);

    try {
      const query = reportQuery(fromDate, toDate);
      const priorQuery = previousQuery(fromDate, toDate);
      const [currentResult, previousResult, expensesResult] = await Promise.allSettled([
        fetchReport(query),
        fetchReport(priorQuery),
        accountingExpensesAdapter.list(),
      ]);

      if (currentResult.status === "rejected") throw currentResult.reason;
      setReport(currentResult.value);
      if (previousResult.status === "fulfilled") {
        setPreviousReport(previousResult.value);
      } else {
        setPreviousReport(null);
        setComparisonError(true);
      }
      if (expensesResult.status === "fulfilled") {
        setExpenses(expensesResult.value);
      } else {
        setExpenses([]);
        setExpenseError(true);
      }
      setStatus("succeeded");
    } catch (cause) {
      setReport(null);
      setPreviousReport(null);
      setExpenses([]);
      setStatus("failed");
      setError(getErrorMessage(cause));
    }
  };

  useEffect(() => {
    void loadReport();
  }, [fromDate, toDate]);

  const currencyReports = report?.reports ?? [];
  const activeCurrency = currencyReports.some((item) => item.currency === selectedCurrency)
    ? selectedCurrency
    : currencyReports[0]?.currency ?? "";
  const availableCurrencies = currencyReports.map((item) => item.currency);
  const activeReport = currencyReports.find((item) => item.currency === activeCurrency);
  const previousCurrencyReport = previousReport?.reports.find((item) => item.currency === activeCurrency);
  const totals = reportTotal(activeReport);
  const priorTotals = reportTotal(previousCurrencyReport);
  const comparisonText = (current: number, previous: number) =>
    comparisonError
      ? "Comparison unavailable"
      : previousCurrencyReport
        ? comparisonLabel(current, previous)
        : "No previous-period data";
  const rangeQuery = report ? reportQuery(fromDate, toDate) : null;
  const groupBy = rangeQuery?.groupBy ?? "day";

  const rows = useMemo(() => activeReport?.breakdown ?? [], [activeReport]);
  const expenseSlices = useMemo(
    () => getExpenseSlices(expenses, activeReport, fromDate, toDate),
    [activeReport, expenses, fromDate, toDate],
  );
  const chartRows = useMemo(() => rows.map((row) => ({
    ...row,
    label: groupBy === "month" ? formatDate(row.period, "month") : formatDate(row.period, "day"),
  })), [groupBy, rows]);

  const exportReport = () => {
    const content = [
      ["Period", "Gross sales", "Seller item discounts", "Actual recognized revenue", "Operating expenses", "Net profit (partial)", "Currency"],
      ...rows.map((row) => [
        row.period,
        row.grossSales,
        row.discounts ?? "",
        row.actualRevenue,
        row.operatingExpenses,
        row.currentProfitOrLoss,
        activeCurrency,
      ]),
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(content);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Profit and Loss");
    XLSX.writeFile(workbook, `profit-loss-${fromDate}-to-${toDate}.xlsx`);
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-pink-50 p-2.5 text-pink-500">
            <ChartColumnIncreasing size={23} />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Profit &amp; Loss</h1>
            <p className="mt-1 text-sm text-slate-500">
              Track your shop&apos;s financial performance for the selected period.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
            <CalendarDays size={15} className="text-slate-400" />
            <span className="sr-only">Start date</span>
            <input
              type="date"
              aria-label="Start date"
              value={fromDate}
              max={toDate}
              onChange={(event) => {
                if (event.target.value) setFromDate(event.target.value);
              }}
              className="min-w-0 bg-transparent outline-none"
            />
            <span>–</span>
            <span className="sr-only">End date</span>
            <input
              type="date"
              aria-label="End date"
              value={toDate}
              min={fromDate}
              onChange={(event) => {
                if (event.target.value) setToDate(event.target.value);
              }}
              className="min-w-0 bg-transparent outline-none"
            />
          </label>
          {availableCurrencies.length > 1 && (
            <label className="sr-only" htmlFor="profit-loss-currency">Currency</label>
          )}
          {availableCurrencies.length > 1 && (
            <select
              id="profit-loss-currency"
              aria-label="Currency"
              value={activeCurrency}
              onChange={(event) => setSelectedCurrency(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
            >
              {availableCurrencies.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
            </select>
          )}
          <button
            type="button"
            onClick={exportReport}
            disabled={status !== "succeeded" || rows.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-pink-500 px-3 py-2 text-xs font-semibold text-white hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={14} />
            Export
          </button>
          <button
            type="button"
            aria-label="Refresh report"
            onClick={() => void loadReport()}
            disabled={status === "loading"}
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={15} className={status === "loading" ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {(comparisonError || expenseError) && (
        <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {comparisonError && "Previous-period comparison is unavailable. "}
          {expenseError && "Expense category breakdown is unavailable."}
        </p>
      )}
      {report && (
        <p className="rounded-lg border border-blue-100 bg-blue-50/70 px-4 py-3 text-xs leading-5 text-blue-900">
          This is a partial profit and loss report. Refunds, tax, cost of goods sold, payment fees, commission, and shipping costs are not yet included; currencies are reported separately and are not converted.
        </p>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Revenue"
          value={status === "loading" ? "Loading…" : activeReport ? money(totals.revenue, activeCurrency) : "—"}
          comparison={comparisonText(totals.revenue, priorTotals.revenue)}
          icon={TrendingUp}
          colors="border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white text-emerald-600"
        />
        <SummaryCard
          label="Total Cost"
          value={status === "loading" ? "Loading…" : activeReport ? money(totals.expenses, activeCurrency) : "—"}
          comparison={comparisonText(totals.expenses, priorTotals.expenses)}
          icon={Wallet}
          colors="border-blue-100 bg-gradient-to-br from-blue-50/80 to-white text-blue-600"
        />
        <SummaryCard
          label="Gross Sales"
          value={status === "loading" ? "Loading…" : activeReport ? money(totals.grossSales, activeCurrency) : "—"}
          comparison={comparisonText(totals.grossSales, priorTotals.grossSales)}
          icon={CircleDollarSign}
          colors="border-orange-100 bg-gradient-to-br from-orange-50/80 to-white text-orange-600"
        />
        <SummaryCard
          label="Net Profit*"
          value={status === "loading" ? "Loading…" : activeReport ? money(totals.profit, activeCurrency) : "—"}
          comparison={comparisonText(totals.profit, priorTotals.profit)}
          icon={Wallet}
          colors="border-pink-100 bg-gradient-to-br from-pink-50/80 to-white text-pink-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 xl:col-span-3">
          <h2 className="text-sm font-bold text-slate-900">Profit &amp; Loss Trend</h2>
          <p className="mt-1 text-xs text-slate-500">Recognized revenue, operating expenses, and partial net profit.</p>
          <div className="mt-4 h-64 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartRows} margin={{ top: 8, right: 6, left: 6, bottom: 4 }}>
                <CartesianGrid stroke="#e8edf5" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b" }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  width={58}
                  tickFormatter={(value: number) => value.toLocaleString("en-US", { notation: "compact" })}
                />
                <Tooltip
                  formatter={(value) => money(Number(value), activeCurrency)}
                  contentStyle={{ borderRadius: 10, borderColor: "#e2e8f0", fontSize: 11 }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Bar dataKey="actualRevenue" name="Revenue" fill="#5791f5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="operatingExpenses" name="Cost" fill="#32c4aa" radius={[4, 4, 0, 0]} />
                <Bar dataKey="currentProfitOrLoss" name="Net Profit (partial)" fill="#f16c98" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            {status === "succeeded" && chartRows.length === 0 && (
              <p className="mt-[-8rem] text-center text-sm text-slate-400">No report activity in this period.</p>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 xl:col-span-2">
          <h2 className="text-sm font-bold text-slate-900">Expense Breakdown</h2>
          <p className="mt-1 text-xs text-slate-500">Approved operating expenses by category.</p>
          <div className="mt-3 grid grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(150px,0.9fr)_minmax(0,1.1fr)]">
            <div className="relative h-52 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseSlices}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={57}
                    outerRadius={82}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {expenseSlices.map((slice) => <Cell key={slice.name} fill={slice.color} />)}
                  </Pie>
                  <Tooltip formatter={(value) => money(Number(value), activeCurrency)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] text-slate-500">Total Expenses</span>
                <strong className="mt-1 text-sm text-slate-900">{money(totals.expenses, activeCurrency || "—")}</strong>
              </div>
            </div>
            <ul className="space-y-3">
              {expenseSlices.slice(0, 5).map((slice) => (
                <li key={slice.name} className="flex items-center gap-2 text-[11px]">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
                  <span className="min-w-0 flex-1 truncate text-slate-600" title={slice.name}>{slice.name}</span>
                  <span className="shrink-0 font-semibold text-slate-700">{slice.percentage.toFixed(1)}%</span>
                  <span className="w-20 shrink-0 text-right text-slate-500">{slice.value.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
                </li>
              ))}
              {status === "succeeded" && expenseSlices.length === 0 && (
                <li className="text-xs text-slate-400">No approved expenses in this period.</li>
              )}
            </ul>
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-slate-900">Detailed Period Breakdown</h2>
          <p className="mt-1 text-xs text-slate-500">Recognized revenue follows payment settlement dates. Figures are grouped by {groupBy}.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-pink-50/70 text-[11px] text-slate-600">
                <th className="rounded-l-lg px-3 py-3 font-semibold">Period</th>
                <th className="px-3 py-3 text-right font-semibold">Gross Sales</th>
                <th className="px-3 py-3 text-right font-semibold">Seller Item Discounts</th>
                <th className="px-3 py-3 text-right font-semibold">Actual Recognized Revenue</th>
                <th className="px-3 py-3 text-right font-semibold">Operating Expenses</th>
                <th className="rounded-r-lg px-3 py-3 text-right font-semibold">Net Profit*</th>
              </tr>
            </thead>
            <tbody>
              {status === "loading" && <tr><td colSpan={6} className="px-3 py-8 text-center text-sm text-slate-500">Loading report…</td></tr>}
              {status === "succeeded" && rows.map((row: PeriodRow) => (
                <tr key={row.period} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
                  <td className="px-3 py-3 text-xs font-medium text-slate-700">{formatDate(row.period, groupBy)}</td>
                  <AmountCell value={row.grossSales} currency={activeCurrency} />
                  <AmountCell value={row.discounts} currency={activeCurrency} />
                  <AmountCell value={row.actualRevenue} currency={activeCurrency} />
                  <AmountCell value={row.operatingExpenses} currency={activeCurrency} />
                  <td className={`px-3 py-3 text-right text-xs font-semibold ${row.currentProfitOrLoss >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                    {money(row.currentProfitOrLoss, activeCurrency)}
                  </td>
                </tr>
              ))}
              {status === "succeeded" && rows.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-sm text-slate-500">No report activity found for this period.</td></tr>
              )}
              {status === "failed" && <tr><td colSpan={6} className="px-3 py-8 text-center text-sm text-slate-500">Report data could not be loaded.</td></tr>}
            </tbody>
            {status === "succeeded" && activeReport && (
              <tfoot>
                <tr className="border-t border-slate-200 bg-pink-50/40 font-semibold">
                  <td className="px-3 py-3 text-xs text-slate-700">Period total</td>
                  <AmountCell value={activeReport.revenue.grossSales} currency={activeCurrency} />
                  <AmountCell value={activeReport.revenue.discounts} currency={activeCurrency} />
                  <AmountCell value={activeReport.actualRevenue} currency={activeCurrency} />
                  <AmountCell value={activeReport.expenses.operatingExpenses} currency={activeCurrency} />
                  <td className={`px-3 py-3 text-right text-xs ${totals.profit >= 0 ? "text-emerald-700" : "text-red-600"}`}>{money(totals.profit, activeCurrency)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>
      <p className="text-[11px] text-slate-500">
        * Partial profit = actual recognized revenue − approved operating expenses. Other profit and loss components are not currently provided by the accounting report API.
      </p>
    </section>
  );
};

const SummaryCard = ({
  label,
  value,
  comparison,
  icon: Icon,
  colors,
}: {
  label: string;
  value: string;
  comparison: string;
  icon: typeof TrendingUp;
  colors: string;
}) => (
  <div className={`rounded-xl border p-4 ${colors}`}>
    <div className="flex items-start gap-3">
      <span className="rounded-full bg-white/75 p-2.5"><Icon size={17} /></span>
      <div className="min-w-0 pt-0.5">
        <p className="text-[11px] font-medium text-slate-600">{label}</p>
        <p className="mt-1 truncate text-xl font-bold text-slate-900">{value}</p>
        <p className="mt-1 text-[10px] text-slate-500">{comparison}</p>
      </div>
    </div>
  </div>
);

const AmountCell = ({ value, currency }: { value: number | null; currency: string }) => (
  <td className="px-3 py-3 text-right text-xs text-slate-700">
    {value === null ? "—" : money(value, currency)}
  </td>
);

export default SellerProfitLossPage;

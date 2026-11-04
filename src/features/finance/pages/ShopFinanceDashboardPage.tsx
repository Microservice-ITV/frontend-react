import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CheckCheck,
  CircleDollarSign,
  Clock3,
  Receipt,
  RefreshCw,
  Scale,
  Truck,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAppSelector } from "@/app/hooks";
import { extractRoleFromUser } from "@/app/rbac/normalizers";
import { useCan } from "@/app/rbac/hooks";
import { CAPABILITIES } from "@/app/rbac/capabilities";
import { authClient } from "@/lib/api/authClient";
import { accountingClient } from "@/lib/api/accountingClient";
import { accountingExpensesAdapter } from "@/features/accounting/adapters/accountingExpensesAdapter";
import type { AccountingExpense } from "@/features/accounting/types/expenseTypes";
import { isExpenseInAccounting } from "@/features/accounting/utils/expenseAccounting";
import type { ProfitLossOverviewResponse } from "@/features/accounting/types/accountingTypes";
import { getShopIncomeTotal } from "@/features/finance/utils/financeTotals";

type Shop = { shop_id?: string | null; shop_name?: string | null };
type AccessContextResponse = {
  data?: { access_context?: { active_shop?: Shop | null; shops?: Shop[] } };
};
type LoadStatus = "loading" | "succeeded" | "failed";

const COLORS = [
  "#059669",
  "#2563eb",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
];
const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
};
const normalizeShopId = (value: string) => value.trim().toLowerCase();
const isShopInScope = (
  shopId: string | null | undefined,
  selectedShopIds: string[],
) =>
  Boolean(
    shopId &&
      selectedShopIds.some(
        (selectedId) => normalizeShopId(selectedId) === normalizeShopId(shopId),
      ),
  );
const money = (value: number | null | undefined, currency: string) =>
  value == null
    ? "Unavailable"
    : `${currency} ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const errorMessage = (error: unknown) => {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { error?: unknown } } })
      .response;
    if (typeof response?.data?.error === "string") return response.data.error;
  }
  return error instanceof Error && error.message
    ? error.message
    : "Unable to load finance data.";
};

const Card = ({
  label,
  value,
  detail,
  icon: Icon,
  tone = "blue",
  highlighted = false,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof TrendingUp;
  tone?: "blue" | "green" | "red" | "amber" | "slate";
  highlighted?: boolean;
}) => {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
    amber: "bg-amber-50 text-amber-600",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlighted
          ? "border-emerald-100 bg-emerald-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className={`text-xs font-medium ${
              highlighted ? "text-emerald-700" : "text-slate-500"
            }`}
          >
            {label}
          </p>
          <p
            className={`mt-2 text-xl font-bold ${
              highlighted ? "text-emerald-900" : "text-slate-900"
            }`}
          >
            {value}
          </p>
        </div>
        <span className={`rounded-lg p-2 ${tones[tone]}`}>
          <Icon size={17} />
        </span>
      </div>
      <p className="mt-2 text-[11px] text-slate-500">{detail}</p>
    </div>
  );
};

const Section = ({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) => (
  <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      {action}
    </div>
    {children}
  </section>
);

const ShopFinanceDashboardPage = () => {
  const authUser = useAppSelector((state) => state.auth.user);
  const isFinanceManager = extractRoleFromUser(authUser) === "FINANCE_MANAGER";
  const canReviewApprovals = useCan(CAPABILITIES.FINANCE_APPROVALS_VIEW);
  const [fromDate, setFromDate] = useState(monthStart);
  const [toDate, setToDate] = useState(today);
  const [shopId, setShopId] = useState("");
  const [shops, setShops] = useState<Shop[]>([]);
  const [authorizedShopIds, setAuthorizedShopIds] = useState<string[]>([]);
  const [report, setReport] = useState<ProfitLossOverviewResponse | null>(null);
  const [incomeEntries, setIncomeEntries] = useState<
    ProfitLossOverviewResponse["entries"] | null
  >(null);
  const [expenses, setExpenses] = useState<AccountingExpense[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<
    Awaited<ReturnType<typeof accountingExpensesAdapter.listPendingApprovals>>
  >([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setStatus("loading");
    setError(null);
    try {
      const access =
        await authClient.get<AccessContextResponse>("/me/access-context");
      const context = access.data.data?.access_context;
      const loadedShops = context?.shops ?? [];
      setShops(loadedShops);
      const listedShopIds = loadedShops
        .map((shop) => shop.shop_id?.trim() ?? "")
        .filter(Boolean);
      const activeShopId =
        authUser?.active_shop_id?.trim() ||
        context?.active_shop?.shop_id?.trim() ||
        "";
      const permittedShopIds = isFinanceManager
        ? listedShopIds
        : [
            activeShopId &&
            (listedShopIds.length === 0 || listedShopIds.includes(activeShopId))
              ? activeShopId
              : listedShopIds[0] ?? "",
          ].filter(Boolean);
      setAuthorizedShopIds(permittedShopIds);
      const selectedShopIds =
        isFinanceManager && shopId
          ? permittedShopIds.includes(shopId)
            ? [shopId]
            : permittedShopIds
          : permittedShopIds;
      if (isFinanceManager && shopId && !permittedShopIds.includes(shopId)) {
        setShopId("");
      }
      const selectedShopId =
        selectedShopIds.length === 1 ? selectedShopIds[0] : "";
      const filterToSelectedShops = <T extends { shopId?: string | null }>(
        items: T[],
      ) => items.filter((item) => isShopInScope(item.shopId, selectedShopIds));
      if (
        isFinanceManager &&
        !shopId &&
        loadedShops.length === 1 &&
        selectedShopId
      )
        setShopId(selectedShopId);
      const params = {
        from: `${fromDate}T00:00:00.000Z`,
        to: `${toDate}T23:59:59.999Z`,
        groupBy: "month",
        ...(selectedShopId ? { shopId: selectedShopId } : {}),
      };
      const [reportResult, incomeResult, expensesResult, approvalsResult] =
        await Promise.allSettled(
          [
            accountingClient.get<ProfitLossOverviewResponse>(
              "/reports/profit-loss",
              { params },
            ),
            accountingClient.get<ProfitLossOverviewResponse>(
              "/reports/profit-loss",
            ),
            accountingExpensesAdapter.list(),
            canReviewApprovals
              ? accountingExpensesAdapter.listPendingApprovals()
              : Promise.resolve([]),
          ] as const,
        );
      if (reportResult.status === "fulfilled") {
        setReport(reportResult.value.data);
      } else {
        setReport(null);
      }
      if (incomeResult.status === "fulfilled") {
        setIncomeEntries(incomeResult.value.data.entries ?? []);
      } else {
        setIncomeEntries(null);
      }
      if (expensesResult.status === "fulfilled") {
        // GET /expenses is authenticated and returns only authorized shops;
        // narrow that result to the currently selected authorized shop(s).
        setExpenses(filterToSelectedShops(expensesResult.value));
      } else {
        setExpenses([]);
      }
      if (approvalsResult.status === "fulfilled") {
        setPendingApprovals(
          approvalsResult.value.filter((approval) =>
            isShopInScope(approval.expense.shopId, selectedShopIds),
          ),
        );
      } else {
        setPendingApprovals([]);
      }
      const financeFailure = [
        reportResult,
        incomeResult,
        expensesResult,
        approvalsResult,
      ].find((result) => result.status === "rejected");
      if (financeFailure?.status === "rejected") {
        setStatus("failed");
        setError(errorMessage(financeFailure.reason));
      } else {
        setStatus("succeeded");
      }

    } catch (cause) {
      setReport(null);
      setIncomeEntries(null);
      setExpenses([]);
      setPendingApprovals([]);
      setStatus("failed");
      setError(errorMessage(cause));
    }
  };

  useEffect(() => {
    void load();
  }, [
    authUser?.active_shop_id,
    authUser?.id,
    canReviewApprovals,
    fromDate,
    isFinanceManager,
    toDate,
    shopId,
  ]);

  const selectedReport = useMemo(
    () =>
      report?.reports.find((item) => item.currency === "MMK") ??
      report?.reports[0],
    [report],
  );
  const selectedCurrency = selectedReport?.currency ?? "MMK";
  const selectedShopIds = useMemo(
    () =>
      isFinanceManager && shopId
        ? authorizedShopIds.includes(shopId)
          ? [shopId]
          : []
        : authorizedShopIds,
    [authorizedShopIds, isFinanceManager, shopId],
  );
  const totalIncome = useMemo(
    () =>
      incomeEntries === null
        ? undefined
        : getShopIncomeTotal(incomeEntries, selectedShopIds, fromDate, toDate),
    [fromDate, incomeEntries, selectedShopIds, toDate],
  );
  const visibleExpenses = useMemo(
    () =>
      expenses.filter((expense) => {
        const expenseShop = expense.shopId
          ? normalizeShopId(expense.shopId)
          : "";
        return (
          isShopInScope(expenseShop, selectedShopIds) &&
          expense.expenseDate.slice(0, 10) >= fromDate &&
          expense.expenseDate.slice(0, 10) <= toDate
        );
      }),
    [expenses, fromDate, selectedShopIds, toDate],
  );
  const visiblePendingApprovals = useMemo(
    () =>
      pendingApprovals.filter(
        (item) =>
          isShopInScope(item.expense.shopId, selectedShopIds) &&
          item.expense.expenseDate.slice(0, 10) >= fromDate &&
          item.expense.expenseDate.slice(0, 10) <= toDate,
      ),
    [fromDate, pendingApprovals, selectedShopIds, toDate],
  );
  const pendingAmount = useMemo(
    () =>
      visiblePendingApprovals
        .filter((item) => item.expense.currency === selectedCurrency)
        .reduce((sum, item) => sum + Number(item.expense.amount), 0),
    [selectedCurrency, visiblePendingApprovals],
  );
  const unapprovedDeliAmount = useMemo(
    () =>
      visibleExpenses
        .filter(
          (expense) =>
            expense.status !== "APPROVED" &&
            expense.expenseType?.code?.trim().toUpperCase() === "DELI" &&
            expense.currency === selectedCurrency,
        )
        .reduce((sum, expense) => sum + Number(expense.amount), 0),
    [selectedCurrency, visibleExpenses],
  );
  const categoryData = useMemo(() => {
    const totals = new Map<string, number>();
    visibleExpenses
      .filter(
        (expense) =>
        isExpenseInAccounting(expense) &&
          expense.currency === selectedCurrency,
      )
      .forEach((expense) => {
        const name = expense.expenseType?.name ?? "Other expenses";
        totals.set(name, (totals.get(name) ?? 0) + Number(expense.amount));
      });
    return [...totals.entries()]
      .sort((left, right) => right[1] - left[1])
      .map(([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length],
      }));
  }, [selectedCurrency, visibleExpenses]);
  const deliveryCostTotal = useMemo(
    () =>
      visibleExpenses
        .filter(
          (expense) =>
          isExpenseInAccounting(expense) &&
            expense.currency === selectedCurrency &&
            (expense.expenseType?.code?.toUpperCase() === "DELI" ||
              expense.description?.toLowerCase().includes("delivery")),
        )
        .reduce((sum, expense) => sum + Number(expense.amount), 0),
    [selectedCurrency, visibleExpenses],
  );
  const activity = useMemo(
    () =>
      (report?.entries ?? [])
        .filter(
          (entry) =>
            entry.account.type === "INCOME" || entry.account.type === "EXPENSE",
        )
        .slice(0, 6),
    [report],
  );
  if (status === "loading" && !report)
    return (
      <section className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Finance Overview</h1>
          <p className="mt-1 text-sm text-slate-600">
            Loading authorized shop financial data...
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-xl bg-slate-200"
            />
          ))}
        </div>
      </section>
    );

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <CircleDollarSign size={22} className="text-emerald-600" />
            {isFinanceManager
              ? "Finance Manager Dashboard"
              : "Shop Owner Accounting Dashboard"}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {isFinanceManager
              ? "Financial performance across your authorized shop scope."
              : "Financial performance for your authorized shop."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs text-slate-500">
            From
            <input
              aria-label="From date"
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="ml-2 rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-700"
            />
          </label>
          <label className="text-xs text-slate-500">
            To
            <input
              aria-label="To date"
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="ml-2 rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-700"
            />
          </label>
          {isFinanceManager && shops.length > 1 && (
            <select
              aria-label="Shop"
              value={shopId}
              onChange={(event) => setShopId(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700"
            >
              <option value="">All authorized shops</option>
              {shops.map((shop) => (
                <option key={shop.shop_id} value={shop.shop_id ?? ""}>
                  {shop.shop_name ?? shop.shop_id}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={() => void load()}
            disabled={status === "loading"}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={status === "loading" ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isFinanceManager ? (
          <>
            <Card
              label="Total Income"
              value={money(totalIncome, selectedCurrency)}
              detail="Credited income ledger entries for this period"
              icon={ArrowUpRight}
              tone="green"
              highlighted
            />
            <Card
              label="Total Expenses"
              value={money(
                selectedReport
                  ? selectedReport.expenses.operatingExpenses + unapprovedDeliAmount
                  : undefined,
                selectedCurrency,
              )}
              detail="Approved operating expenses and unapproved DELI expenses"
              icon={ArrowDownRight}
              tone="red"
            />
            <Card
              label="Net Profit/Loss"
              value={money(
                selectedReport
                  ? selectedReport.profit.currentProfitOrLoss - unapprovedDeliAmount
                  : undefined,
                selectedCurrency,
              )}
              detail="Income less recognized expenses"
              icon={TrendingUp}
              tone="blue"
            />
            <Card
              label="Cash & Bank Balance"
              value="Unavailable"
              detail="No reliable balance report is available"
              icon={Wallet}
              tone="slate"
            />
            <Card
              label="Pending Approvals"
              value={money(pendingAmount, selectedCurrency)}
              detail={`${visiblePendingApprovals.length.toLocaleString()} assigned approval item(s)`}
              icon={Clock3}
              tone="amber"
            />
            <Card
              label="Salary Expense"
              value="Unavailable"
              detail="No payroll service or salary API is connected"
              icon={Scale}
              tone="slate"
            />
            <Card
              label="Salary Payable"
              value="Unavailable"
              detail="Requires payroll payable data"
              icon={Wallet}
              tone="slate"
            />
            <Card
              label="Payment Requests"
              value="Unavailable"
              detail="No payment-request workflow is connected"
              icon={Receipt}
              tone="slate"
            />
          </>
        ) : (
          <>
            <Card
              label="Total Sales"
              value={money(
                selectedReport?.revenue.grossSales,
                selectedCurrency,
              )}
              detail="Authorized shop P&L report"
              icon={ArrowUpRight}
              tone="green"
            />
            <Card
              label="Net Revenue"
              value={money(selectedReport?.actualRevenue, selectedCurrency)}
              detail="Recognized revenue after adjustments"
              icon={CircleDollarSign}
              tone="blue"
            />
            <Card
              label="Delivery Costs"
              value={money(deliveryCostTotal, selectedCurrency)}
              detail="Approved delivery expenses"
              icon={Receipt}
              tone="amber"
            />
            <Card
              label="Net Profit/Loss"
              value={money(
                selectedReport?.profit.currentProfitOrLoss,
                selectedCurrency,
              )}
              detail="Authoritative P&L result"
              icon={TrendingUp}
              tone="blue"
            />
            <Card
              label="Available Balance"
              value="Unavailable"
              detail="No reliable settlement balance report"
              icon={Wallet}
              tone="slate"
            />
            <Card
              label="Pending Settlements"
              value="Unavailable"
              detail="Settlement detail is not exposed by accounting"
              icon={Clock3}
              tone="slate"
            />
          </>
        )}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Section
          title={isFinanceManager ? "Income vs Expenses" : "Sales vs Expenses"}
        >
          <div className="h-72">
            {selectedReport?.breakdown?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={selectedReport.breakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: number) =>
                      money(value, selectedCurrency)
                    }
                  />
                  <Legend />
                  {isFinanceManager ? (
                    <Line
                      type="monotone"
                      dataKey="actualRevenue"
                      name="Income"
                      stroke="#059669"
                      strokeWidth={2}
                    />
                  ) : (
                    <Line
                      type="monotone"
                      dataKey="grossSales"
                      name="Sales"
                      stroke="#059669"
                      strokeWidth={2}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="operatingExpenses"
                    name="Expenses"
                    stroke="#dc2626"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty text="No report data for this period." />
            )}
          </div>
        </Section>
        <Section title="Expense Breakdown by Category">
          <div className="h-72">
            {categoryData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name }) => name}
                  >
                    {categoryData.map((item) => (
                      <Cell key={item.name} fill={item.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) =>
                      money(value, selectedCurrency)
                    }
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Empty text="No approved expense categories for this period." />
            )}
          </div>
        </Section>
        <Section
          title="Delivery Costs"
          action={
            <Link
              to="/seller/accounting/delivery-company-fees"
              className="text-xs font-medium text-emerald-700"
            >
              Open Delivery Costs
            </Link>
          }
        >
          <div className="flex items-center gap-3">
            <Truck size={20} className="text-amber-600" />
            <div>
              <p className="text-xs text-slate-500">
                Approved delivery expenses in this period
              </p>
              <p className="text-lg font-bold text-slate-900">
                {money(deliveryCostTotal, selectedCurrency)}
              </p>
              <p className="text-[11px] text-slate-500">
                Pending and paid delivery totals are not exposed by the current
                accounting API.
              </p>
            </div>
          </div>
        </Section>
        {isFinanceManager && (
          <Section title="Accounting Alerts">
            <Empty text="Journal failure and reconciliation alert endpoints are not available." />
          </Section>
        )}
        <Section title="Monthly Salary Expense Trend">
          <Empty text="Unavailable until payroll integration is connected." />
        </Section>
        <Section
          title="Recent Financial Activity"
          action={
            <Link
              to="/seller/finance/transactions"
              className="text-xs font-medium text-emerald-700"
            >
              View all
            </Link>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] text-slate-500">
                  <th className="px-2 py-2">Date</th>
                  <th className="px-2 py-2">Type</th>
                  <th className="px-2 py-2">Account</th>
                  <th className="px-2 py-2">Reference</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {activity.length ? (
                  activity.map((entry) => (
                    <tr
                      key={`${entry.journalEntry.referenceType}-${entry.journalEntry.referenceId}-${entry.account.code}-${entry.amount}`}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-2 py-3 text-xs text-slate-600">
                        {entry.journalEntry.entryDate.slice(0, 10)}
                      </td>
                      <td className="px-2 py-3 text-xs text-slate-600">
                        {entry.direction === "CREDIT" ? "Income" : "Expense"}
                      </td>
                      <td className="px-2 py-3 text-xs text-slate-700">
                        {entry.account.name}
                      </td>
                      <td className="px-2 py-3 text-xs text-slate-500">
                        {entry.journalEntry.referenceType} ·{" "}
                        {entry.journalEntry.referenceId}
                      </td>
                      <td className="px-2 py-3 text-xs text-slate-600">
                        {entry.journalEntry.status}
                      </td>
                      <td
                        className={`px-2 py-3 text-right text-xs font-semibold ${entry.direction === "CREDIT" ? "text-emerald-700" : "text-red-700"}`}
                      >
                        {entry.direction === "CREDIT" ? "+" : "-"}
                        {selectedCurrency}{" "}
                        {Number(entry.amount).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6}>
                      <Empty text="No financial activity for this period." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>
      </div>
      {canReviewApprovals && (
        <Section
          title="Pending Expense Approvals"
          action={
            <Link
              to="/seller/accounting/pending-approvals"
              className="text-xs font-medium text-emerald-700"
            >
              Review approvals
            </Link>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px]">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] text-slate-500">
                  <th className="px-2 py-2">Expense</th>
                  <th className="px-2 py-2">Category</th>
                  <th className="px-2 py-2">Step</th>
                  <th className="px-2 py-2 text-right">Amount</th>
                  <th className="px-2 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {visiblePendingApprovals.length ? (
                  visiblePendingApprovals.slice(0, 8).map((approval) => (
                    <tr
                      key={approval.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-2 py-3 text-xs font-semibold text-slate-900">
                        {approval.expense.expenseNo}
                      </td>
                      <td className="px-2 py-3 text-xs text-slate-600">
                        {approval.expense.expenseType?.name ?? "Expense"}
                      </td>
                      <td className="px-2 py-3 text-xs text-slate-600">
                        Step {approval.stepNo}
                      </td>
                      <td className="px-2 py-3 text-right text-xs font-semibold text-slate-900">
                        {approval.expense.currency}{" "}
                        {Number(approval.expense.amount).toLocaleString()}
                      </td>
                      <td className="px-2 py-3 text-xs text-amber-700">
                        {approval.status}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5}>
                      <Empty text="No approvals are waiting for you." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>
      )}
      <div className="flex flex-wrap gap-2">
        {canReviewApprovals && (
          <Link
            to="/seller/accounting/pending-approvals"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white"
          >
            <CheckCheck size={14} />
            Review approvals
          </Link>
        )}
        {isFinanceManager && (
          <Link
            to="/seller/accounting/salary-approvals"
            className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800"
          >
            <Scale size={14} />
            Salary approvals
          </Link>
        )}
        <Link
          to="/seller/accounting/expenses"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700"
        >
          <Receipt size={14} />
          View expenses
        </Link>
        <Link
          to="/seller/accounting/delivery-company-fees"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700"
        >
          <Truck size={14} />
          Delivery costs
        </Link>
        <Link
          to="/seller/finance/transactions"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700"
        >
          <ArrowDownRight size={14} />
          Transactions
        </Link>
        <Link
          to="/seller/accounting/profit-loss"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700"
        >
          <BarChart3 size={14} />
          View profit & loss
        </Link>
        <Link
          to="/seller/accounting/journal-entries"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700"
        >
          <BookOpen size={14} />
          View journal entries
        </Link>
      </div>
    </section>
  );
};

const Empty = ({ text }: { text: string }) => (
  <div className="flex h-full min-h-28 items-center justify-center text-center text-xs text-slate-500">
    {text}
  </div>
);

export default ShopFinanceDashboardPage;

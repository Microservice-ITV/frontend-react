import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownRight,
  BookOpen,
  CircleDollarSign,
  Plus,
  ReceiptText,
  Scale,
  Search,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import DataTablePagination from "@/components/ui/DataTablePagination";
import { authClient } from "@/lib/api/authClient";
import { accountingClient } from "@/lib/api/accountingClient";
import type { AccountingIncomeLine } from "@/features/admin/api/adminAccountingApi";
import AccountingStatusBadge from "../components/AccountingStatusBadge";
import { accountingExpensesAdapter } from "../adapters/accountingExpensesAdapter";
import type { AccountingExpense } from "../types/expenseTypes";

const money = (value: number, currency = "MMK") =>
  `${currency} ${value.toLocaleString()}`;
export const getPostedExpenseTotal = (expenses: AccountingExpense[]) =>
  expenses.reduce(
    (sum, expense) => expense.status === "APPROVED" ? sum + Number(expense.amount) : sum,
    0,
  );
export const getDeliveryFeeTotals = (
  lines: Pick<AccountingIncomeLine, "direction" | "amount" | "memo" | "account" | "currency">[],
) =>
  lines.reduce<Record<string, number>>((totals, line) => {
    if (
      line.direction !== "CREDIT" ||
      line.account.code !== "2000" ||
      !/^Delivery fee payable(?:\s|$)/i.test(line.memo ?? "")
    ) {
      return totals;
    }
    const currency = line.currency?.toUpperCase() ?? line.memo?.match(/\(([A-Z]{3})\)/i)?.[1]?.toUpperCase() ?? "UNKNOWN";
    totals[currency] = (totals[currency] ?? 0) + Number(line.amount);
    return totals;
  }, {});
const errorMessage = (error: unknown) => {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { error?: unknown } } })
      .response;
    if (typeof response?.data?.error === "string") return response.data.error;
  }
  return error instanceof Error && error.message
    ? error.message
    : "Unable to load accounting overview.";
};
const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
};
const normalizeShopId = (value: string) => value.trim().toLowerCase();
const extractShopIdFromMemo = (value?: string | null) => {
  if (!value) return null;
  const match = value.match(/(?:^|[\s,(])shop(?:_id)?=([^,\s)]+)/i);
  return match?.[1] ? normalizeShopId(match[1]) : null;
};

type AccessContextResponse = {
  data?: {
    access_context?: {
      shops?: Array<{ shop_id?: string | null }>;
    };
  };
};

type ActivityRow = {
  id: string;
  type: "INCOME" | "EXPENSE";
  reference: string;
  description: string;
  category: string;
  status: string;
  date: string;
  dateValue: string;
  amount: number;
  currency: string;
  expenseNo?: string;
};

const SellerAccountingOverviewPage = () => {
  const [expenses, setExpenses] = useState<AccountingExpense[]>([]);
  const [incomeLines, setIncomeLines] = useState<AccountingIncomeLine[]>([]);
  const [deliveryFeeLines, setDeliveryFeeLines] = useState<AccountingIncomeLine[]>([]);
  const [status, setStatus] = useState<"loading" | "succeeded" | "failed">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    let active = true;
    void Promise.all([
      accountingExpensesAdapter.list(),
      authClient.get<AccessContextResponse>("/me/access-context"),
      accountingClient.get<{ entries?: AccountingIncomeLine[] }>(
        "/reports/profit-loss",
      ),
    ])
      .then(([loadedExpenses, accessContextResponse, incomeResponse]) => {
        if (!active) return;
        const allowedShopIds = new Set(
          (accessContextResponse.data.data?.access_context?.shops ?? [])
            .flatMap((shop) => (shop.shop_id ? [normalizeShopId(shop.shop_id)] : [])),
        );
        const isInAuthorizedShop = (line: AccountingIncomeLine) => {
          const shopId = extractShopIdFromMemo(line.memo ?? line.journalEntry.narration);
          return allowedShopIds.size === 0 || (shopId ? allowedShopIds.has(shopId) : allowedShopIds.size === 1);
        };
        const reportLines = incomeResponse.data.entries ?? [];
        const safeIncomeLines = reportLines.filter((line) =>
          line.direction === "CREDIT" &&
          line.account.type === "INCOME" &&
          isInAuthorizedShop(line),
        );
        const safeDeliveryFeeLines = reportLines.filter((line) =>
          line.direction === "CREDIT" &&
          line.account.code === "2000" &&
          /^Delivery fee payable(?:\s|$)/i.test(line.memo ?? "") &&
          isInAuthorizedShop(line),
        );
        setExpenses(loadedExpenses);
        setIncomeLines(safeIncomeLines);
        setDeliveryFeeLines(safeDeliveryFeeLines);
        setStatus("succeeded");
      })
      .catch((cause) => {
        if (!active) return;
        setStatus("failed");
        setError(errorMessage(cause));
      });
    return () => {
      active = false;
    };
  }, []);

  const totalExpenses = getPostedExpenseTotal(expenses);
  const totalIncome = incomeLines.reduce(
    (sum, line) => sum + Number(line.amount),
    0,
  );
  const deliveryFeeTotals = getDeliveryFeeTotals(deliveryFeeLines);
  const deliveryFeeTotalLabel = Object.entries(deliveryFeeTotals)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([currency, amount]) => money(amount, currency))
    .join(" · ") || money(0);
  const activities = useMemo<ActivityRow[]>(() => [
    ...incomeLines.map((line) => ({
      id: `income-${line.id}`,
      type: "INCOME" as const,
      reference: `${line.journalEntry.referenceType} · ${line.journalEntry.referenceId}`,
      description: line.journalEntry.narration ?? "Income",
      category: `${line.account.code} · ${line.account.name}`,
      status: line.journalEntry.status,
      date: formatDate(line.journalEntry.entryDate),
      dateValue: line.journalEntry.entryDate,
      amount: Number(line.amount),
      currency: "MMK",
    })),
    ...expenses.map((expense) => ({
      id: `expense-${expense.id}`,
      type: "EXPENSE" as const,
      reference: expense.expenseNo,
      description: expense.description ?? "Expense",
      category: expense.expenseType?.name ?? expense.expenseTypeId,
      status: expense.status,
      date: formatDate(expense.expenseDate),
      dateValue: expense.expenseDate,
      amount: Number(expense.amount),
      currency: expense.currency,
      expenseNo: expense.expenseNo,
    })),
  ].sort((left, right) => right.dateValue.localeCompare(left.dateValue)), [expenses, incomeLines]);
  const filteredActivities = useMemo(() => {
    const query = search.trim().toLowerCase();
    return activities.filter((activity) => {
      return (
        !query ||
        [
          activity.reference,
          activity.description,
          activity.category,
          activity.status,
          activity.type,
        ].some((value) => value.toLowerCase().includes(query))
      );
    });
  }, [activities, search]);
  const totalPages = Math.max(
    1,
    Math.ceil(filteredActivities.length / rowsPerPage),
  );
  const visibleActivities = filteredActivities.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  return (
    <section className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to="/seller/overview" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Accounting</span>
      </nav>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Scale size={22} className="text-emerald-600" />
            Accounting Overview
          </h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Shop income, expense, and ledger activity from accounting-service.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/seller/accounting/income"
            className="inline-flex items-center gap-2 self-start rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
          >
            <CircleDollarSign size={16} />
            Income
          </Link>
          <Link
            to="/seller/accounting/expenses/new"
            className="inline-flex items-center gap-2 self-start rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Plus size={16} />
            Add Expense
          </Link>
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Total income"
          value={status === "loading" ? "..." : money(totalIncome)}
          icon={ReceiptText}
          tone="bg-emerald-50 text-emerald-600"
        />
        <SummaryCard
          label="Total expenses"
          value={status === "loading" ? "..." : money(totalExpenses)}
          icon={ArrowDownRight}
          tone="bg-red-50 text-red-600"
        />
        <SummaryCard
          label="Shipping fee total"
          value={status === "loading" ? "..." : deliveryFeeTotalLabel}
          icon={CircleDollarSign}
          tone="bg-amber-50 text-amber-600"
        />
        <SummaryCard
          label="Net balance"
          value={status === "loading" ? "..." : money(totalIncome - totalExpenses)}
          icon={BookOpen}
          tone="bg-blue-50 text-blue-600"
        />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Recent activity</p>
            <p className="mt-1 text-xs text-slate-500">Income and expenses from your authorized shops.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Search activity..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-200 py-1.5 pl-8 pr-3 text-xs outline-none placeholder:text-slate-400 focus:border-emerald-500"
              />
            </div>
              <Link to="/seller/accounting/income" className="text-xs font-medium text-emerald-700 hover:text-emerald-800">
              View all
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-220">
            <thead>
              <tr className="border-b border-slate-100">
                {['Reference', 'Description', 'Category', 'Type', 'Status', 'Date', 'Amount'].map((heading) => (
                  <th key={heading} className="px-2 py-2 text-left text-[11px] font-medium text-slate-500">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleActivities.map((activity) => (
                <tr key={activity.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-2 py-3 text-xs font-semibold text-slate-900">
                    {activity.expenseNo ? <Link to={`/seller/accounting/expenses/${encodeURIComponent(activity.expenseNo)}`} className="hover:text-emerald-700">{activity.reference}</Link> : activity.reference}
                  </td>
                  <td className="max-w-55 px-2 py-3 text-xs text-slate-700 truncate">{activity.description}</td>
                  <td className="px-2 py-3 text-xs text-slate-600">{activity.category}</td>
                  <td className="px-2 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${activity.type === "INCOME" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{activity.type}</span></td>
                  <td className="px-2 py-3"><AccountingStatusBadge status={activity.status} /></td>
                  <td className="px-2 py-3 text-xs text-slate-600">{activity.date}</td>
                  <td className={`px-2 py-3 text-right text-xs font-semibold ${activity.type === "INCOME" ? "text-emerald-700" : "text-red-700"}`}>{activity.type === "INCOME" ? "+" : "-"}{money(activity.amount, activity.currency)}</td>
                </tr>
              ))}
              {status !== "loading" && visibleActivities.length === 0 && (
                <tr><td colSpan={7} className="px-2 py-8 text-center text-sm text-slate-500">No accounting activity found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <DataTablePagination
          page={page}
          totalPages={totalPages}
          rowsPerPage={rowsPerPage}
          totalItems={filteredActivities.length}
          itemLabel="activities"
          onPageChange={setPage}
          onRowsPerPageChange={(value) => {
            setRowsPerPage(value);
            setPage(1);
          }}
        />
      </div>
    </section>
  );
};

const SummaryCard = ({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: string;
}) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4">
    <div className="flex items-center justify-between">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <span className={`rounded-lg p-2 ${tone}`}>
        <Icon size={16} />
      </span>
    </div>
    <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
  </div>
);

export default SellerAccountingOverviewPage;

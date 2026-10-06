import { useEffect, useState, type ComponentType } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  Calculator,
  CircleDollarSign,
  FileBarChart,
  Landmark,
  Plus,
  ReceiptText,
  Scale,
  WalletCards,
} from "lucide-react";
import { accountingClient } from "@/lib/api/accountingClient";
import AccountingOverviewChart from "../components/AccountingOverviewChart";
import type {
  AccountingOverviewData,
  AccountingStatus,
  JournalEntry,
} from "../types/accountingTypes";

const currency = (value: number) => `MMK ${value.toLocaleString()}`;
const statusLabel = (status: AccountingStatus) =>
  status.charAt(0) + status.slice(1).toLowerCase();

type OverviewLine = {
  direction: "DEBIT" | "CREDIT";
  amount: number | string;
  account: {
    code: string;
    name: string;
    type: "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE";
  };
};

type OverviewEntry = {
  id: string;
  referenceType: string;
  referenceId: string;
  narration: string | null;
  entryDate: string;
  status: AccountingStatus;
  lines: OverviewLine[];
};

const toOverviewData = (entries: OverviewEntry[]): AccountingOverviewData => {
  const totals = { revenue: 0, expenses: 0 };
  const position = { assets: 0, liabilities: 0, equity: 0 };
  const accountBalances = new Map<string, { name: string; balance: number }>();
  const statusCounts: Record<AccountingStatus, number> = {
    POSTED: 0,
    DRAFT: 0,
    PENDING: 0,
    REVERSED: 0,
  };

  entries.forEach((entry) => {
    statusCounts[entry.status] = (statusCounts[entry.status] ?? 0) + 1;
    entry.lines.forEach((line) => {
      const amount = Number(line.amount);
      const isDebitNormal =
        line.account.type === "ASSET" || line.account.type === "EXPENSE";
      const balanceChange =
        line.direction === (isDebitNormal ? "DEBIT" : "CREDIT")
          ? amount
          : -amount;
      const account = accountBalances.get(line.account.code) ?? {
        name: line.account.name,
        balance: 0,
      };
      account.balance += balanceChange;
      accountBalances.set(line.account.code, account);

      if (line.account.type === "INCOME" && line.direction === "CREDIT")
        totals.revenue += amount;
      if (line.account.type === "EXPENSE" && line.direction === "DEBIT")
        totals.expenses += amount;
      if (line.account.type === "ASSET") position.assets += balanceChange;
      if (line.account.type === "LIABILITY")
        position.liabilities += balanceChange;
      if (line.account.type === "EQUITY") position.equity += balanceChange;
    });
  });

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const chartFor = (
    filter: (date: Date) => boolean,
    label: (date: Date) => string,
  ) => {
    const buckets = new Map<
      string,
      { label: string; revenue: number; expenses: number; netIncome: number }
    >();
    entries
      .filter((entry) => filter(new Date(entry.entryDate)))
      .forEach((entry) => {
        const date = new Date(entry.entryDate);
        const key = label(date);
        const bucket = buckets.get(key) ?? {
          label: key,
          revenue: 0,
          expenses: 0,
          netIncome: 0,
        };
        entry.lines.forEach((line) => {
          const amount = Number(line.amount);
          if (line.account.type === "INCOME" && line.direction === "CREDIT")
            bucket.revenue += amount;
          if (line.account.type === "EXPENSE" && line.direction === "DEBIT")
            bucket.expenses += amount;
        });
        bucket.netIncome = bucket.revenue - bucket.expenses;
        buckets.set(key, bucket);
      });
    return Array.from(buckets.values()).sort((left, right) =>
      left.label.localeCompare(right.label),
    );
  };

  const recentEntries: JournalEntry[] = entries.slice(0, 4).map((entry) => ({
    id: entry.id,
    date: new Date(entry.entryDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    description: entry.narration ?? "Journal entry",
    reference: `${entry.referenceType} · ${entry.referenceId}`,
    debit: entry.lines
      .filter((line) => line.direction === "DEBIT")
      .reduce((sum, line) => sum + Number(line.amount), 0),
    credit: entry.lines
      .filter((line) => line.direction === "CREDIT")
      .reduce((sum, line) => sum + Number(line.amount), 0),
    status: entry.status,
  }));

  return {
    summary: {
      totalRevenue: totals.revenue,
      totalExpenses: totals.expenses,
      netIncome: totals.revenue - totals.expenses,
      pendingEntries: statusCounts.PENDING,
    },
    position,
    chart: {
      month: chartFor(
        (date) =>
          date.getFullYear() === currentYear &&
          date.getMonth() === currentMonth,
        (date) => `Sep ${date.getDate()}`,
      ),
      lastMonth: chartFor(
        (date) =>
          date.getFullYear() === currentYear &&
          date.getMonth() === currentMonth - 1,
        (date) =>
          date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      ),
      year: chartFor(
        (date) => date.getFullYear() === currentYear,
        (date) => date.toLocaleDateString("en-US", { month: "short" }),
      ),
    },
    journalEntries: recentEntries,
    accountBalances: Array.from(accountBalances.values()).sort((left, right) =>
      left.name.localeCompare(right.name),
    ),
    statusCounts,
  };
};

const AccountingSummaryCard = ({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ size?: number }>;
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

const AdminAccountingOverviewPage = () => {
  const [data, setData] = useState<AccountingOverviewData | null>(null);
  const [status, setStatus] = useState<"loading" | "succeeded" | "failed">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadOverview = async () => {
      try {
        const response =
          await accountingClient.get<OverviewEntry[]>("/entries");
        if (!active) return;
        setData(toOverviewData(response.data ?? []));
        setStatus("succeeded");
      } catch {
        if (!active) return;
        setStatus("failed");
        setError(
          "Unable to load live accounting overview data from accounting-service.",
        );
      }
    };
    void loadOverview();
    return () => {
      active = false;
    };
  }, []);

  const quickActions = [
    { label: "Add Income", to: "/super-admin/accounting/income", icon: Plus },
    {
      label: "Add Platform Expense",
      to: "/super-admin/accounting/platform-expenses",
      icon: ReceiptText,
    },
    {
      label: "Create Journal Entry",
      to: "/super-admin/accounting/journal-entries",
      icon: BookOpen,
    },
    {
      label: "Chart of Accounts",
      to: "/super-admin/accounting/chart-of-accounts",
      icon: Landmark,
    },
  ];

  return (
    <section className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to="/super-admin/overview" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <span>Accounting</span>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Overview</span>
      </nav>
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <Calculator size={22} className="text-emerald-600" />
          Accounting Overview
        </h1>
        <p className="mt-0.5 text-sm text-slate-600">
          Overview of accounting activity, account balances, and financial
          position.
        </p>
      </div>
      {error && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {error}
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AccountingSummaryCard
          label="Total Revenue"
          value={
            status === "loading"
              ? "..."
              : currency(data?.summary.totalRevenue ?? 0)
          }
          icon={ArrowUpRight}
          tone="bg-emerald-50 text-emerald-600"
        />
        <AccountingSummaryCard
          label="Total Expenses"
          value={
            status === "loading"
              ? "..."
              : currency(data?.summary.totalExpenses ?? 0)
          }
          icon={ArrowDownRight}
          tone="bg-orange-50 text-orange-600"
        />
        <AccountingSummaryCard
          label="Net Income"
          value={
            status === "loading"
              ? "..."
              : currency(data?.summary.netIncome ?? 0)
          }
          icon={Scale}
          tone="bg-blue-50 text-blue-600"
        />
        <AccountingSummaryCard
          label="Pending Entries"
          value={
            status === "loading"
              ? "..."
              : (data?.summary.pendingEntries ?? 0).toLocaleString()
          }
          icon={BookOpen}
          tone="bg-amber-50 text-amber-600"
        />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <WalletCards size={18} className="text-slate-500" />
            <h2 className="text-base font-bold text-slate-900">
              Financial Position
            </h2>
          </div>
          <div className="mt-5 divide-y divide-slate-100">
            {(
              [
                ["Assets", data?.position.assets ?? 0, "text-emerald-700"],
                [
                  "Liabilities",
                  data?.position.liabilities ?? 0,
                  "text-orange-700",
                ],
                ["Equity", data?.position.equity ?? 0, "text-blue-700"],
              ] as const
            ).map(([label, value, color]) => (
              <div
                key={label}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <span className="text-sm text-slate-600">{label}</span>
                <span className={`text-sm font-bold ${color}`}>
                  {currency(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="xl:col-span-2">
          <AccountingOverviewChart
            data={data?.chart ?? { month: [], lastMonth: [], year: [] }}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white xl:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Recent Journal Entries
              </h2>
              <p className="mt-0.5 text-xs text-slate-600">
                Latest entries recorded in the accounting ledger.
              </p>
            </div>
            {/* <Link
              to="/super-admin/accounting/journal-entries"
              className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
            >
              View all
            </Link> */}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-170">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {[
                    "Date",
                    "Description",
                    "Reference",
                    "Debit",
                    "Credit",
                    "Status",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-3 text-left text-xs font-medium text-slate-600"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.journalEntries ?? []).length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-sm text-slate-500"
                    >
                      {status === "loading"
                        ? "Loading journal entries..."
                        : "No journal entries found."}
                    </td>
                  </tr>
                ) : (
                  data?.journalEntries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {entry.date}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700">
                        {entry.description}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {entry.reference}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-slate-700">
                        {currency(entry.debit)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-slate-700">
                        {currency(entry.credit)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-medium ${entry.status === "POSTED" ? "bg-emerald-50 text-emerald-700" : entry.status === "PENDING" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}
                        >
                          {statusLabel(entry.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <CircleDollarSign size={18} className="text-slate-500" />
            <h2 className="text-base font-bold text-slate-900">
              Account Balances
            </h2>
          </div>
          <div className="mt-4 divide-y divide-slate-100">
            {(data?.accountBalances ?? []).map((account) => (
              <div
                key={account.name}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span className="text-xs text-slate-600">{account.name}</span>
                <span className="text-xs font-semibold text-slate-900">
                  {currency(account.balance)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
        <div className="flex items-center gap-2">
          <BookOpen size={18} className="text-slate-500" />
          <h2 className="text-base font-bold text-slate-900">
            Accounting Status
          </h2>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            Object.entries(
              data?.statusCounts ?? {
                POSTED: 0,
                DRAFT: 0,
                PENDING: 0,
                REVERSED: 0,
              },
            ) as [AccountingStatus, number][]
          ).map(([key, value]) => (
            <div key={key} className="rounded-lg bg-slate-50 px-3 py-3">
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                {statusLabel(key)}
              </p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {quickActions.map(({ label, to, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
          >
            <Icon size={15} />
            {label}
          </Link>
        ))}
      </div>
    </section>
  );
};

export default AdminAccountingOverviewPage;

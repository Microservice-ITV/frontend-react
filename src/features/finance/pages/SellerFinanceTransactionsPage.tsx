import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { useAppSelector } from "@/app/hooks";
import DataTablePagination from "@/components/ui/DataTablePagination";
import { authClient } from "@/lib/api/authClient";
import { accountingClient } from "@/lib/api/accountingClient";
import type { AccountingIncomeLine } from "@/features/accounting/types/accountingTypes";
import {
  accountingReferenceKey,
  formatAccountingReferences,
} from "@/features/accounting/utils/accountingReferenceFormatting";

type AccessContextResponse = {
  data?: {
    user?: { active_shop_id?: string | null };
    access_context?: {
      active_shop?: { shop_id?: string | null } | null;
      shops?: Array<{ shop_id?: string | null }>;
    };
  };
};

type TransactionRow = {
  id: string;
  dateValue: string;
  date: string;
  time: string;
  description: string;
  category: string;
  categoryDescription: string;
  direction: "Money In" | "Money Out";
  amount: number;
  currency: string;
  reference: string;
  account: string;
  status: string;
  referenceType: string;
  referenceId: string;
};

const normalizeShopId = (value: string) => value.trim().toLowerCase();

const extractShopId = (value?: string | null) => {
  if (!value) return null;
  const match = value.match(/(?:^|[\s,(])shop(?:_id)?=([^,\s)]+)/i);
  return match?.[1] ? normalizeShopId(match[1]) : null;
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

const formatTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
};

export const toSellerTransactionRows = (
  lines: AccountingIncomeLine[],
  allowedShopIds: Set<string>,
): TransactionRow[] => {
  const rows = lines
    .filter(
      (line) =>
        (line.account.type === "INCOME" && line.direction === "CREDIT") ||
        (line.account.type === "EXPENSE" && line.direction === "DEBIT"),
    )
    .flatMap((line) => {
      const shopId =
        (line.shopId ? normalizeShopId(line.shopId) : null) ??
        extractShopId(line.memo) ??
        extractShopId(line.journalEntry.narration) ??
        (allowedShopIds.size === 1 ? Array.from(allowedShopIds)[0] : null);

      if (!shopId || !allowedShopIds.has(shopId)) return [];

      const isIncome = line.account.type === "INCOME";
      const dateValue = line.journalEntry.entryDate.slice(0, 10);
      const referenceType = line.journalEntry.referenceType.trim();
      const referenceId = line.journalEntry.referenceId.trim();
      const categoryDescription =
        line.memo?.trim() || line.journalEntry.narration?.trim() || line.account.name;
      return [
        {
          id: line.id,
          dateValue,
          date: formatDate(line.journalEntry.entryDate),
          time: formatTime(line.journalEntry.entryDate),
          description: "",
          category: line.account.name,
          categoryDescription,
          direction: isIncome ? ("Money In" as const) : ("Money Out" as const),
          amount: Number(line.amount),
          currency:"MMK",//line.currency ?? "MMK",
          reference: "",
          account: `${line.account.code} · ${line.account.name}`,
          status: line.journalEntry.status,
          referenceType,
          referenceId,
        },
      ];
    })
  const formattedReferences = formatAccountingReferences(
    rows.map((row) => ({
      referenceType: row.referenceType,
      referenceId: row.referenceId,
      date: row.dateValue,
    })),
  );

  return rows
    .map((row) => {
      const formattedReference =
        formattedReferences.get(
          accountingReferenceKey({
            referenceType: row.referenceType,
            referenceId: row.referenceId,
            date: row.dateValue,
          }),
        ) ?? `${row.referenceType} · ${row.referenceId}`;
      return {
        ...row,
        description: formattedReference,
        reference: formattedReference,
      };
    })
    .sort((left, right) => right.dateValue.localeCompare(left.dateValue));
};

const SellerFinanceTransactionsPage = () => {
  const authUser = useAppSelector((state) => state.auth.user);
  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [status, setStatus] = useState<"loading" | "succeeded" | "failed">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionRow | null>(null);

  const loadTransactions = async () => {
    setStatus("loading");
    setError(null);
    try {
      const [accessResponse, reportResponse] = await Promise.all([
        authClient.get<AccessContextResponse>("/me/access-context"),
        accountingClient.get<{ entries?: AccountingIncomeLine[] }>(
          "/reports/profit-loss",
        ),
      ]);

      const context = accessResponse.data.data?.access_context;
      const shopIds = new Set(
        (context?.shops ?? [])
          .flatMap((shop) => (shop.shop_id ? [normalizeShopId(shop.shop_id)] : [])),
      );
      const activeShopId =
        context?.active_shop?.shop_id ??
        accessResponse.data.data?.user?.active_shop_id ??
        authUser?.active_shop_id;
      if (activeShopId) shopIds.add(normalizeShopId(activeShopId));

      setRows(toSellerTransactionRows(reportResponse.data.entries ?? [], shopIds));
      setStatus("succeeded");
    } catch (cause) {
      setRows([]);
      setStatus("failed");
      setError(
        cause instanceof Error && cause.message
          ? cause.message
          : "Unable to load transactions for your shop.",
      );
    }
  };

  useEffect(() => {
    void loadTransactions();
  }, [authUser?.id, authUser?.active_shop_id]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter(
      (row) =>
        !query ||
          [
            row.date,
            row.time,
            row.description,
            row.category,
            row.categoryDescription,
            row.direction,
            row.currency,
          ]
            .some((value) => value.toLowerCase().includes(query)),
    );
  }, [rows, search]);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const visibleRows = filteredRows.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  useEffect(() => {
    if (!selectedTransaction) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedTransaction(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [selectedTransaction]);

  return (
    <section className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to="/seller/overview" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <span>Accounting</span>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Transactions</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Transactions</h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Income and expenses recorded in your shop ledger.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadTransactions()}
          disabled={status === "loading"}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={14} className={status === "loading" ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-900">All transactions</p>
          <div className="relative w-full sm:w-64">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              placeholder="Search transactions, references, or keywords..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-200 py-2 pl-8 pr-3 text-xs outline-none placeholder:text-slate-400 focus:border-emerald-500"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1060px] table-fixed">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="w-[12%] px-4 py-3 text-left text-xs font-semibold text-slate-600">
                  Date
                </th>
                <th className="w-[20%] px-4 py-3 text-left text-xs font-semibold text-slate-600">
                  Transaction
                </th>
                <th className="w-[21%] px-4 py-3 text-left text-xs font-semibold text-slate-600">
                  Category / Description
                </th>
                <th className="w-[12%] px-4 py-3 text-left text-xs font-semibold text-slate-600">
                  Direction
                </th>
                <th className="w-[13%] px-4 py-3 text-right text-xs font-semibold text-slate-600">
                  Amount
                </th>
                <th className="w-[11%] px-4 py-3 text-left text-xs font-semibold text-slate-600">
                  Status
                </th>
                <th className="w-[11%] px-4 py-3 text-center text-xs font-semibold text-slate-600">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {status === "loading" && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                    Loading transactions...
                  </td>
                </tr>
              )}
              {status === "succeeded" && visibleRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                    No transactions found.
                  </td>
                </tr>
              )}
              {status === "failed" && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                    Transactions could not be loaded.
                  </td>
                </tr>
              )}
              {visibleRows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-100 last:border-0 transition-colors hover:bg-slate-50/80"
                >
                  <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-600">
                    <span className="block font-medium text-slate-700">{row.date}</span>
                    <span className="mt-0.5 block text-[10px] text-slate-400">{row.time}</span>
                  </td>
                  <td className="max-w-[260px] px-4 py-3.5">
                    <div className="inline-flex w-full min-w-0 items-center gap-2.5">
                      <span
                        className={`grid size-7 shrink-0 place-items-center rounded-lg ${
                          row.direction === "Money In"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-rose-50 text-rose-600"
                        }`}
                      >
                        {row.direction === "Money In" ? (
                          <ArrowDownLeft size={12} strokeWidth={2.5} />
                        ) : (
                          <ArrowUpRight size={12} strokeWidth={2.5} />
                        )}
                      </span>
                      <div className="min-w-0">
                        <span
                          title={row.description}
                          className="block truncate text-xs font-semibold text-slate-800"
                        >
                          {row.description}
                        </span>
                        <span className="mt-0.5 block truncate text-[10px] text-slate-400">
                          {row.category}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="max-w-[280px] px-4 py-3.5">
                    <span className="block truncate text-xs font-medium text-slate-700">
                      {row.category}
                    </span>
                    <span
                      title={row.categoryDescription}
                      className="mt-0.5 block truncate text-[10px] text-slate-400"
                    >
                      {row.categoryDescription}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                        row.direction === "Money In"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {row.direction}
                    </span>
                  </td>
                  <td
                    className={`whitespace-nowrap px-4 py-3.5 text-right text-xs font-semibold tabular-nums ${
                      row.direction === "Money In"
                        ? "text-emerald-700"
                        : "text-rose-700"
                    }`}
                  >
                    {row.direction === "Money In" ? "+" : "−"}
                    {row.amount.toLocaleString()} {row.currency}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                        row.status === "POSTED"
                          ? "bg-emerald-50 text-emerald-700"
                          : row.status === "PENDING" || row.status === "DRAFT"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {row.status.toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase())}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <button
                      type="button"
                      aria-label={`View details for ${row.description}`}
                      onClick={() => setSelectedTransaction(row)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-sky-700 transition-colors hover:border-sky-200 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {selectedTransaction &&
          typeof document !== "undefined" &&
          createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4"
              role="presentation"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  setSelectedTransaction(null);
                }
              }}
            >
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="transaction-details-title"
                className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
              >
                <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
                  <div className="min-w-0">
                    <h2
                      id="transaction-details-title"
                      className="text-base font-bold text-slate-900"
                    >
                      Transaction Details
                    </h2>
                    <p className="mt-1 break-all text-xs text-slate-500">
                      {selectedTransaction.reference}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Close transaction details"
                    onClick={() => setSelectedTransaction(null)}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <X size={17} />
                  </button>
                </div>
                <div className="grid gap-4 px-5 py-4 sm:grid-cols-3">
                  <div>
                    <p className="text-[11px] text-slate-400">Entry date</p>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {selectedTransaction.date}
                      {selectedTransaction.time && (
                        <span className="mt-0.5 block text-xs font-normal text-slate-500">
                          {selectedTransaction.time}
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400">Status</p>
                    <span
                      className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                        selectedTransaction.status === "POSTED"
                          ? "bg-emerald-50 text-emerald-700"
                          : selectedTransaction.status === "PENDING" ||
                              selectedTransaction.status === "DRAFT"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {selectedTransaction.status
                        .toLowerCase()
                        .replace(/^\w/, (letter) => letter.toUpperCase())}
                    </span>
                  </div>
                  <div className="sm:row-span-2">
                    <p className="text-[11px] text-slate-400">Narration</p>
                    <p className="mt-1 break-words text-sm text-slate-700">
                      {selectedTransaction.categoryDescription || "—"}
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto px-5 pb-4">
                  <table className="w-full min-w-[560px] table-fixed text-left">
                    <thead>
                      <tr className="border-y border-slate-100 bg-slate-50/80">
                        <th className="w-[28%] px-3 py-3 text-[11px] font-semibold text-slate-500">
                          Account
                        </th>
                        <th className="w-[38%] px-3 py-3 text-[11px] font-semibold text-slate-500">
                          Memo
                        </th>
                        <th className="w-[17%] px-3 py-3 text-right text-[11px] font-semibold text-slate-500">
                          Debit
                        </th>
                        <th className="w-[17%] px-3 py-3 text-right text-[11px] font-semibold text-slate-500">
                          Credit
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-100">
                        <td className="px-3 py-4 text-xs text-slate-700">
                          {selectedTransaction.account}
                        </td>
                        <td className="px-3 py-4 text-xs text-slate-600">
                          {selectedTransaction.categoryDescription || "—"}
                        </td>
                        <td
                          className={`px-3 py-4 text-right text-xs font-semibold tabular-nums ${
                            selectedTransaction.direction === "Money Out"
                              ? "text-rose-600"
                              : "text-slate-400"
                          }`}
                        >
                          {selectedTransaction.direction === "Money Out"
                            ? `${selectedTransaction.amount.toLocaleString()} ${selectedTransaction.currency}`
                            : "—"}
                        </td>
                        <td
                          className={`px-3 py-4 text-right text-xs font-semibold tabular-nums ${
                            selectedTransaction.direction === "Money In"
                              ? "text-emerald-600"
                              : "text-slate-400"
                          }`}
                        >
                          {selectedTransaction.direction === "Money In"
                            ? `${selectedTransaction.amount.toLocaleString()} ${selectedTransaction.currency}`
                            : "—"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end px-5 pb-4">
                  <button
                    type="button"
                    onClick={() => setSelectedTransaction(null)}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  >
                    <Check size={14} className="mr-1 inline" />
                    Done
                  </button>
                </div>
              </section>
            </div>,
            document.body,
          )}
        <DataTablePagination
          page={page}
          totalPages={totalPages}
          rowsPerPage={rowsPerPage}
          totalItems={filteredRows.length}
          itemLabel="transactions"
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

export default SellerFinanceTransactionsPage;

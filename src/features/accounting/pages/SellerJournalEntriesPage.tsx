import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, RefreshCw } from "lucide-react";
import DataTablePagination from "@/components/ui/DataTablePagination";
import AccountingStatusBadge from "../components/AccountingStatusBadge";
import { accountingExpensesAdapter } from "../adapters/accountingExpensesAdapter";
import type { AccountingJournalEntry } from "../types/expenseTypes";

const errorMessage = (error: unknown) => {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { error?: unknown } } })
      .response;
    if (typeof response?.data?.error === "string") return response.data.error;
  }
  return error instanceof Error && error.message
    ? error.message
    : "Unable to load journal entries.";
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

const formatAmount = (value: number) => value.toLocaleString();
const getLineNarration = (
  entry: AccountingJournalEntry,
  line: AccountingJournalEntry["lines"][number],
  lineIndex: number,
) => {
  if (line.memo) return line.memo;
  if (line.direction === "CREDIT") return "(Funding offset)";
  const firstDebitIndex = entry.lines.findIndex(
    (entryLine) => entryLine.direction === "DEBIT",
  );
  return lineIndex === firstDebitIndex ? entry.narration ?? "—" : "—";
};

const SellerJournalEntriesPage = () => {
  const [entries, setEntries] = useState<AccountingJournalEntry[]>([]);
  const [status, setStatus] = useState<"loading" | "succeeded" | "failed">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const load = async () => {
    setStatus("loading");
    setError(null);
    try {
      setEntries(await accountingExpensesAdapter.listJournalEntries());
      setStatus("succeeded");
    } catch (cause) {
      setStatus("failed");
      setError(errorMessage(cause));
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const totalPages = Math.max(1, Math.ceil(entries.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const visibleEntries = entries.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );
  return (
    <section className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to="/seller/overview" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Journal Entries</span>
      </nav>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <BookOpen size={22} className="text-blue-600" />
            Journal Entries
          </h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Read-only ledger entries returned by accounting-service.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={status === "loading"}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            size={15}
            className={status === "loading" ? "animate-spin" : ""}
          />
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
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Reference
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Entry Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Account Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Narration
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-600">
                  Debit
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-600">
                  Credit
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {status === "loading" && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-sm text-slate-500"
                  >
                    Loading journal entries...
                  </td>
                </tr>
              )}
              {status === "succeeded" && entries.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-sm text-slate-500"
                  >
                    No journal entries found.
                  </td>
                </tr>
              )}
              {status === "succeeded" &&
                visibleEntries.flatMap((entry) =>
                  entry.lines.map((line, lineIndex) => (
                  <tr
                    key={`${entry.id}-${line.id}`}
                    className={`border-b border-slate-100 align-top last:border-0 ${
                      lineIndex === 0 ? "border-t-2 border-t-slate-200" : ""
                    }`}
                  >
                    <td className="px-4 py-4 text-xs font-semibold text-slate-900">
                      {lineIndex === 0 ? (
                        <>
                          {entry.referenceId}
                          <span className="mt-0.5 block text-[10px] font-normal text-slate-500">
                            {entry.referenceType}
                          </span>
                        </>
                      ) : (
                        <span className="font-normal text-slate-400">
                          (same ref)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-600">
                      {formatDate(entry.entryDate)}
                    </td>
                    <td className="px-4 py-4 text-xs font-medium text-slate-800">
                      {line.account.code} · {line.account.name}
                    </td>
                    <td
                      className="max-w-[320px] px-4 py-4 text-xs text-slate-600"
                      title={getLineNarration(entry, line, lineIndex)}
                    >
                      <span className="block max-w-[320px] truncate cursor-help">
                        {getLineNarration(entry, line, lineIndex)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right text-xs font-semibold text-slate-700">
                      {line.direction === "DEBIT"
                        ? formatAmount(Number(line.amount))
                        : "—"}
                    </td>
                    <td className="px-4 py-4 text-right text-xs font-semibold text-slate-700">
                      {line.direction === "CREDIT"
                        ? formatAmount(Number(line.amount))
                        : "—"}
                    </td>
                    <td className="px-4 py-4">
                      <AccountingStatusBadge status={entry.status} />
                    </td>
                  </tr>
                  )),
                )}
            </tbody>
          </table>
        </div>
        {status === "succeeded" && entries.length > 0 && (
          <DataTablePagination
            page={currentPage}
            totalPages={totalPages}
            rowsPerPage={rowsPerPage}
            totalItems={entries.length}
            itemLabel="journal entries"
            onPageChange={setPage}
            onRowsPerPageChange={(value) => {
              setRowsPerPage(value);
              setPage(1);
            }}
          />
        )}
      </div>
    </section>
  );
};

export default SellerJournalEntriesPage;

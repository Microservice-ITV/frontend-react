import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, RefreshCw } from "lucide-react";
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

const SellerJournalEntriesPage = () => {
  const [entries, setEntries] = useState<AccountingJournalEntry[]>([]);
  const [status, setStatus] = useState<"loading" | "succeeded" | "failed">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);
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
          <table className="w-full min-w-275">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Reference
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Narration
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Entry Date
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
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Funding Account
                </th>
              </tr>
            </thead>
            <tbody>
              {status === "loading" && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-sm text-slate-500"
                  >
                    Loading journal entries...
                  </td>
                </tr>
              )}
              {status === "succeeded" && entries.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-sm text-slate-500"
                  >
                    No journal entries found.
                  </td>
                </tr>
              )}
              {status === "succeeded" &&
                entries.map((entry) => (
                  (() => {
                    const debit = entry.lines
                      .filter((line) => line.direction === "DEBIT")
                      .reduce((sum, line) => sum + Number(line.amount), 0);
                    const creditLines = entry.lines.filter(
                      (line) => line.direction === "CREDIT",
                    );
                    const credit = creditLines.reduce(
                      (sum, line) => sum + Number(line.amount),
                      0,
                    );
                    const fundingAccount = creditLines
                      .map(
                        (line) =>
                          `${line.account.code} · ${line.account.name}`,
                      )
                      .join(", ");

                    return (
                  <tr
                    key={entry.id}
                    className="border-b border-slate-100 align-top last:border-0"
                  >
                    <td className="px-4 py-4 text-xs font-semibold text-slate-900">
                      {entry.referenceId}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-600">
                      {entry.referenceType}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-600">
                      {entry.narration ?? "—"}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-600">
                      {formatDate(entry.entryDate)}
                    </td>
                    <td className="px-4 py-4 text-right text-xs font-semibold text-slate-700">
                      {formatAmount(debit)}
                    </td>
                    <td className="px-4 py-4 text-right text-xs font-semibold text-slate-700">
                      {formatAmount(credit)}
                    </td>
                    <td className="px-4 py-4">
                      <AccountingStatusBadge status={entry.status} />
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-600">
                      {fundingAccount || "—"}
                    </td>
                  </tr>
                    );
                  })()
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default SellerJournalEntriesPage;

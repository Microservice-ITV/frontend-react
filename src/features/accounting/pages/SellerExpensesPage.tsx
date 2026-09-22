import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, ReceiptText, RefreshCw } from "lucide-react";
import { useAppSelector } from "@/app/hooks";
import { authClient } from "@/lib/api/authClient";
import AccountingStatusBadge from "../components/AccountingStatusBadge";
import { accountingExpensesAdapter } from "../adapters/accountingExpensesAdapter";
import type { AccountingExpense, ExpenseCategory } from "../types/expenseTypes";

const errorMessage = (error: unknown) => {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { error?: unknown } } })
      .response;
    if (typeof response?.data?.error === "string") return response.data.error;
  }
  return error instanceof Error && error.message
    ? error.message
    : "Unable to load expenses.";
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

type AccessContextResponse = {
  data?: {
    access_context?: {
      shops?: Array<{
        shop_id?: string | null;
        shop_name?: string | null;
      }>;
    };
  };
};

const SellerExpensesPage = () => {
  const authUser = useAppSelector((state) => state.auth.user);
  const [expenses, setExpenses] = useState<AccountingExpense[]>([]);
  const [shopNames, setShopNames] = useState<Record<string, string>>({});
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>(
    {},
  );
  const [status, setStatus] = useState<"loading" | "succeeded" | "failed">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setStatus("loading");
    setError(null);
    try {
      if (!authUser?.id)
        throw new Error(
          "Your authenticated seller account could not be resolved.",
        );
      const [loadedExpenses, accessContextResponse, loadedCategories] = await Promise.all([
        accountingExpensesAdapter.list(),
        authClient.get<AccessContextResponse>("/me/access-context"),
        accountingExpensesAdapter.listCategories(),
      ]);
      setExpenses(loadedExpenses);
      setShopNames(
        Object.fromEntries(
          (accessContextResponse.data.data?.access_context?.shops ?? []).flatMap((shop) => {
            return shop.shop_id && shop.shop_name
              ? [[normalizeShopId(shop.shop_id), shop.shop_name]]
              : [];
          }),
        ),
      );
      setCategoryNames(
        Object.fromEntries(
          loadedCategories.map((category: ExpenseCategory) => [
            category.id,
            category.name,
          ]),
        ),
      );
      setStatus("succeeded");
    } catch (cause) {
      setStatus("failed");
      setError(errorMessage(cause));
    }
  };

  useEffect(() => {
    void load();
  }, [authUser?.id]);

  return (
    <section className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to="/seller/overview" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Expenses</span>
      </nav>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <ReceiptText size={22} className="text-orange-600" />
            Expenses
          </h1>
          <p className="mt-0.5 text-sm text-slate-600">
            View expenses recorded for your authorized shops.
          </p>
        </div>
        <div className="flex gap-2">
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
          <Link
            to="/seller/accounting/expenses/new"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
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
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Expense No
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Shop
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Category
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-600">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Currency
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Action
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
                    Loading expenses...
                  </td>
                </tr>
              )}
              {status === "succeeded" && expenses.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <p className="text-sm font-medium text-slate-700">
                      No expenses found
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      The accounting service returned no expense records for
                      your shops.
                    </p>
                  </td>
                </tr>
              )}
              {status === "succeeded" &&
                expenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 text-xs font-semibold text-slate-900">
                      {expense.expenseNo}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {expense.shopId
                        ? (shopNames[normalizeShopId(expense.shopId)] ?? "—")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {formatDate(expense.expenseDate)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {categoryNames[expense.expenseTypeId] ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-semibold text-slate-900">
                      {Number(expense.amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {expense.currency}
                    </td>
                    <td className="px-4 py-3">
                      <AccountingStatusBadge status={expense.status} />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/seller/accounting/expenses/${encodeURIComponent(expense.id)}`}
                        className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default SellerExpensesPage;

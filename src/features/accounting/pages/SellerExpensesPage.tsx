import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, ReceiptText, RefreshCw, Search } from "lucide-react";
import { useAppSelector } from "@/app/hooks";
import DataTablePagination from "@/components/ui/DataTablePagination";
import { authClient } from "@/lib/api/authClient";
import AccountingStatusBadge, {
  accountingStatusLabel,
} from "../components/AccountingStatusBadge";
import { accountingExpensesAdapter } from "../adapters/accountingExpensesAdapter";
import type { AccountingExpense, ExpenseCategory } from "../types/expenseTypes";
import {
  accountingReferenceKey,
  formatAccountingReferences,
  toExpenseReferenceInput,
} from "../utils/accountingReferenceFormatting";
import { isExpenseInAccounting } from "../utils/expenseAccounting";

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
  const [categoryCodes, setCategoryCodes] = useState<Record<string, string>>(
    {},
  );
  const [status, setStatus] = useState<"loading" | "succeeded" | "failed">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const statusOptions = [
    "DRAFT",
    "SUBMITTED",
    "PENDING_APPROVAL",
    "RETURNED",
    "APPROVED",
    "REJECTED",
    "CANCELLED",
  ];

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
      setCategoryCodes(
        Object.fromEntries(
          loadedCategories.map((category: ExpenseCategory) => [
            category.id,
            category.code,
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

  const formattedExpenseIds = useMemo(() => {
    const inputs = expenses.map((expense) =>
      toExpenseReferenceInput({
        expenseNo: expense.expenseNo,
        expenseDate: expense.expenseDate,
        categoryCode: expense.expenseType?.code ?? categoryCodes[expense.expenseTypeId],
        description: expense.description,
      }),
    );
    const formattedReferences = formatAccountingReferences(inputs);
    return new Map(
      expenses.map((expense) => [
        expense.expenseNo,
        formattedReferences.get(
          accountingReferenceKey({
            ...toExpenseReferenceInput({
              expenseNo: expense.expenseNo,
              expenseDate: expense.expenseDate,
              categoryCode: expense.expenseType?.code ?? categoryCodes[expense.expenseTypeId],
              description: expense.description,
            }),
          }),
        ) ?? expense.expenseNo,
      ]),
    );
  }, [categoryCodes, expenses]);

  const accountingExpenses = useMemo(
    () => expenses.filter((expense) =>
      isExpenseInAccounting(expense, categoryCodes[expense.expenseTypeId]),
    ),
    [categoryCodes, expenses],
  );
  const filteredExpenses = useMemo(() => {
    const query = search.trim().toLowerCase();
    return expenses.filter((expense) => {
      const categoryName = categoryNames[expense.expenseTypeId] ?? "";
      const shopName = expense.shopId
        ? (shopNames[normalizeShopId(expense.shopId)] ?? expense.shopId)
        : "";
      const matchesDate =
        (!fromDate || expense.expenseDate.slice(0, 10) >= fromDate) &&
        (!toDate || expense.expenseDate.slice(0, 10) <= toDate);
      const matchesStatus =
        statusFilter === "ALL" || expense.status === statusFilter;
      const matchesSearch =
        !query ||
        [
          formattedExpenseIds.get(expense.expenseNo) ?? expense.expenseNo,
          expense.expenseNo,
          shopName,
          categoryName,
          expense.description ?? "",
          expense.currency,
          expense.status,
        ].some((value) => value.toLowerCase().includes(query));

      return matchesDate && matchesStatus && matchesSearch;
    });
  }, [
    categoryNames,
    expenses,
    formattedExpenseIds,
    fromDate,
    search,
    shopNames,
    statusFilter,
    toDate,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredExpenses.length / rowsPerPage),
  );
  const visibleExpenses = filteredExpenses.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );
  const totalExpenses = accountingExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0,
  );

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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-orange-100 bg-orange-50 px-4 py-3">
          <p className="text-xs text-orange-700">Approved and DELI expenses</p>
          <p className="mt-1 text-lg font-bold text-orange-900">
            MMK {totalExpenses.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs text-slate-500">Expense entries</p>
          <p className="mt-1 text-lg font-bold text-slate-900">
            {filteredExpenses.length.toLocaleString()}
          </p>
        </div>
      </div>
      <p className="text-xs text-slate-500">
        All expenses are shown together. The status identifies requests awaiting approval; accounting totals include approved expenses and DELI expenses.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            placeholder="Search expense, shop, category, or status..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex items-center gap-2 text-xs text-slate-600">
            Status
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-emerald-500"
            >
              <option value="ALL">All statuses</option>
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {accountingStatusLabel(option)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-600">
            From
            <input
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(event) => {
                setFromDate(event.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-emerald-500"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-600">
            To
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(event) => {
                setToDate(event.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-emerald-500"
            />
          </label>
          {(fromDate || toDate || statusFilter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setFromDate("");
                setToDate("");
                setStatusFilter("ALL");
                setPage(1);
              }}
              className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-220">
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
              {status === "succeeded" && filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <p className="text-sm font-medium text-slate-700">
                      No expenses found
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Try adjusting your search, status, or date filters.
                    </p>
                  </td>
                </tr>
              )}
              {status === "succeeded" &&
                visibleExpenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="max-w-[220px] px-4 py-3 text-xs font-semibold text-slate-900">
                      <span
                        title={formattedExpenseIds.get(expense.expenseNo) ?? expense.expenseNo}
                        className="block truncate"
                      >
                        {formattedExpenseIds.get(expense.expenseNo) ?? expense.expenseNo}
                      </span>
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
                        to={`/seller/accounting/expenses/${encodeURIComponent(expense.expenseNo)}?displayId=${encodeURIComponent(formattedExpenseIds.get(expense.expenseNo) ?? expense.expenseNo)}`}
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
        <DataTablePagination
          page={page}
          totalPages={totalPages}
          rowsPerPage={rowsPerPage}
          totalItems={filteredExpenses.length}
          itemLabel="expense entries"
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

export default SellerExpensesPage;

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  CircleDollarSign,
  Plus,
  RefreshCw,
  RotateCcw,
  X,
} from "lucide-react";
import { useAppSelector } from "@/app/hooks";
import { accountingExpensesAdapter } from "@/features/accounting/adapters/accountingExpensesAdapter";
import AccountingStatusBadge from "@/features/accounting/components/AccountingStatusBadge";
import { isExpenseInAccounting } from "@/features/accounting/utils/expenseAccounting";
import type {
  AccountingExpense,
  ExpenseAccount,
  ExpenseCategory,
  PendingApprovalRecord,
} from "@/features/accounting/types/expenseTypes";

const errorMessage = (error: unknown) => {
  if (error && typeof error === "object" && "response" in error) {
    const response = (
      error as { response?: { data?: { error?: unknown; message?: unknown } } }
    ).response;
    if (typeof response?.data?.error === "string") return response.data.error;
    if (typeof response?.data?.message === "string")
      return response.data.message;
  }
  return error instanceof Error
    ? error.message
    : "Unable to load platform expenses.";
};

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";
const today = () => new Date().toISOString().slice(0, 10);

const PlatformExpensesPage = () => {
  const authUser = useAppSelector((state) => state.auth.user);
  const [expenses, setExpenses] = useState<AccountingExpense[]>([]);
  const [pending, setPending] = useState<PendingApprovalRecord[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [accounts, setAccounts] = useState<ExpenseAccount[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState({
    categoryId: "",
    expenseAccountCode: "",
    fundingAccountCode: "",
    amount: "",
    expenseDate: today(),
    description: "",
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [loadedExpenses, loadedPending, loadedCategories, loadedAccounts] =
        await Promise.all([
          accountingExpensesAdapter.list(),
          accountingExpensesAdapter.listPendingApprovals(),
          accountingExpensesAdapter.listCategories(),
          accountingExpensesAdapter.listAccounts(),
        ]);
      setExpenses(
        loadedExpenses.filter(
          (expense) => expense.scope === "PLATFORM" || !expense.shopId,
        ),
      );
      setPending(
        loadedPending.filter(
          (approval) =>
            approval.expense.scope === "PLATFORM" || !approval.expense.shopId,
        ),
      );
      setCategories(
        loadedCategories.filter((category) => category.status === "ACTIVE"),
      );
      setAccounts(loadedAccounts);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const expenseAccounts = useMemo(
    () =>
      accounts.filter(
        (account) => account.status === "ACTIVE" && account.type === "EXPENSE",
      ),
    [accounts],
  );
  const fundingAccounts = useMemo(
    () =>
      accounts.filter(
        (account) =>
          account.status === "ACTIVE" &&
          !["INCOME", "EXPENSE"].includes(account.type),
      ),
    [accounts],
  );
  const accountingExpenses = expenses.filter((expense) =>
    isExpenseInAccounting(expense),
  );
  const total = accountingExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0,
  );

  const createAndSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    const amount = Number(form.amount);
    if (
      !form.categoryId ||
      !form.expenseAccountCode ||
      !form.fundingAccountCode
    )
      return setError("Category and both accounts are required.");
    if (form.expenseAccountCode === form.fundingAccountCode)
      return setError("Expense and funding accounts must be different.");
    if (!Number.isFinite(amount) || amount <= 0)
      return setError("Amount must be greater than zero.");
    setSaving(true);
    try {
      const created = await accountingExpensesAdapter.create({
        scope: "PLATFORM",
        shopId: null,
        amount,
        expenseDate: form.expenseDate,
        expenseAccountCode: form.expenseAccountCode,
        fundingAccountCode: form.fundingAccountCode,
        expenseCategoryId: form.categoryId,
        description: form.description.trim() || undefined,
      });
      await accountingExpensesAdapter.submit(created.expense.id, authUser?.id);
      setNotice(
        `${created.expense.expenseNo} was submitted for platform approval.`,
      );
      setForm({
        categoryId: "",
        expenseAccountCode: "",
        fundingAccountCode: "",
        amount: "",
        expenseDate: today(),
        description: "",
      });
      setFormOpen(false);
      await load();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  };

  const decide = async (
    approval: PendingApprovalRecord,
    action: "approve" | "reject" | "return",
  ) => {
    setActionId(approval.id);
    setError(null);
    try {
      if (action === "approve")
        await accountingExpensesAdapter.approveExpense(
          approval.expenseId,
          approval.id,
        );
      if (action === "reject")
        await accountingExpensesAdapter.rejectExpense(
          approval.expenseId,
          approval.id,
          "Rejected from platform dashboard",
        );
      if (action === "return")
        await accountingExpensesAdapter.returnExpense(
          approval.expenseId,
          approval.id,
          "Please correct the platform expense",
        );
      await load();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setActionId(null);
    }
  };

  return (
    <section className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to="/super-admin/overview" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <span>Accounting</span>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Platform Expenses</span>
      </nav>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <CircleDollarSign size={22} className="text-indigo-600" />
            Platform Expenses
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Create, submit, and review expenses owned by the platform.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <Link
            to="/super-admin/accounting/platform-expenses/new"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Plus size={15} />
            New expense
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
      {notice && (
        <p
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
        >
          {notice}
        </p>
      )}

      {formOpen && (
        <form
          onSubmit={createAndSubmit}
          className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 sm:p-6"
        >
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900">
              New platform expense
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              The expense will be submitted to the configured platform approval
              chain after creation.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs font-medium text-slate-600">
              Category
              <select
                value={form.categoryId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    categoryId: event.target.value,
                  }))
                }
                className={inputClass}
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.code} · {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-slate-600">
              Expense account
              <select
                value={form.expenseAccountCode}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    expenseAccountCode: event.target.value,
                  }))
                }
                className={inputClass}
              >
                <option value="">Select account</option>
                {expenseAccounts.map((account) => (
                  <option key={account.code} value={account.code}>
                    {account.code} · {account.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-slate-600">
              Funding account
              <select
                value={form.fundingAccountCode}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    fundingAccountCode: event.target.value,
                  }))
                }
                className={inputClass}
              >
                <option value="">Select account</option>
                {fundingAccounts.map((account) => (
                  <option key={account.code} value={account.code}>
                    {account.code} · {account.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-slate-600">
              Amount
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    amount: event.target.value,
                  }))
                }
                className={inputClass}
                placeholder="0.00"
              />
            </label>
            <label className="text-xs font-medium text-slate-600">
              Expense date
              <input
                type="date"
                value={form.expenseDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    expenseDate: event.target.value,
                  }))
                }
                className={inputClass}
              />
            </label>
            <label className="text-xs font-medium text-slate-600 sm:col-span-2">
              Description
              <textarea
                rows={2}
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                className={`${inputClass} resize-y`}
                placeholder="Why was this platform expense incurred?"
              />
            </label>
          </div>
          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "Submitting..." : "Create and submit"}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
          <p className="text-xs text-indigo-700">Platform total</p>
          <p className="mt-1 text-lg font-bold text-indigo-950">
            MMK {total.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs text-slate-500">Expense entries</p>
          <p className="mt-1 text-lg font-bold text-slate-900">
            {expenses.length}
          </p>
        </div>
        <div className="hidden rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 sm:block">
          <p className="text-xs text-amber-700">Awaiting my decision</p>
          <p className="mt-1 text-lg font-bold text-amber-950">
            {pending.length}
          </p>
        </div>
      </div>

      {pending.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <h2 className="mb-3 text-sm font-bold text-amber-950">
            Pending platform approvals
          </h2>
          <div className="space-y-2">
            {pending.map((approval) => (
              <div
                key={approval.id}
                className="flex flex-col gap-3 rounded-lg border border-amber-100 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {approval.expense.expenseNo} · MMK{" "}
                    {Number(approval.expense.amount).toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {approval.expense.description || "No description"} · Step{" "}
                    {approval.stepNo}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={actionId === approval.id}
                    onClick={() => void decide(approval, "return")}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <RotateCcw size={13} />
                    Return
                  </button>
                  <button
                    type="button"
                    disabled={actionId === approval.id}
                    onClick={() => void decide(approval, "reject")}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    <X size={13} />
                    Reject
                  </button>
                  <button
                    type="button"
                    disabled={actionId === approval.id}
                    onClick={() => void decide(approval, "approve")}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <Check size={13} />
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-slate-500">
        All platform expenses are shown together. Status identifies requests awaiting approval; the platform total includes approved expenses and DELI expenses.
      </p>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-205">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Reference
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
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-sm text-slate-500"
                  >
                    Loading platform expenses...
                  </td>
                </tr>
              )}
              {!loading && expenses.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-sm text-slate-500"
                  >
                    No platform expenses yet.
                  </td>
                </tr>
              )}
              {!loading &&
                expenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 text-xs font-semibold text-slate-900">
                      <Link
                        to={`/super-admin/accounting/platform-expenses/${encodeURIComponent(expense.expenseNo)}`}
                        className="text-indigo-700 hover:text-indigo-900"
                      >
                        {expense.expenseNo}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {new Date(expense.expenseDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {expense.expenseType?.name ?? expense.expenseTypeId}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-semibold text-slate-900">
                      {expense.currency}{" "}
                      {Number(expense.amount).toLocaleString()}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-xs text-slate-600">
                      {expense.description || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <AccountingStatusBadge status={expense.status} />
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

export default PlatformExpensesPage;

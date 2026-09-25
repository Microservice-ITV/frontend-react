import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  CheckCircle2,
  Eye,
  Plus,
  RefreshCw,
  Save,
  Settings2,
  Trash2,
  XCircle,
} from "lucide-react";
import { accountingExpensesAdapter } from "@/features/accounting/adapters/accountingExpensesAdapter";
import AccountingStatusBadge from "@/features/accounting/components/AccountingStatusBadge";
import type { ApprovalPolicy } from "@/features/accounting/types/expenseTypes";

const errorMessage = (error: unknown) => {
  if (error && typeof error === "object" && "response" in error) {
    const data = (
      error as { response?: { data?: { error?: unknown; message?: unknown } } }
    ).response?.data;
    if (typeof data?.error === "string") return data.error;
    if (typeof data?.message === "string") return data.message;
  }
  return error instanceof Error
    ? error.message
    : "Unable to load platform approval policies.";
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 disabled:bg-slate-50";

const PlatformApprovalPoliciesPage = () => {
  const { policyId } = useParams<{ policyId?: string }>();
  const navigate = useNavigate();
  const path = window.location.pathname;
  const readOnly = path.endsWith("/view");
  const editing = Boolean(policyId) && !readOnly;
  const [policies, setPolicies] = useState<ApprovalPolicy[]>([]);
  const [value, setValue] = useState({
    name: "",
    minAmount: "",
    maxAmount: "",
    unlimited: true,
    level: "1",
    isActive: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await accountingExpensesAdapter.listApprovalPolicies(
        undefined,
        "PLATFORM",
      );
      setPolicies(rows);
      if (policyId) {
        const policy = await accountingExpensesAdapter.getApprovalPolicy(
          policyId,
          undefined,
          "PLATFORM",
        );
        setValue({
          name: policy.name,
          minAmount: policy.minAmount,
          maxAmount: policy.maxAmount ?? "",
          unlimited: policy.maxAmount === null,
          level: String(policy.level),
          isActive: policy.isActive,
        });
      }
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [policyId]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const minAmount = Number(value.minAmount);
    const maxAmount = value.unlimited ? null : Number(value.maxAmount);
    const level = Number(value.level);
    if (!value.name.trim()) return setError("Policy name is required.");
    if (!Number.isFinite(minAmount) || minAmount < 0)
      return setError("Minimum amount must be non-negative.");
    if (
      !value.unlimited &&
      (!Number.isFinite(maxAmount) || maxAmount! < minAmount)
    )
      return setError(
        "Maximum amount must be greater than or equal to minimum amount.",
      );
    if (!Number.isInteger(level) || level < 1)
      return setError("Approval level must be a positive integer.");
    setSaving(true);
    setError(null);
    try {
      const payload = {
        scope: "PLATFORM" as const,
        shopId: null,
        name: value.name.trim(),
        minAmount,
        maxAmount,
        level,
        isActive: value.isActive,
      };
      if (policyId)
        await accountingExpensesAdapter.updateApprovalPolicy(policyId, payload);
      else await accountingExpensesAdapter.createApprovalPolicy(payload);
      navigate("/super-admin/accounting/platform-approval-policies");
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (policy: ApprovalPolicy) => {
    try {
      await accountingExpensesAdapter.setApprovalPolicyActive(
        policy.id,
        undefined,
        !policy.isActive,
        "PLATFORM",
      );
      await load();
    } catch (cause) {
      setError(errorMessage(cause));
    }
  };

  const remove = async (policy: ApprovalPolicy) => {
    if (policy.isActive || !window.confirm(`Delete ${policy.name}?`)) return;
    try {
      await accountingExpensesAdapter.deleteApprovalPolicy(
        policy.id,
        undefined,
        "PLATFORM",
      );
      await load();
    } catch (cause) {
      setError(errorMessage(cause));
    }
  };

  const isForm = path.endsWith("/new") || editing || readOnly;

  if (isForm) {
    return (
      <section className="space-y-6">
        <Link
          to="/super-admin/accounting/platform-approval-policies"
          className="text-xs font-medium text-slate-600 hover:text-slate-900"
        >
          ← Back to platform policies
        </Link>
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Settings2 size={22} className="text-indigo-600" />
            {readOnly
              ? "Platform Policy Details"
              : policyId
                ? "Edit Platform Policy"
                : "Create Platform Policy"}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Define the approval level required for platform expense ranges.
          </p>
        </div>
        {error && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        {loading ? (
          <p className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
            Loading policy...
          </p>
        ) : (
          <form
            onSubmit={save}
            className="space-y-5 rounded-xl border border-slate-200 bg-white p-4 sm:p-6"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Policy name
                <input
                  disabled={readOnly}
                  value={value.name}
                  onChange={(event) =>
                    setValue({ ...value, name: event.target.value })
                  }
                  className={`${inputClass} mt-1.5`}
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Approval level
                <input
                  disabled={readOnly}
                  type="number"
                  min="1"
                  value={value.level}
                  onChange={(event) =>
                    setValue({ ...value, level: event.target.value })
                  }
                  className={`${inputClass} mt-1.5`}
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Minimum amount
                <input
                  disabled={readOnly}
                  type="number"
                  min="0"
                  value={value.minAmount}
                  onChange={(event) =>
                    setValue({ ...value, minAmount: event.target.value })
                  }
                  className={`${inputClass} mt-1.5`}
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Maximum amount
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    disabled={readOnly || value.unlimited}
                    type="number"
                    min="0"
                    value={value.maxAmount}
                    onChange={(event) =>
                      setValue({ ...value, maxAmount: event.target.value })
                    }
                    className={`${inputClass} flex-1`}
                  />
                  <label className="flex items-center gap-1 whitespace-nowrap text-xs font-normal">
                    <input
                      disabled={readOnly}
                      type="checkbox"
                      checked={value.unlimited}
                      onChange={(event) =>
                        setValue({ ...value, unlimited: event.target.checked })
                      }
                    />
                    No maximum
                  </label>
                </div>
              </label>
            </div>
            {!readOnly && (
              <div className="flex justify-end border-t border-slate-100 pt-5">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  <Save size={15} />
                  {saving ? "Saving..." : "Save policy"}
                </button>
              </div>
            )}
          </form>
        )}
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to="/super-admin/overview" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <span>Accounting</span>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Platform Approval Policies</span>
      </nav>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Settings2 size={22} className="text-indigo-600" />
            Platform Approval Policies
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Configure approval levels for platform-owned expenses.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
          <Link
            to="/super-admin/accounting/platform-approval-policies/new"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Plus size={15} />
            Create policy
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
          <table className="w-full min-w-200">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Policy
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-600">
                  Minimum
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-600">
                  Maximum
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-600">
                  Level
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Actions
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
                    Loading policies...
                  </td>
                </tr>
              )}
              {!loading && policies.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-sm text-slate-500"
                  >
                    No platform approval policies configured.
                  </td>
                </tr>
              )}
              {!loading &&
                policies.map((policy) => (
                  <tr
                    key={policy.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                      {policy.name}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-600">
                      {Number(policy.minAmount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-600">
                      {policy.maxAmount === null
                        ? "No maximum"
                        : Number(policy.maxAmount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-slate-600">
                      {policy.level}
                    </td>
                    <td className="px-4 py-3">
                      <AccountingStatusBadge
                        status={policy.isActive ? "ACTIVE" : "INACTIVE"}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 text-xs">
                        <Link
                          to={`/super-admin/accounting/platform-approval-policies/${policy.id}/view`}
                          className="inline-flex items-center gap-1 text-slate-600"
                        >
                          <Eye size={13} />
                          View
                        </Link>
                        <Link
                          to={`/super-admin/accounting/platform-approval-policies/${policy.id}/edit`}
                          className="text-indigo-700"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => void toggle(policy)}
                          className="inline-flex items-center gap-1 text-amber-700"
                        >
                          {policy.isActive ? (
                            <XCircle size={13} />
                          ) : (
                            <CheckCircle2 size={13} />
                          )}
                          {policy.isActive ? "Deactivate" : "Activate"}
                        </button>
                        {!policy.isActive && (
                          <button
                            type="button"
                            onClick={() => void remove(policy)}
                            className="inline-flex items-center gap-1 text-red-700"
                          >
                            <Trash2 size={13} />
                            Delete
                          </button>
                        )}
                      </div>
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

export default PlatformApprovalPoliciesPage;

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Pencil, Plus, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import { selectAuthUser } from "@/features/auth/store/authSelectors";
import { shippingApi } from "@/features/shipping/api/shippingApi";
import {
  getSellerDeliveryCompanyFeeApiErrorMessage,
  sellerDeliveryCompanyFeeApi,
  type DeliveryChargingBasis,
  type SellerDeliveryCompanyFee,
  type SellerDeliveryCompanyFeePayload,
} from "../api/sellerDeliveryCompanyFeeApi";

type DeliveryCompanyOption = {
  id: string;
  code: string;
  name: string;
  status: "ACTIVE";
};

type FeeDraft = {
  deliveryCompanyId: string;
  chargingBasis: DeliveryChargingBasis;
  amount: string;
  currency: string;
  active: boolean;
  effectiveFrom: string;
  effectiveTo: string;
};

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500";
const labelClass = "block text-xs font-medium text-slate-600";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readActiveCompanies(response: unknown): DeliveryCompanyOption[] {
  if (!isRecord(response) || !isRecord(response.data) || !Array.isArray(response.data.companies)) {
    throw new Error("Shipping service returned an invalid Delivery Company list.");
  }
  return response.data.companies.map((item): DeliveryCompanyOption => {
    if (
      !isRecord(item)
      || typeof item.id !== "string"
      || typeof item.code !== "string"
      || typeof item.name !== "string"
      || item.status !== "ACTIVE"
    ) {
      throw new Error("Shipping service returned an invalid Delivery Company.");
    }
    return { id: item.id, code: item.code, name: item.name, status: "ACTIVE" };
  });
}

function toDateInput(value: string | null): string {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

function dateInputToStart(value: string): string {
  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

function dateInputToEnd(value: string): string | null {
  return value ? new Date(`${value}T23:59:59.999Z`).toISOString() : null;
}

function emptyDraft(companyId = ""): FeeDraft {
  return {
    deliveryCompanyId: companyId,
    chargingBasis: "PER_ORDER",
    amount: "",
    currency: "MMK",
    active: true,
    effectiveFrom: new Date().toISOString().slice(0, 10),
    effectiveTo: "",
  };
}

const SellerDeliveryCompanyFeesPage = () => {
  const authUser = useAppSelector(selectAuthUser);
  const activeShopId = authUser?.active_shop_id?.trim() ?? "";
  const activeShopName = authUser?.active_shop_name?.trim() || "Your shop";
  const [companies, setCompanies] = useState<DeliveryCompanyOption[]>([]);
  const [feeRules, setFeeRules] = useState<SellerDeliveryCompanyFee[]>([]);
  const [loadStatus, setLoadStatus] = useState<"loading" | "succeeded" | "failed">("loading");
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [editingRule, setEditingRule] = useState<SellerDeliveryCompanyFee | null>(null);
  const [draft, setDraft] = useState<FeeDraft>(emptyDraft());
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savingStatusId, setSavingStatusId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadStatus("loading");
      setLoadError("");
      setActionError("");
      if (!activeShopId) {
        setLoadError("Your login does not include an active shop. Sign in again or contact an administrator.");
        setLoadStatus("failed");
        return;
      }

      try {
        const [companyResponse, rules] = await Promise.all([
          shippingApi.listActiveDeliveryCompanies(),
          sellerDeliveryCompanyFeeApi.list(),
        ]);
        if (cancelled) return;
        setCompanies(readActiveCompanies(companyResponse.data));
        setFeeRules(rules);
        setLoadStatus("succeeded");
      } catch (error: unknown) {
        if (cancelled) return;
        setLoadError(getSellerDeliveryCompanyFeeApiErrorMessage(error, "Could not load delivery expense settings."));
        setLoadStatus("failed");
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [activeShopId, reloadKey]);

  const shopRules = useMemo(
    () => feeRules.filter((rule) => rule.shopId === activeShopId),
    [activeShopId, feeRules],
  );
  const companyById = useMemo(
    () => new Map(companies.map((company) => [company.id, company])),
    [companies],
  );
  const availableCompanies = useMemo(() => {
    const configuredIds = new Set(
      shopRules.map((rule) => rule.deliveryCompanyId).filter((id): id is string => Boolean(id)),
    );
    return companies.filter((company) => !configuredIds.has(company.id));
  }, [companies, shopRules]);

  const startCreate = () => {
    setEditingRule(null);
    setDraft(emptyDraft(availableCompanies[0]?.id ?? ""));
    setFormError("");
    setActionError("");
  };

  const startEdit = (rule: SellerDeliveryCompanyFee) => {
    if (!rule.deliveryCompanyId) return;
    setEditingRule(rule);
    setDraft({
      deliveryCompanyId: rule.deliveryCompanyId,
      chargingBasis: rule.chargingBasis,
      amount: String(rule.amount),
      currency: rule.currency,
      active: rule.active,
      effectiveFrom: toDateInput(rule.effectiveFrom),
      effectiveTo: toDateInput(rule.effectiveTo),
    });
    setFormError("");
    setActionError("");
  };

  const cancelForm = () => {
    setEditingRule(null);
    setDraft(emptyDraft());
    setFormError("");
  };

  const saveRule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    const amount = Number(draft.amount);
    const currency = draft.currency.trim().toUpperCase();
    if (!activeShopId) {
      setFormError("Your login does not include an active shop. Sign in again or contact an administrator.");
      return;
    }
    if (!draft.deliveryCompanyId) {
      setFormError("Select an active Delivery Company.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0 || amount > 99_999_999.99) {
      setFormError("Enter a fee greater than 0 and no more than 99,999,999.99.");
      return;
    }
    if (!/^[A-Z]{3}$/.test(currency)) {
      setFormError("Enter a valid three-letter currency code.");
      return;
    }
    if (!draft.effectiveFrom || (draft.effectiveTo && draft.effectiveTo < draft.effectiveFrom)) {
      setFormError("The effective end date must be on or after the start date.");
      return;
    }

    let payload: SellerDeliveryCompanyFeePayload;
    try {
      payload = {
        shopId: activeShopId,
        deliveryCompanyId: draft.deliveryCompanyId,
        chargingBasis: draft.chargingBasis,
        amount: String(amount),
        currency,
        active: draft.active,
        effectiveFrom: dateInputToStart(draft.effectiveFrom),
        effectiveTo: dateInputToEnd(draft.effectiveTo),
      };
    } catch {
      setFormError("Enter valid effective dates.");
      return;
    }

    setIsSubmitting(true);
    setActionError("");
    try {
      if (editingRule) {
        await sellerDeliveryCompanyFeeApi.update(editingRule.id, payload);
      } else {
        await sellerDeliveryCompanyFeeApi.create(payload);
      }
      cancelForm();
      setReloadKey((value) => value + 1);
    } catch (error: unknown) {
      setFormError(
        getSellerDeliveryCompanyFeeApiErrorMessage(error, "Could not save the delivery expense configuration."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRuleStatus = async (rule: SellerDeliveryCompanyFee) => {
    setSavingStatusId(rule.id);
    setActionError("");
    try {
      await sellerDeliveryCompanyFeeApi.setActive(rule.id, !rule.active);
      setReloadKey((value) => value + 1);
    } catch (error: unknown) {
      setActionError(
        getSellerDeliveryCompanyFeeApiErrorMessage(error, "Could not update the configuration status."),
      );
    } finally {
      setSavingStatusId(null);
    }
  };

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500" aria-label="Breadcrumb">
        <Link to="/seller/overview" className="hover:text-slate-700">Dashboard</Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Delivery Expense Fees</span>
      </nav>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Delivery Expense Fees</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            Configure what your shop records as delivery provider expense for each Delivery Company.
            This does not change the shipping fee charged to customers at checkout.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setReloadKey((value) => value + 1)}
          className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw size={15} className={loadStatus === "loading" ? "animate-spin" : ""} />
          Refresh
        </button>
      </header>

      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        These settings are shop-specific. <strong>Per order</strong> records an expense per order;
        <strong> per Collect COD batch</strong> records once for the selected orders in one shop/provider pickup batch.
      </div>

      {loadStatus === "loading" && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
          Loading your shops and Delivery Company settings…
        </div>
      )}
      {loadStatus === "failed" && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          {loadError}
        </div>
      )}
      {loadStatus === "succeeded" && activeShopId && (
        <>
          {actionError && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {actionError}
            </div>
          )}
          {availableCompanies.length > 0 && (
            <div className="flex justify-end">
                <button
                  type="button"
                  onClick={startCreate}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  <Plus size={16} />
                  Add Delivery Company
                </button>
            </div>
          )}

          {(editingRule || draft.deliveryCompanyId || availableCompanies.length > 0) && draft.deliveryCompanyId && (
            <form onSubmit={saveRule} className="space-y-4 rounded-xl border border-emerald-200 bg-white p-5">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {editingRule ? "Edit delivery expense" : "Configure a Delivery Company"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Applied only to {activeShopName}.
                </p>
              </div>
              {formError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{formError}</p>}

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label htmlFor="fee-delivery-company" className={labelClass}>Delivery Company</label>
                  {editingRule ? (
                    <input
                      id="fee-delivery-company"
                      value={companyById.get(draft.deliveryCompanyId)?.name ?? draft.deliveryCompanyId}
                      className={inputClass}
                      disabled
                    />
                  ) : (
                    <select
                      id="fee-delivery-company"
                      value={draft.deliveryCompanyId}
                      onChange={(event) => setDraft((value) => ({ ...value, deliveryCompanyId: event.target.value }))}
                      className={inputClass}
                      required
                    >
                      {availableCompanies.map((company) => (
                        <option key={company.id} value={company.id}>{company.name} ({company.code})</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label htmlFor="fee-charging-basis" className={labelClass}>Fee basis</label>
                  <select
                    id="fee-charging-basis"
                    value={draft.chargingBasis}
                    onChange={(event) => {
                      const basis = event.target.value;
                      if (basis === "PER_ORDER" || basis === "PER_INVOICE") {
                        setDraft((value) => ({ ...value, chargingBasis: basis }));
                      }
                    }}
                    className={inputClass}
                  >
                    <option value="PER_ORDER">Per order</option>
                    <option value="PER_INVOICE">Per Collect COD batch</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="fee-amount" className={labelClass}>Provider delivery expense</label>
                  <input
                    id="fee-amount"
                    type="number"
                    min="0.01"
                    max="99999999.99"
                    step="0.01"
                    value={draft.amount}
                    onChange={(event) => setDraft((value) => ({ ...value, amount: event.target.value }))}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="fee-currency" className={labelClass}>Currency</label>
                  <input
                    id="fee-currency"
                    value={draft.currency}
                    maxLength={3}
                    onChange={(event) => setDraft((value) => ({ ...value, currency: event.target.value }))}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="fee-effective-from" className={labelClass}>Effective from</label>
                  <input
                    id="fee-effective-from"
                    type="date"
                    value={draft.effectiveFrom}
                    onChange={(event) => setDraft((value) => ({ ...value, effectiveFrom: event.target.value }))}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="fee-effective-to" className={labelClass}>Effective until (optional)</label>
                  <input
                    id="fee-effective-to"
                    type="date"
                    value={draft.effectiveTo}
                    onChange={(event) => setDraft((value) => ({ ...value, effectiveTo: event.target.value }))}
                    className={inputClass}
                  />
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={draft.active}
                  onChange={(event) => setDraft((value) => ({ ...value, active: event.target.checked }))}
                />
                Active configuration
              </label>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={cancelForm} className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                  {isSubmitting ? "Saving…" : "Save configuration"}
                </button>
              </div>
            </form>
          )}

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Delivery Company</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Provider expense</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Basis</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Effective period</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shopRules.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">
                        No delivery expense configurations for this shop yet.
                      </td>
                    </tr>
                  ) : shopRules.map((rule) => {
                    const company = rule.deliveryCompanyId ? companyById.get(rule.deliveryCompanyId) : undefined;
                    return (
                      <tr key={rule.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-slate-900">{company?.name ?? "Unavailable company"}</p>
                          <p className="text-xs text-slate-500">{company?.code ?? rule.deliveryCompanyId ?? "Unlinked"}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-800">{rule.amount} {rule.currency}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {rule.chargingBasis === "PER_ORDER" ? "Per order" : "Per Collect COD batch"}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {rule.effectiveFrom ? new Date(rule.effectiveFrom).toLocaleDateString() : "—"}
                          {" – "}
                          {rule.effectiveTo ? new Date(rule.effectiveTo).toLocaleDateString() : "No end date"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${rule.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                            {rule.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(rule)}
                              disabled={!company}
                              className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Pencil size={13} />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => void toggleRuleStatus(rule)}
                              disabled={savingStatusId === rule.id || !rule.deliveryCompanyId}
                              className="cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {savingStatusId === rule.id ? "Saving…" : rule.active ? "Deactivate" : "Activate"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SellerDeliveryCompanyFeesPage;

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Building2, Eye, RefreshCw, Save } from "lucide-react";
import { useAppSelector } from "@/app/hooks";
import { selectAuthUser } from "@/features/auth/store/authSelectors";
import { useGlobalModal } from "@/components/ui/GlobalModalProvider";
import {
  adminShippingApi,
  type DeliveryPricingRuleDto,
} from "@/features/admin/api/adminShippingApi";
import { shippingApi } from "@/features/shipping/api/shippingApi";

type DeliveryCompanyOption = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  status: "ACTIVE";
};

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
    return {
      id: item.id,
      code: item.code,
      name: item.name,
      description: typeof item.description === "string" ? item.description : null,
      logoUrl: typeof item.logoUrl === "string" ? item.logoUrl : null,
      status: "ACTIVE",
    };
  });
}

function readSelectedIds(response: unknown): string[] {
  if (!isRecord(response) || !isRecord(response.data)) {
    throw new Error("Shipping service returned an invalid shop Delivery Company selection.");
  }
  const ids = response.data.deliveryCompanyIds;
  if (!Array.isArray(ids)) {
    throw new Error("Shipping service returned an invalid shop Delivery Company selection.");
  }
  return ids.filter((id): id is string => typeof id === "string" && id.trim().length > 0);
}

function formatMoney(value: number, currency: string): string {
  return `${new Intl.NumberFormat("en-US").format(value)} ${currency}`;
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

type CompanyPricingDetailProps = {
  company: DeliveryCompanyOption;
};

const CompanyPricingDetail = ({ company }: CompanyPricingDetailProps) => {
  const [status, setStatus] = useState<"loading" | "succeeded" | "failed">("loading");
  const [error, setError] = useState("");
  const [rules, setRules] = useState<DeliveryPricingRuleDto[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setStatus("loading");
      setError("");
      try {
        const rulesRes = await adminShippingApi.listPricingRules({
          deliveryCompanyId: company.id,
          status: "ACTIVE",
          page: 1,
          pageSize: 20,
        });
        if (cancelled) return;
        setRules(rulesRes.data.data.rules ?? []);
        setStatus("succeeded");
      } catch (loadError: unknown) {
        if (cancelled) return;
        setError(adminShippingApi.getApiErrorMessage(loadError, "Could not load delivery pricing."));
        setStatus("failed");
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [company.id]);

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        {company.logoUrl ? (
          <img
            src={company.logoUrl}
            alt=""
            className="h-14 w-14 rounded-lg border border-slate-200 bg-slate-50 object-contain"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
            <Building2 size={22} />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-base font-semibold text-slate-900">{company.name}</p>
          <p className="mt-0.5 text-xs text-slate-500">{company.code}</p>
          {company.description ? (
            <p className="mt-1 text-sm text-slate-600">{company.description}</p>
          ) : null}
        </div>
      </div>

      {status === "loading" && (
        <p className="text-sm text-slate-600">Loading delivery pricing…</p>
      )}
      {status === "failed" && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}
      {status === "succeeded" && (
        <section>
          <h3 className="text-sm font-semibold text-slate-900">Delivery pricing</h3>
          {rules.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No active pricing rule for this company yet.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{rule.name}</p>
                      <p className="text-xs text-slate-500">
                        {rule.serviceType} · v{rule.version} · {rule.currency}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                      {rule.status}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div>
                      <p className="text-xs font-medium text-slate-500">Minimum fee</p>
                      <p className="mt-0.5 text-sm text-slate-900">
                        {formatMoney(rule.minimumFee, rule.currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Maximum fee</p>
                      <p className="mt-0.5 text-sm text-slate-900">
                        {formatMoney(rule.maximumFee, rule.currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Effective from</p>
                      <p className="mt-0.5 text-sm text-slate-900">{formatDate(rule.effectiveFrom)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Effective until</p>
                      <p className="mt-0.5 text-sm text-slate-900">
                        {rule.effectiveUntil ? formatDate(rule.effectiveUntil) : "Open"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
                    <p className="text-xs font-semibold text-slate-900">Base weight fees</p>
                    {rule.weightRate ? (
                      <div className="mt-2 space-y-1.5 text-sm text-slate-700">
                        <p>
                          {rule.weightRate.baseWeightKg} kg →{" "}
                          <span className="font-medium text-slate-900">
                            {formatMoney(rule.weightRate.baseFee, rule.currency)}
                          </span>
                        </p>
                        <p>
                          +{rule.weightRate.additionalWeightKg} kg →{" "}
                          <span className="font-medium text-slate-900">
                            {formatMoney(rule.weightRate.additionalFee, rule.currency)}
                          </span>
                        </p>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-slate-500">No weight rate configured.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

const SellerDeliveryCompaniesPage = () => {
  const authUser = useAppSelector(selectAuthUser);
  const { openModal } = useGlobalModal();
  const activeShopId = authUser?.active_shop_id?.trim() ?? "";
  const activeShopName = authUser?.active_shop_name?.trim() || "Your shop";

  const [catalog, setCatalog] = useState<DeliveryCompanyOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loadStatus, setLoadStatus] = useState<"loading" | "succeeded" | "failed">("loading");
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadStatus("loading");
      setLoadError("");
      setFormError("");
      setSaveSuccess("");
      if (!activeShopId) {
        setLoadError("Your login does not include an active shop. Sign in again or contact an administrator.");
        setLoadStatus("failed");
        return;
      }

      try {
        const [catalogResponse, selectionResponse] = await Promise.all([
          shippingApi.listActiveDeliveryCompanies(),
          shippingApi.getShopDeliveryCompanies(activeShopId),
        ]);
        if (cancelled) return;
        setCatalog(readActiveCompanies(catalogResponse.data));
        setSelectedIds(readSelectedIds(selectionResponse.data));
        setLoadStatus("succeeded");
      } catch (error: unknown) {
        if (cancelled) return;
        setLoadError(adminShippingApi.getApiErrorMessage(error, "Could not load Delivery Company settings."));
        setLoadStatus("failed");
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [activeShopId, reloadKey]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const clearMessages = () => {
    setSaveSuccess("");
    setFormError("");
  };

  const toggleCompany = (companyId: string) => {
    clearMessages();
    setSelectedIds((current) =>
      current.includes(companyId)
        ? current.filter((id) => id !== companyId)
        : [...current, companyId],
    );
  };

  const selectAll = () => {
    clearMessages();
    setSelectedIds(catalog.map((company) => company.id));
  };

  const clearAll = () => {
    clearMessages();
    setSelectedIds([]);
  };

  const openCompanyDetail = (company: DeliveryCompanyOption) => {
    openModal({
      title: "Delivery Company details",
      size: "xl",
      hidePrimary: true,
      secondaryLabel: "Close",
      content: <CompanyPricingDetail company={company} />,
    });
  };

  const saveSelection = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setSaveSuccess("");
    if (!activeShopId) {
      setFormError("Your login does not include an active shop. Sign in again or contact an administrator.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await shippingApi.replaceShopDeliveryCompanies(activeShopId, selectedIds);
      setSelectedIds(readSelectedIds(response.data));
      setSaveSuccess(
        selectedIds.length === 0
          ? "Saved. Customers will not see any Delivery Company for this shop until you select at least one."
          : `Saved. Customers can choose from ${selectedIds.length} Delivery Compan${selectedIds.length === 1 ? "y" : "ies"} at checkout.`,
      );
    } catch (error: unknown) {
      setFormError(adminShippingApi.getApiErrorMessage(error, "Could not save Delivery Company selection."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500" aria-label="Breadcrumb">
        <Link to="/seller/overview" className="hover:text-slate-700">Dashboard</Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Delivery Companies</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Delivery Companies</h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Choose which Delivery Companies customers can pick for{" "}
            <span className="font-medium text-slate-800">{activeShopName}</span> at checkout.
            Click a company to view name, base weight fees, and delivery pricing.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setReloadKey((value) => value + 1)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          <RefreshCw size={16} className={loadStatus === "loading" ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        Only companies you enable here appear on the checkout Delivery Method list for this shop.
        Pricing is managed by the platform admin.
      </div>

      {loadStatus === "failed" && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          {loadError}
        </div>
      )}

      {(loadStatus === "loading" || loadStatus === "succeeded") && activeShopId && (
        <form onSubmit={saveSelection} className="space-y-4">
          {formError && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {formError}
            </div>
          )}
          {saveSuccess && (
            <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              {saveSuccess}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              {selectedIds.length} of {catalog.length} enabled for checkout
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={selectAll}
                disabled={catalog.length === 0 || loadStatus === "loading"}
                className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={clearAll}
                disabled={selectedIds.length === 0 || loadStatus === "loading"}
                className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Clear all
              </button>
              <button
                type="submit"
                disabled={isSubmitting || loadStatus === "loading"}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={16} />
                {isSubmitting ? "Saving…" : "Save selection"}
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="w-12 px-4 py-3 text-left text-xs font-medium text-slate-600">
                      <span className="sr-only">Enable</span>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Company</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Code</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Checkout</th>
                    <th className="w-28 px-4 py-3 text-right text-xs font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadStatus === "loading" && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                        Loading delivery companies...
                      </td>
                    </tr>
                  )}
                  {loadStatus === "succeeded" && catalog.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                          <Building2 size={22} />
                        </div>
                        <p className="mt-3 text-sm font-medium text-slate-700">No delivery companies yet</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Ask a platform admin to create an active Delivery Company first.
                        </p>
                      </td>
                    </tr>
                  )}
                  {loadStatus === "succeeded" &&
                    catalog.map((company) => {
                      const checked = selectedSet.has(company.id);
                      return (
                        <tr
                          key={company.id}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer"
                          onClick={() => openCompanyDetail(company)}
                        >
                          <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleCompany(company.id)}
                              aria-label={`Enable ${company.name} for checkout`}
                              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {company.logoUrl ? (
                                <img
                                  src={company.logoUrl}
                                  alt=""
                                  className="h-10 w-10 rounded-lg border border-slate-200 bg-slate-50 object-contain"
                                />
                              ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                                  <Building2 size={18} />
                                </div>
                              )}
                              <div>
                                <p className="text-xs font-semibold text-slate-900">{company.name}</p>
                                {company.description ? (
                                  <p className="text-xs text-slate-500 line-clamp-1">{company.description}</p>
                                ) : null}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-700">{company.code}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                checked
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {checked ? "Enabled" : "Disabled"}
                            </span>
                          </td>
                          <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => openCompanyDetail(company)}
                                className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                              >
                                <Eye size={13} />
                                View
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
        </form>
      )}
    </div>
  );
};

export default SellerDeliveryCompaniesPage;

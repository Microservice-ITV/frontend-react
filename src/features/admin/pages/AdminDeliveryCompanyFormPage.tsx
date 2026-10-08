import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, X } from "lucide-react";
import {
  adminShippingApi,
  type DeliveryProviderOption,
} from "../api/adminShippingApi";

type AdminDeliveryCompanyFormPageProps = {
  mode: "create" | "edit";
};

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500";
const labelClass = "block text-xs font-medium text-slate-600";
const sectionClass = "rounded-xl border border-slate-200 bg-white p-5 sm:p-6";

const MAX_LOGO_BYTES = 5 * 1024 * 1024;

function fileToLogoDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please choose an image file."));
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      reject(new Error("Image must be 5MB or smaller."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the image."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not read the image."));
      img.onload = () => {
        const maxSide = 256;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Could not read the image."));
          return;
        }
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

const AdminDeliveryCompanyFormPage = ({ mode }: AdminDeliveryCompanyFormPageProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(mode === "edit");
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [providerId, setProviderId] = useState("");
  const [providers, setProviders] = useState<DeliveryProviderOption[]>([]);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [providersError, setProvidersError] = useState("");
  const [description, setDescription] = useState("");
  const [savedLogoUrl, setSavedLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadProviders = async () => {
      setProvidersLoading(true);
      setProvidersError("");
      try {
        const rows = await adminShippingApi.listDeliveryProviders();
        if (!cancelled) setProviders(rows);
      } catch (error: unknown) {
        if (!cancelled) {
          setProvidersError(adminShippingApi.getApiErrorMessage(error, "Could not load Delivery Service providers."));
        }
      } finally {
        if (!cancelled) setProvidersLoading(false);
      }
    };
    void loadProviders();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreview(null);
      return;
    }
    const previewUrl = URL.createObjectURL(logoFile);
    setLogoPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [logoFile]);

  useEffect(() => {
    if (mode !== "edit" || !id) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const res = await adminShippingApi.getDeliveryCompany(id);
        const company = res.data?.data;
        if (!company) {
          if (!cancelled) setLoadError("Delivery company not found.");
          return;
        }
        if (cancelled) return;
        setCode(company.code);
        setName(company.name);
        setProviderId(company.providerId ?? "");
        setDescription(company.description ?? "");
        setSavedLogoUrl(company.logoUrl);
      } catch (error: unknown) {
        if (!cancelled) {
          setLoadError(adminShippingApi.getApiErrorMessage(error, "Failed to load delivery company."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [mode, id]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitError("");
    if (!code.trim() || !name.trim()) {
      setSubmitError("Code and name are required.");
      return;
    }
    if (!providerId || !providers.some((provider) => provider.id === providerId && provider.active)) {
      setSubmitError("Select an active Delivery Service provider.");
      return;
    }

    setIsSubmitting(true);
    try {
      let logoUrl: string | null | undefined;
      if (logoFile) {
        logoUrl = await fileToLogoDataUrl(logoFile);
      } else if (removeLogo) {
        logoUrl = null;
      }

      const payload = {
        code: code.trim(),
        name: name.trim(),
        providerId,
        description: description.trim() || null,
        ...(logoUrl !== undefined ? { logoUrl } : {}),
      };
      if (mode === "edit") {
        if (!id) {
          setSubmitError("Invalid delivery company id.");
          return;
        }
        await adminShippingApi.updateDeliveryCompany(id, payload);
      } else {
        await adminShippingApi.createDeliveryCompany(payload);
      }
      navigate("/super-admin/shipping/delivery-companies");
    } catch (error: unknown) {
      setSubmitError(
        error instanceof Error && !(error as { response?: unknown }).response
          ? error.message
          : adminShippingApi.getApiErrorMessage(error, "Could not save delivery company."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentLogo = logoPreview ?? (removeLogo ? null : savedLogoUrl);

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to="/super-admin/overview" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <Link to="/super-admin/shipping/delivery-companies" className="hover:text-slate-700">
          Delivery Companies
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">{mode === "create" ? "New company" : "Edit company"}</span>
      </nav>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading delivery company...
        </div>
      )}

      {!loading && loadError && (
        <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-700">{loadError}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="cursor-pointer rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              Retry
            </button>
            <Link
              to="/super-admin/shipping/delivery-companies"
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Back to list
            </Link>
          </div>
        </div>
      )}

      {!loading && !loadError && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <button
                type="button"
                onClick={() => navigate("/super-admin/shipping/delivery-companies")}
                className="mb-2 inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800"
              >
                <ArrowLeft size={14} />
                Back to companies
              </button>
              <h1 className="text-xl font-bold text-slate-900">
                {mode === "create" ? "New delivery company" : "Edit delivery company"}
              </h1>
              <p className="mt-0.5 text-sm text-slate-600">
                Code and name identify the company. Existing quotes keep the name used when they were created.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => navigate("/super-admin/shipping/delivery-companies")}
                className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Saving…" : mode === "create" ? "Create company" : "Save changes"}
              </button>
            </div>
          </div>

          {submitError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{submitError}</p>
          )}

          <section className={sectionClass}>
            <h2 className="text-sm font-semibold text-slate-900">Company details</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              The logo is shown on checkout when a customer chooses this company.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="company-code" className={labelClass}>Code</label>
                <input id="company-code" value={code} onChange={(e) => setCode(e.target.value)} className={inputClass} placeholder="DNI" required />
              </div>
              <div>
                <label htmlFor="company-name" className={labelClass}>Name</label>
                <input id="company-name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="DNI Express" required />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="company-provider" className={labelClass}>Delivery Service provider</label>
                <select
                  id="company-provider"
                  value={providerId}
                  onChange={(event) => setProviderId(event.target.value)}
                  className={inputClass}
                  required
                  disabled={providersLoading || Boolean(providersError)}
                >
                  <option value="" disabled>
                    {providersLoading ? "Loading providers..." : "Select provider"}
                  </option>
                  {providers.map((provider) => (
                    <option key={provider.id} value={provider.id} disabled={!provider.active}>
                      {provider.name} ({provider.code}){provider.active ? "" : " — inactive"}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  Provider identity is owned by Delivery Service and is used for shipment expense attribution.
                </p>
                {providersError && <p role="alert" className="mt-1 text-xs text-red-700">{providersError}</p>}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="company-description" className={labelClass}>Description</label>
                <textarea id="company-description" value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} rows={3} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="company-logo" className={labelClass}>Logo</label>
                <input
                  id="company-logo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setLogoFile(file);
                    setRemoveLogo(false);
                    event.currentTarget.value = "";
                  }}
                  className="mt-1 w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500"
                />
                <p className="mt-1 text-xs text-slate-500">PNG, JPG, WEBP, or GIF. Max 5MB.</p>
                {currentLogo && (
                  <div className="relative mt-3 inline-block">
                    <img
                      src={currentLogo}
                      alt="Delivery company logo"
                      className="h-20 w-20 rounded-lg border border-slate-200 bg-slate-50 object-contain"
                    />
                    <button
                      type="button"
                      aria-label="Remove logo"
                      onClick={() => {
                        setLogoFile(null);
                        setRemoveLogo(true);
                      }}
                      className="absolute -right-2 -top-2 cursor-pointer rounded-full bg-slate-900 p-1 text-white"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>
        </form>
      )}
    </div>
  );
};

export default AdminDeliveryCompanyFormPage;

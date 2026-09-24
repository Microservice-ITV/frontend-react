import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { adminShippingApi, type AdminDeliveryCityRateDto } from "../api/adminShippingApi";
import { loadAllCities, type CityOptionWithState } from "../api/locationOptions";
import CitySelectField from "../components/CitySelectField";

type AdminCityRateFormPageProps = {
  mode: "create" | "edit";
};

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-50";
const labelClass = "block text-xs font-medium text-slate-600";
const sectionClass = "rounded-xl border border-slate-200 bg-white p-5 sm:p-6";

const toDateTimeLocal = (value: string | null | undefined): string => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(
    parsed.getHours(),
  )}:${pad(parsed.getMinutes())}`;
};

const AdminCityRateFormPage = ({ mode }: AdminCityRateFormPageProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [cities, setCities] = useState<CityOptionWithState[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(true);

  const [loading, setLoading] = useState(mode === "edit");
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [fromCityId, setFromCityId] = useState("");
  const [toCityId, setToCityId] = useState("");
  const [amount, setAmount] = useState("1000");
  const [currency, setCurrency] = useState("MMK");
  const [effectiveFrom, setEffectiveFrom] = useState(toDateTimeLocal(new Date().toISOString()));
  const [effectiveUntil, setEffectiveUntil] = useState("");

  useEffect(() => {
    void loadAllCities()
      .then(setCities)
      .catch(() => setCities([]))
      .finally(() => setCitiesLoading(false));
  }, []);

  useEffect(() => {
    if (mode !== "edit" || !id) return;

    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const res = await adminShippingApi.getDeliveryCityRate(id);
        const rate: AdminDeliveryCityRateDto | undefined = res.data?.data;
        if (!rate) {
          if (!cancelled) setLoadError("Route rate not found.");
          return;
        }
        if (cancelled) return;
        setFromCityId(rate.fromCityId);
        setToCityId(rate.toCityId);
        setAmount(String(rate.amount));
        setCurrency(rate.currency);
        setEffectiveFrom(toDateTimeLocal(rate.effectiveFrom));
        setEffectiveUntil(toDateTimeLocal(rate.effectiveUntil));
      } catch (error: unknown) {
        if (!cancelled) {
          setLoadError(adminShippingApi.getApiErrorMessage(error, "Failed to load route rate."));
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

  const validate = (): string | null => {
    if (!fromCityId) return "From city is required.";
    if (!toCityId) return "To city is required.";
    if (fromCityId === toCityId) return "From and to cities must be different.";
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return "Amount must be greater than zero.";
    }
    if (currency.trim().length !== 3) return "Currency must be a 3-letter code (e.g. MMK).";
    if (!effectiveFrom) return "Effective from date is required.";
    if (effectiveUntil && new Date(effectiveUntil) <= new Date(effectiveFrom)) {
      return "Effective until must be after effective from.";
    }
    return null;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitError("");

    const validationError = validate();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        amount: Number(amount),
        currency: currency.trim().toUpperCase(),
        effectiveFrom: new Date(effectiveFrom).toISOString(),
        effectiveUntil: effectiveUntil ? new Date(effectiveUntil).toISOString() : null,
      };
      if (mode === "edit") {
        if (!id) {
          setSubmitError("Invalid route rate id.");
          return;
        }
        await adminShippingApi.updateDeliveryCityRate(id, payload);
      } else {
        await adminShippingApi.createDeliveryCityRate({
          ...payload,
          fromCityId,
          toCityId,
        });
      }
      navigate("/super-admin/shipping/city-rates");
    } catch (error: unknown) {
      setSubmitError(adminShippingApi.getApiErrorMessage(error, "Could not save route rate."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to="/super-admin/overview" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <Link to="/super-admin/shipping/city-rates" className="hover:text-slate-700">
          Route Rates
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">
          {mode === "create" ? "New route rate" : "Edit route rate"}
        </span>
      </nav>

      {citiesLoading && mode === "create" && (
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          Loading cities...
        </div>
      )}

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading route rate...
        </div>
      )}

      {!loading && loadError && (
        <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-700">{loadError}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 cursor-pointer"
            >
              Retry
            </button>
            <Link
              to="/super-admin/shipping/city-rates"
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Back to list
            </Link>
          </div>
        </div>
      )}

      {!loading && !loadError && !citiesLoading && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <button
                type="button"
                onClick={() => navigate("/super-admin/shipping/city-rates")}
                className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <ArrowLeft size={14} />
                Back to route rates
              </button>
              <h1 className="text-xl font-bold text-slate-900">
                {mode === "create" ? "New route rate" : "Edit route rate"}
              </h1>
              <p className="mt-0.5 text-sm text-slate-600">
                Flat delivery fee charged between a from-city and a to-city.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => navigate("/super-admin/shipping/city-rates")}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? "Saving…" : mode === "create" ? "Create route rate" : "Save changes"}
              </button>
            </div>
          </div>

          {submitError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {submitError}
            </p>
          )}

          <section className={sectionClass}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <CitySelectField
                id="city-rate-from"
                label="From city"
                value={fromCityId}
                cities={cities}
                onChange={setFromCityId}
                disabled={mode === "edit"}
                placeholder="Select from city"
              />
              <CitySelectField
                id="city-rate-to"
                label="To city"
                value={toCityId}
                cities={cities}
                onChange={setToCityId}
                disabled={mode === "edit"}
                placeholder="Select to city"
              />
              {mode === "edit" && (
                <p className="text-xs text-slate-400 sm:col-span-2">
                  From and to cities cannot be changed after creation.
                </p>
              )}

              <div>
                <label htmlFor="city-rate-amount" className={labelClass}>
                  Amount ({currency || "MMK"})
                </label>
                <input
                  id="city-rate-amount"
                  type="number"
                  min={0}
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label htmlFor="city-rate-currency" className={labelClass}>
                  Currency
                </label>
                <input
                  id="city-rate-currency"
                  type="text"
                  maxLength={3}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                  className={inputClass}
                  placeholder="MMK"
                  required
                />
              </div>

              <div>
                <label htmlFor="city-rate-effective-from" className={labelClass}>
                  Effective from
                </label>
                <input
                  id="city-rate-effective-from"
                  type="datetime-local"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label htmlFor="city-rate-effective-until" className={labelClass}>
                  Effective until
                </label>
                <input
                  id="city-rate-effective-until"
                  type="datetime-local"
                  value={effectiveUntil}
                  onChange={(e) => setEffectiveUntil(e.target.value)}
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-slate-400">
                  Leave blank to keep this rate valid indefinitely.
                </p>
              </div>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate("/super-admin/shipping/city-rates")}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? "Saving…" : mode === "create" ? "Create route rate" : "Save changes"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminCityRateFormPage;
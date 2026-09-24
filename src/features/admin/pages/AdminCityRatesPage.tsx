import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { useGlobalModal } from "@/components/ui/GlobalModalProvider";
import DataTablePagination from "@/components/ui/DataTablePagination";
import RowActionMenu from "@/components/ui/RowActionMenu";
import { Plus, RefreshCw, Pencil, Trash2, Route, Ban, CheckCircle2, Search } from "lucide-react";
import type {
  AdminDeliveryCityRateDto,
  DeliveryCityRateStatus,
} from "../api/adminShippingApi";
import { adminShippingApi } from "../api/adminShippingApi";
import { loadAllCities, type CityOptionWithState } from "../api/locationOptions";
import {
  deleteAdminDeliveryCityRate,
  fetchAdminDeliveryCityRates,
} from "../store/adminDeliveryCityRatesThunks";
import {
  selectAdminDeliveryCityRates,
  selectAdminDeliveryCityRatesError,
  selectAdminDeliveryCityRatesMutationError,
  selectAdminDeliveryCityRatesStatus,
  selectAdminDeliveryCityRatesTotal,
} from "../store/adminDeliveryCityRatesSelectors";

const formatDate = (value: string | null): string => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatMoney = (value: number, currency: string): string =>
  `${new Intl.NumberFormat("en-US").format(value)} ${currency}`;

const statusBadgeClass = (status: DeliveryCityRateStatus): string =>
  status === "ACTIVE"
    ? "inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
    : "inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600";

const AdminCityRatesPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { openModal } = useGlobalModal();
  const rates = useAppSelector(selectAdminDeliveryCityRates);
  const total = useAppSelector(selectAdminDeliveryCityRatesTotal);
  const status = useAppSelector(selectAdminDeliveryCityRatesStatus);
  const error = useAppSelector(selectAdminDeliveryCityRatesError);
  const mutationError = useAppSelector(selectAdminDeliveryCityRatesMutationError);
  const [cities, setCities] = useState<CityOptionWithState[]>([]);
  const [fromCityFilter, setFromCityFilter] = useState("");
  const [toCityFilter, setToCityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | DeliveryCityRateStatus>("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    void loadAllCities().then(setCities).catch(() => setCities([]));
  }, []);

  useEffect(() => {
    dispatch(
      fetchAdminDeliveryCityRates({
        page,
        pageSize: rowsPerPage,
        fromCityId: fromCityFilter || undefined,
        toCityId: toCityFilter || undefined,
        status: statusFilter || undefined,
      }),
    );
  }, [dispatch, page, rowsPerPage, fromCityFilter, toCityFilter, statusFilter]);

  const cityName = (cityId: string): string =>
    cities.find((city) => city.id === cityId)?.name ?? cityId;

  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));

  const refresh = () => {
    dispatch(
      fetchAdminDeliveryCityRates({
        page,
        pageSize: rowsPerPage,
        fromCityId: fromCityFilter || undefined,
        toCityId: toCityFilter || undefined,
        status: statusFilter || undefined,
      }),
    );
  };

  const toggleStatus = async (rate: AdminDeliveryCityRateDto) => {
    const next: DeliveryCityRateStatus = rate.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await adminShippingApi.updateDeliveryCityRateStatus(rate.id, next);
      refresh();
    } catch (updateError: unknown) {
      openModal({
        title: "Could not update status",
        content: (
          <p className="text-sm text-slate-600">
            {adminShippingApi.getApiErrorMessage(updateError, "Please try again.")}
          </p>
        ),
        primaryLabel: "Close",
      });
    }
  };

  const confirmDelete = (rate: AdminDeliveryCityRateDto) => {
    openModal({
      title: "Delete this route rate?",
      content: (
        <p>
          This permanently removes the route rate for {cityName(rate.fromCityId)} →{" "}
          {cityName(rate.toCityId)} ({formatMoney(rate.amount, rate.currency)}).
        </p>
      ),
      primaryLabel: "Delete",
      primaryVariant: "danger",
      secondaryLabel: "Cancel",
      onPrimary: async () => {
        await dispatch(deleteAdminDeliveryCityRate(rate.id)).unwrap();
        refresh();
      },
    });
  };

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to="/super-admin/overview" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Route Rates</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Route Rates</h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Delivery fees between cities (from → to) used for route-based pricing.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            disabled={status === "loading"}
            title="Refresh"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw size={16} className={status === "loading" ? "animate-spin" : ""} />
            Refresh
          </button>
          <Link
            to="/super-admin/shipping/city-rates/new"
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Plus size={18} />
            New route rate
          </Link>
        </div>
      </div>

      {mutationError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {mutationError}
        </p>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative w-full lg:w-56">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={fromCityFilter}
            onChange={(e) => {
              setFromCityFilter(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-emerald-500"
          >
            <option value="">All from cities</option>
            {[...new Map(cities.map((city) => [city.id, city])).values()]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
          </select>
        </div>
        <div className="relative w-full lg:w-56">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={toCityFilter}
            onChange={(e) => {
              setToCityFilter(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-emerald-500"
          >
            <option value="">All to cities</option>
            {[...new Map(cities.map((city) => [city.id, city])).values()]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
          </select>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as "" | DeliveryCityRateStatus);
            setPage(1);
          }}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500 lg:w-40"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Route</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Effective period
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Status</th>
                <th className="w-16 px-2 py-3 text-left text-xs font-medium text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {status === "loading" && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                    Loading route rates...
                  </td>
                </tr>
              )}
              {status === "failed" && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center">
                    <p className="text-sm text-red-600">{error ?? "Unable to load route rates."}</p>
                    <button
                      type="button"
                      onClick={refresh}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      <RefreshCw size={14} />
                      Try again
                    </button>
                  </td>
                </tr>
              )}
              {status !== "loading" && status !== "failed" && rates.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <Route size={22} />
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-700">No route rates yet</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Add a route rate between two cities to start charging by route.
                    </p>
                    <Link
                      to="/super-admin/shipping/city-rates/new"
                      className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                    >
                      <Plus size={14} />
                      New route rate
                    </Link>
                  </td>
                </tr>
              )}
              {status !== "loading" &&
                status !== "failed" &&
                rates.map((rate) => (
                  <tr
                    key={rate.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-slate-200 text-slate-500">
                          <Route size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-900">
                            {cityName(rate.fromCityId)} → {cityName(rate.toCityId)}
                          </p>
                          <p className="text-xs text-slate-500">{rate.currency}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-900">
                      {formatMoney(rate.amount, rate.currency)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {formatDate(rate.effectiveFrom)}
                      {rate.effectiveUntil ? ` → ${formatDate(rate.effectiveUntil)}` : ""}
                    </td>
                    <td className="px-4 py-3">
                      <span className={statusBadgeClass(rate.status)}>
                        {rate.status === "ACTIVE" ? (
                          <CheckCircle2 size={12} />
                        ) : (
                          <Ban size={12} />
                        )}
                        {rate.status}
                      </span>
                    </td>
                    <td className="w-16 px-2 py-3">
                      <RowActionMenu
                        ariaLabel="Route rate actions"
                        items={[
                          {
                            key: "edit",
                            label: "Edit",
                            icon: <Pencil size={16} className="text-slate-500" />,
                            onClick: () =>
                              navigate(`/super-admin/shipping/city-rates/${rate.id}/edit`),
                          },
                          {
                            key: "toggle-status",
                            label: rate.status === "ACTIVE" ? "Deactivate" : "Activate",
                            icon:
                              rate.status === "ACTIVE" ? (
                                <Ban size={16} className="text-slate-500" />
                              ) : (
                                <CheckCircle2 size={16} className="text-slate-500" />
                              ),
                            onClick: () => void toggleStatus(rate),
                          },
                          {
                            key: "delete",
                            label: "Delete",
                            icon: <Trash2 size={16} className="text-slate-500" />,
                            className:
                              "flex w-full items-center gap-3 px-4 py-2 text-left text-xs text-red-600 hover:bg-slate-50 cursor-pointer",
                            onClick: () => confirmDelete(rate),
                          },
                        ]}
                      />
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
          totalItems={total}
          itemLabel="route rates"
          onPageChange={setPage}
          onRowsPerPageChange={(value) => {
            setRowsPerPage(value);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
};

export default AdminCityRatesPage;
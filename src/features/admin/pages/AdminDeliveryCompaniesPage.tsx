import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Ban, Building2, CheckCircle2, Pencil, Plus, RefreshCw } from "lucide-react";
import DataTablePagination from "@/components/ui/DataTablePagination";
import RowActionMenu from "@/components/ui/RowActionMenu";
import { useGlobalModal } from "@/components/ui/GlobalModalProvider";
import {
  adminShippingApi,
  type DeliveryCompanyDto,
  type DeliveryCompanyStatus,
} from "../api/adminShippingApi";

const statusBadgeClass = (status: DeliveryCompanyStatus): string =>
  status === "ACTIVE"
    ? "inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
    : "inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600";

const AdminDeliveryCompaniesPage = () => {
  const navigate = useNavigate();
  const { openModal } = useGlobalModal();
  const [companies, setCompanies] = useState<DeliveryCompanyDto[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<"loading" | "succeeded" | "failed">("loading");
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | DeliveryCompanyStatus>("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setStatus("loading");
      setError("");
      try {
        const res = await adminShippingApi.listDeliveryCompanies({
          page,
          pageSize: rowsPerPage,
          status: statusFilter || undefined,
          search: search.trim() || undefined,
        });
        if (cancelled) return;
        setCompanies(res.data.data.companies ?? []);
        setTotal(res.data.data.total ?? 0);
        setStatus("succeeded");
      } catch (loadError: unknown) {
        if (cancelled) return;
        setError(adminShippingApi.getApiErrorMessage(loadError, "Unable to load delivery companies."));
        setStatus("failed");
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [page, rowsPerPage, statusFilter, search, reloadKey]);

  const refresh = () => setReloadKey((value) => value + 1);
  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));

  const toggleStatus = async (company: DeliveryCompanyDto) => {
    const next: DeliveryCompanyStatus = company.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await adminShippingApi.updateDeliveryCompanyStatus(company.id, next);
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

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to="/super-admin/overview" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Delivery Companies</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Delivery Companies</h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Companies customers can choose at checkout. Each company has its own pricing.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw size={16} className={status === "loading" ? "animate-spin" : ""} />
            Refresh
          </button>
          <Link
            to="/super-admin/shipping/delivery-companies/new"
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Plus size={18} />
            New company
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value as "" | DeliveryCompanyStatus);
            setPage(1);
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <input
          type="search"
          value={search}
          placeholder="Search code or name"
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          className="w-full max-w-md rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Company</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Status</th>
                <th className="w-16 px-2 py-3 text-left text-xs font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {status === "loading" && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-500">
                    Loading delivery companies...
                  </td>
                </tr>
              )}
              {status === "failed" && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-red-600">
                    {error}
                  </td>
                </tr>
              )}
              {status === "succeeded" && companies.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <Building2 size={22} />
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-700">No delivery companies yet</p>
                  </td>
                </tr>
              )}
              {status === "succeeded" &&
                companies.map((company) => (
                  <tr key={company.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {company.logoUrl ? (
                          <img
                            src={company.logoUrl}
                            alt=""
                            className="h-10 w-10 rounded-lg border border-slate-200 object-contain bg-slate-50"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                            <Building2 size={18} />
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-semibold text-slate-900">{company.name}</p>
                          {company.description && (
                            <p className="text-xs text-slate-500">{company.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700">{company.code}</td>
                    <td className="px-4 py-3">
                      <span className={statusBadgeClass(company.status)}>
                        {company.status === "ACTIVE" ? <CheckCircle2 size={12} /> : <Ban size={12} />}
                        {company.status}
                      </span>
                    </td>
                    <td className="w-16 px-2 py-3">
                      <RowActionMenu
                        ariaLabel="Delivery company actions"
                        items={[
                          {
                            key: "edit",
                            label: "Edit",
                            icon: <Pencil size={16} className="text-slate-500" />,
                            onClick: () =>
                              navigate(`/super-admin/shipping/delivery-companies/${company.id}/edit`),
                          },
                          {
                            key: "toggle-status",
                            label: company.status === "ACTIVE" ? "Deactivate" : "Activate",
                            icon:
                              company.status === "ACTIVE" ? (
                                <Ban size={16} className="text-slate-500" />
                              ) : (
                                <CheckCircle2 size={16} className="text-slate-500" />
                              ),
                            onClick: () => void toggleStatus(company),
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
          itemLabel="companies"
          onPageChange={setPage}
          onRowsPerPageChange={(next) => {
            setRowsPerPage(next);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
};

export default AdminDeliveryCompaniesPage;

import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import DataTablePagination from "@/components/ui/DataTablePagination";
import {
  FLASH_DEAL_STATUSES,
  type FlashDealStatus,
} from "../types/flashDealTypes";
import { fetchFlashDeals } from "../store/flashDealThunks";
import {
  selectFlashDeals,
  selectFlashDealsLoading,
  selectFlashDealsError,
  selectFlashDealsPagination,
} from "../store/flashDealSelectors";
import FlashDealTable from "../components/FlashDealTable";
import { useFlashDealPaths } from "../config/flashDealPaths";

type StatusFilter = FlashDealStatus | "all";

const FILTER_TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  ...FLASH_DEAL_STATUSES.map((status) => ({
    key: status as StatusFilter,
    label: status.charAt(0) + status.slice(1).toLowerCase(),
  })),
];

const FlashDealsPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const paths = useFlashDealPaths();

  const deals = useAppSelector(selectFlashDeals);
  const loading = useAppSelector(selectFlashDealsLoading);
  const error = useAppSelector(selectFlashDealsError);
  const pagination = useAppSelector(selectFlashDealsPagination);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const load = useCallback(
    (nextPage = page, nextLimit = rowsPerPage, nextStatus = statusFilter) => {
      dispatch(
        fetchFlashDeals({
          page: nextPage,
          limit: nextLimit,
          status: nextStatus,
        }),
      );
    },
    [dispatch, page, rowsPerPage, statusFilter],
  );

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load, page, rowsPerPage, statusFilter]);

  const filteredDeals = search.trim()
    ? deals.filter((deal) =>
        (deal.name + (deal.description ?? ""))
          .toLowerCase()
          .includes(search.toLowerCase()),
      )
    : deals;

  const totalItems = search.trim()
    ? filteredDeals.length
    : (pagination?.total ?? 0);
  const totalPages = search.trim()
    ? Math.max(1, Math.ceil(filteredDeals.length / rowsPerPage))
    : (pagination?.totalPages ?? 1);

  const visibleDeals = search.trim()
    ? filteredDeals.slice((page - 1) * rowsPerPage, page * rowsPerPage)
    : filteredDeals;

  const handleEdit = (id: string) => {
    navigate(paths.edit(id));
  };

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to={paths.overview} className="no-underline hover:text-slate-700 hover:no-underline">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <Link
          to={paths.promotionEngine}
          className="no-underline hover:text-slate-700 hover:no-underline"
        >
          Promotion Engine
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Flash Deals</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Flash Deals</h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Create dynamic flash deals, schedule them with any start and end
            time, and control the deal lifecycle.
          </p>
        </div>

        <Link
          to={paths.new}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-[var(--dni-primary)] px-4 py-2 text-sm font-medium text-white no-underline hover:bg-[var(--dni-primary-hover)] hover:no-underline"
        >
          <Plus size={18} />
          Add Flash Deal
        </Link>
      </div>

      <div className="flex flex-wrap gap-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusFilter(tab.key)}
            className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
              statusFilter === tab.key
                ? "bg-[var(--dni-primary)] text-white"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            placeholder="Search flash deals..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-[var(--dni-border)] bg-white py-2 pl-10 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-[var(--dni-primary)]"
          />
        </div>
      </div>

      <FlashDealTable
        deals={visibleDeals}
        loading={loading}
        error={error}
        onEdit={handleEdit}
        footer={
          <DataTablePagination
            page={page}
            totalPages={totalPages}
            rowsPerPage={rowsPerPage}
            totalItems={totalItems}
            onPageChange={setPage}
            onRowsPerPageChange={(value) => {
              setRowsPerPage(value);
              setPage(1);
            }}
            itemLabel="flash deals"
          />
        }
      />
    </div>
  );
};

export default FlashDealsPage;

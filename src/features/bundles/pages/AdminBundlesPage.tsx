import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { useAppSelector } from '@/app/hooks'
import { selectAuthUser } from '@/features/auth/store/authSelectors'
import DataTablePagination from '@/components/ui/DataTablePagination'
import { bundleApi, bundleErrorMessage } from '../api/bundleApi'
import BundleTable from '../components/BundleTable'
import { useBundlePaths } from '../config/bundlePaths'
import { BUNDLE_STATUSES, type BundleRecord, type BundleStatus } from '../types/bundleTypes'

type StatusFilter = BundleStatus | 'all'

const FILTER_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  ...BUNDLE_STATUSES.map((status) => ({
    key: status as StatusFilter,
    label: status.charAt(0) + status.slice(1).toLowerCase(),
  })),
]

const AdminBundlesPage = () => {
  const navigate = useNavigate()
  const paths = useBundlePaths()
  const shopId = useAppSelector(selectAuthUser)?.active_shop_id ?? undefined
  const [rows, setRows] = useState<BundleRecord[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await bundleApi.list({
        page,
        limit: rowsPerPage,
        status: statusFilter,
        shopId,
      })
      const filtered = search.trim()
        ? result.data.filter((row) =>
            (row.title + (row.description ?? '')).toLowerCase().includes(search.trim().toLowerCase()),
          )
        : result.data
      setRows(filtered)
      setTotalItems(search.trim() ? filtered.length : result.pagination.total)
      setTotalPages(search.trim() ? Math.max(1, Math.ceil(filtered.length / rowsPerPage)) : result.pagination.totalPages)
    } catch (err) {
      setError(bundleErrorMessage(err))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [page, rowsPerPage, search, shopId, statusFilter])

  useEffect(() => {
    setPage(1)
  }, [statusFilter, search])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to={paths.overview} className="no-underline hover:text-slate-700 hover:no-underline">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Bundles</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Bundles</h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Group products into one offer and sell the set for less than the separate prices.
          </p>
        </div>
        <Link
          to={paths.new}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-[var(--dni-primary)] px-4 py-2 text-sm font-medium text-white no-underline hover:bg-[var(--dni-primary-hover)] hover:no-underline"
        >
          <Plus size={18} />
          Add Bundle
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
                ? 'bg-[var(--dni-primary)] text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative w-full max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Search bundles..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded-lg border border-[var(--dni-border)] bg-white py-2 pl-10 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-[var(--dni-primary)]"
        />
      </div>

      <BundleTable
        bundles={rows}
        loading={loading}
        error={error}
        onEdit={(id) => navigate(paths.edit(id))}
        onChanged={() => void load()}
        footer={
          <DataTablePagination
            page={page}
            totalPages={totalPages}
            rowsPerPage={rowsPerPage}
            totalItems={totalItems}
            onPageChange={setPage}
            onRowsPerPageChange={(value) => {
              setRowsPerPage(value)
              setPage(1)
            }}
            itemLabel="bundles"
          />
        }
      />
    </div>
  )
}

export default AdminBundlesPage

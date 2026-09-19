import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, ChevronDown } from 'lucide-react'

import { useAppDispatch, useAppSelector } from '@/app/hooks'
import DataTablePagination from '@/components/ui/DataTablePagination'
import { fetchFlashDeals } from '../store/flashDealThunks'
import {
  selectFlashDeals,
  selectFlashDealsLoading,
  selectFlashDealsError,
  selectFlashDealsPagination,
} from '../store/flashDealSelectors'
import FlashDealTable from '../components/FlashDealTable'

const STATUS_FILTERS: { key: 'all' | 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'CANCELLED' | 'PAUSED'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'DRAFT', label: 'Draft' },
  { key: 'SCHEDULED', label: 'Scheduled' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'PAUSED', label: 'Paused' },
  { key: 'ENDED', label: 'Ended' },
  { key: 'CANCELLED', label: 'Cancelled' },
]

const FlashDealsAdminPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const deals = useAppSelector(selectFlashDeals)
  const loading = useAppSelector(selectFlashDealsLoading)
  const error = useAppSelector(selectFlashDealsError)
  const pagination = useAppSelector(selectFlashDealsPagination)

  const [activeFilter, setActiveFilter] = useState<'all' | 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'CANCELLED' | 'PAUSED'>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  useEffect(() => {
    if (deals.length === 0) {
      dispatch(fetchFlashDeals())
    }
  }, [dispatch, deals.length])

  useEffect(() => {
    setPage(1)
  }, [activeFilter, search])

  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      const matchesFilter = activeFilter === 'all' || deal.status === activeFilter
      const matchesSearch =
        !search ||
        deal.name.toLowerCase().includes(search.toLowerCase()) ||
        deal.items.some((item) => item.product.name.toLowerCase().includes(search.toLowerCase()))
      return matchesFilter && matchesSearch
    })
  }, [deals, activeFilter, search])

  const totalPages = Math.max(1, Math.ceil(filteredDeals.length / rowsPerPage))
  const paginatedDeals = filteredDeals.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  )

  const handleEdit = (id: string) => {
    navigate(`/super-admin/promotion-engine/flash-deals/${id}/edit`)
  }

  const handleView = (id: string) => {
    navigate(`/super-admin/promotion-engine/flash-deals/${id}`)
  }

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to="/super-admin/overview" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <Link to="/super-admin/promotion-engine" className="hover:text-slate-700">
          Promotion Engine
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Flash Deals</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-700">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-emerald-100 text-emerald-700">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M8.5 4A6.5 6.5 0 0 0 2 10.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15.5 20A6.5 6.5 0 0 1 22 13.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 10.5C2 6.462 5.462 3 9.5 3" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 13.5C22 17.538 18.538 21 14.5 21" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            Flash Deals
          </div>
          <h1 className="mt-1 text-xl font-bold text-slate-900">Flash Deals</h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Manage time-limited flash sale campaigns with scheduled slots.
          </p>
        </div>

        <Link
          to="/super-admin/promotion-engine/flash-deals/new"
          className="flex shrink-0 items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Plus size={18} />
          Create Flash Deal
        </Link>
      </div>

      <div className="flex flex-wrap gap-1">
        {STATUS_FILTERS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveFilter(tab.key)}
            className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
              activeFilter === tab.key
                ? 'bg-slate-200 text-slate-900'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search flash deals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
          />
        </div>
      </div>

      <FlashDealTable
        deals={paginatedDeals}
        loading={loading}
        error={error}
        onEdit={handleEdit}
        onView={handleView}
        footer={
          <DataTablePagination
            page={page}
            totalPages={totalPages}
            rowsPerPage={rowsPerPage}
            totalItems={filteredDeals.length}
            onPageChange={setPage}
            onRowsPerPageChange={(value) => {
              setRowsPerPage(value)
              setPage(1)
            }}
            itemLabel="flash deals"
          />
        }
      />
    </div>
  )
}

export default FlashDealsAdminPage
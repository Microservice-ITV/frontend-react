import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import DataTablePagination from '@/components/ui/DataTablePagination'
import { Search, Plus, Pencil, Trash2, Route, RefreshCw, MoreHorizontal, Eye } from 'lucide-react'
import {
  adminShippingApi,
  type AdminDistanceRangeDto,
  type PricingRuleSummaryDto,
} from '../api/adminShippingApi'
import {
  deleteAdminDistanceRange,
  fetchAdminDistanceRanges,
} from '../store/adminDistanceRangesThunks'
import {
  selectAdminDistanceRanges,
  selectAdminDistanceRangesError,
  selectAdminDistanceRangesMutationError,
  selectAdminDistanceRangesStatus,
  selectAdminDistanceRangesTotal,
} from '../store/adminDistanceRangesSelectors'

const formatDate = (value: string | null): string => {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatMoney = (value: number, currency: string): string =>
  `${new Intl.NumberFormat('en-US').format(value)} ${currency}`

const AdminDistanceRangesPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { openModal } = useGlobalModal()
  const ranges = useAppSelector(selectAdminDistanceRanges)
  const total = useAppSelector(selectAdminDistanceRangesTotal)
  const status = useAppSelector(selectAdminDistanceRangesStatus)
  const error = useAppSelector(selectAdminDistanceRangesError)
  const mutationError = useAppSelector(selectAdminDistanceRangesMutationError)
  const [rules, setRules] = useState<PricingRuleSummaryDto[]>([])
  const [ruleFilter, setRuleFilter] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
      }
    }
    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openMenuId])

  useEffect(() => {
    void adminShippingApi
      .listPricingRules({ pageSize: 100 })
      .then((res) => setRules(res.data.data.rules))
      .catch(() => setRules([]))
  }, [])

  useEffect(() => {
    dispatch(
      fetchAdminDistanceRanges({
        page,
        pageSize: rowsPerPage,
        pricingRuleId: ruleFilter || undefined,
        search: debouncedSearch || undefined,
      }),
    )
  }, [dispatch, page, rowsPerPage, ruleFilter, debouncedSearch])

  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage))

  const refresh = () => {
    dispatch(
      fetchAdminDistanceRanges({
        page,
        pageSize: rowsPerPage,
        pricingRuleId: ruleFilter || undefined,
        search: debouncedSearch || undefined,
      }),
    )
  }

  const confirmDelete = (range: AdminDistanceRangeDto) => {
    openModal({
      title: 'Delete this distance range?',
      content: (
        <p>
          Removes {range.minDistanceKm}–{range.maxDistanceKm === null ? '∞' : range.maxDistanceKm}{' '}
          km for “{range.pricingRule?.name ?? 'this rule'}”. Quotes may no longer cover this
          distance.
        </p>
      ),
      primaryLabel: 'Delete',
      primaryVariant: 'danger',
      secondaryLabel: 'Cancel',
      onPrimary: async () => {
        await dispatch(deleteAdminDistanceRange(range.id)).unwrap()
        refresh()
      },
    })
  }

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to="/super-admin/overview" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Distance Ranges</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Distance Ranges</h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Non-overlapping distance brackets and their fees for each pricing rule.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            disabled={status === 'loading'}
            title="Refresh"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw size={16} className={status === 'loading' ? 'animate-spin' : ''} />
            Refresh
          </button>
          <Link
            to="/super-admin/shipping/distance-ranges/new"
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Plus size={18} />
            New range
          </Link>
        </div>
      </div>

      {mutationError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {mutationError}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <select
          value={ruleFilter}
          onChange={(e) => {
            setRuleFilter(e.target.value)
            setPage(1)
          }}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500 sm:w-64"
        >
          <option value="">All pricing rules</option>
          {rules.map((rule) => (
            <option key={rule.id} value={rule.id}>
              {rule.name} (v{rule.version})
            </option>
          ))}
        </select>

        <div className="relative w-full max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search distance ranges..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Rule</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Distance
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Fee</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Updated</th>
                <th className="w-16 px-2 py-3 text-left text-xs font-medium text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {status === 'loading' && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                    Loading distance ranges...
                  </td>
                </tr>
              )}
              {status === 'failed' && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center">
                    <p className="text-sm text-red-600">
                      {error ?? 'Unable to load distance ranges.'}
                    </p>
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
              {status !== 'loading' && status !== 'failed' && ranges.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <Route size={22} />
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-700">No distance ranges yet</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Add brackets so fees can be charged based on delivery distance.
                    </p>
                    <Link
                      to="/super-admin/shipping/distance-ranges/new"
                      className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                    >
                      <Plus size={14} />
                      New range
                    </Link>
                  </td>
                </tr>
              )}
              {status !== 'loading' &&
                status !== 'failed' &&
                ranges.map((range, index) => {
                  const openUpward = index >= ranges.length - 2
                  return (
                  <tr
                    key={range.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-slate-200 text-slate-500">
                          <Route size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-900">
                            {range.pricingRule?.name ?? 'Unknown rule'}
                          </p>
                          <p className="text-xs text-slate-500">
                            v{range.pricingRule?.version ?? '—'} ·{' '}
                            {range.pricingRule?.currency ?? ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {range.minDistanceKm} – {range.maxDistanceKm === null ? '∞' : range.maxDistanceKm}{' '}
                      km
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {formatMoney(range.fee, range.pricingRule?.currency ?? '')}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{formatDate(range.updatedAt)}</td>
                    <td className="relative w-16 px-2 py-3">
                      <div
                        className="relative inline-block"
                        ref={openMenuId === range.id ? menuRef : undefined}
                      >
                        <button
                          type="button"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenMenuId((id) => (id === range.id ? null : range.id))
                          }}
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                          aria-label="Actions"
                          aria-expanded={openMenuId === range.id}
                        >
                          <MoreHorizontal size={18} />
                        </button>
                        {openMenuId === range.id && (
                          <div
                            className={`absolute right-0 z-50 min-w-[140px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg ${
                              openUpward ? 'bottom-full mb-1' : 'top-full mt-1'
                            }`}
                          >
                            <button
                              type="button"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation()
                                setOpenMenuId(null)
                                navigate(`/super-admin/shipping/distance-ranges/${range.id}`)
                              }}
                              className="flex w-full items-center gap-3 px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                            >
                              <Eye size={16} className="shrink-0 text-slate-500" />
                              View
                            </button>
                            <button
                              type="button"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation()
                                setOpenMenuId(null)
                                navigate(`/super-admin/shipping/distance-ranges/${range.id}/edit`)
                              }}
                              className="flex w-full items-center gap-3 px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                            >
                              <Pencil size={16} className="shrink-0 text-slate-500" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation()
                                setOpenMenuId(null)
                                confirmDelete(range)
                              }}
                              className="flex w-full items-center gap-3 px-4 py-2 text-left text-xs text-red-600 hover:bg-slate-50 cursor-pointer"
                            >
                              <Trash2 size={16} className="shrink-0 text-slate-500" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                  )
                })}
            </tbody>
          </table>
        </div>

        <DataTablePagination
          page={page}
          totalPages={totalPages}
          rowsPerPage={rowsPerPage}
          totalItems={total}
          itemLabel="distance ranges"
          onPageChange={setPage}
          onRowsPerPageChange={(value) => {
            setRowsPerPage(value)
            setPage(1)
          }}
        />
      </div>
    </div>
  )
}

export default AdminDistanceRangesPage

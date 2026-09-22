import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import DataTablePagination from '@/components/ui/DataTablePagination'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Power,
  Truck,
  ArrowRight,
  RefreshCw,
  MoreHorizontal,
  Eye,
} from 'lucide-react'
import type { DeliveryPricingRuleDto, PricingRuleStatus } from '../api/adminShippingApi'
import {
  deleteAdminPricingRule,
  fetchAdminPricingRules,
  setAdminPricingRuleStatus,
} from '../store/adminPricingRulesThunks'
import {
  selectAdminPricingRules,
  selectAdminPricingRulesError,
  selectAdminPricingRulesMutationError,
  selectAdminPricingRulesStatus,
  selectAdminPricingRulesTotal,
} from '../store/adminPricingRulesSelectors'

type StatusFilter = 'ALL' | PricingRuleStatus

const FILTER_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'INACTIVE', label: 'Inactive' },
]

const formatDate = (value: string | null): string => {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatMoney = (value: number, currency: string): string =>
  `${new Intl.NumberFormat('en-US').format(value)} ${currency}`

const AdminPricingRulesPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { openModal } = useGlobalModal()
  const rules = useAppSelector(selectAdminPricingRules)
  const total = useAppSelector(selectAdminPricingRulesTotal)
  const rulesStatus = useAppSelector(selectAdminPricingRulesStatus)
  const rulesError = useAppSelector(selectAdminPricingRulesError)
  const mutationError = useAppSelector(selectAdminPricingRulesMutationError)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
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
    dispatch(
      fetchAdminPricingRules({
        page,
        pageSize: rowsPerPage,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        search: debouncedSearch || undefined,
      }),
    )
  }, [dispatch, page, rowsPerPage, statusFilter, debouncedSearch])

  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage))

  const refresh = () => {
    dispatch(
      fetchAdminPricingRules({
        page,
        pageSize: rowsPerPage,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        search: debouncedSearch || undefined,
      }),
    )
  }

  const confirmDelete = (rule: DeliveryPricingRuleDto) => {
    openModal({
      title: `Delete “${rule.name}”?`,
      content: (
        <p>
          This permanently removes version {rule.version}. Rules already used by quotes cannot be
          deleted — deactivate them instead.
        </p>
      ),
      primaryLabel: 'Delete',
      primaryVariant: 'danger',
      secondaryLabel: 'Cancel',
      onPrimary: async () => {
        await dispatch(deleteAdminPricingRule(rule.id)).unwrap()
        refresh()
      },
    })
  }

  const toggleStatus = async (rule: DeliveryPricingRuleDto) => {
    const next: PricingRuleStatus = rule.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    try {
      await dispatch(setAdminPricingRuleStatus({ id: rule.id, status: next })).unwrap()
    } catch {
      refresh()
    }
  }

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to="/super-admin/overview" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Delivery Pricing</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Delivery Pricing Rules</h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Base configuration for delivery fee calculation. Manage weight rates and distance
            ranges from their own screens.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            disabled={rulesStatus === 'loading'}
            title="Refresh"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw size={16} className={rulesStatus === 'loading' ? 'animate-spin' : ''} />
            Refresh
          </button>
          <Link
            to="/super-admin/shipping/pricing-rules/new"
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Plus size={18} />
            New rule
          </Link>
        </div>
      </div>

      {mutationError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {mutationError}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setStatusFilter(tab.key)
                setPage(1)
              }}
              className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-slate-200 text-slate-900'
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
            placeholder="Search pricing rules..."
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
          <table className="w-full min-w-[960px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Rule</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Weight rate
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Distance brackets
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Effective
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Status</th>
                <th className="w-16 px-2 py-3 text-left text-xs font-medium text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {rulesStatus === 'loading' && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                    Loading pricing rules...
                  </td>
                </tr>
              )}
              {rulesStatus === 'failed' && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center">
                    <p className="text-sm text-red-600">
                      {rulesError ?? 'Unable to load pricing rules.'}
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
              {rulesStatus !== 'loading' && rulesStatus !== 'failed' && rules.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <Truck size={22} />
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-700">No pricing rules yet</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Create a rule to start calculating delivery fees.
                    </p>
                    <Link
                      to="/super-admin/shipping/pricing-rules/new"
                      className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                    >
                      <Plus size={14} />
                      New rule
                    </Link>
                  </td>
                </tr>
              )}
              {rulesStatus !== 'loading' &&
                rulesStatus !== 'failed' &&
                rules.map((rule, index) => {
                  const openUpward = index >= rules.length - 2
                  return (
                  <tr
                    key={rule.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-slate-200 text-slate-500">
                          <Truck size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-900">{rule.name}</p>
                          <p className="text-xs text-slate-500">
                            v{rule.version} · {rule.serviceType} · {rule.currency}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {rule.weightRate ? (
                        <>
                          <span>
                            {rule.weightRate.baseWeightKg} kg →{' '}
                            {formatMoney(rule.weightRate.baseFee, rule.currency)}
                          </span>
                          <br />
                          <span className="text-slate-400">
                            +{rule.weightRate.additionalWeightKg} kg →{' '}
                            {formatMoney(rule.weightRate.additionalFee, rule.currency)}
                          </span>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <div className="flex flex-col gap-0.5">
                        {rule.distanceRates.map((rate) => (
                          <span key={rate.id ?? `${rate.minDistanceKm}-${rate.maxDistanceKm}`}>
                            {rate.minDistanceKm}
                            <ArrowRight size={10} className="mx-1 inline" />
                            {rate.maxDistanceKm === null ? '∞' : rate.maxDistanceKm} km ·{' '}
                            {formatMoney(rate.fee, rule.currency)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {formatDate(rule.effectiveFrom)}
                      <br />
                      <span className="text-slate-400">
                        to {rule.effectiveUntil ? formatDate(rule.effectiveUntil) : 'open'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          rule.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {rule.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="relative w-16 px-2 py-3">
                      <div
                        className="relative inline-block"
                        ref={openMenuId === rule.id ? menuRef : undefined}
                      >
                        <button
                          type="button"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenMenuId((id) => (id === rule.id ? null : rule.id))
                          }}
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                          aria-label="Actions"
                          aria-expanded={openMenuId === rule.id}
                        >
                          <MoreHorizontal size={18} />
                        </button>
                        {openMenuId === rule.id && (
                          <div
                            className={`absolute right-0 z-50 min-w-[150px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg ${
                              openUpward ? 'bottom-full mb-1' : 'top-full mt-1'
                            }`}
                          >
                            <button
                              type="button"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation()
                                setOpenMenuId(null)
                                void toggleStatus(rule)
                              }}
                              className={`flex w-full items-center gap-3 px-4 py-2 text-left text-xs font-medium hover:bg-slate-50 cursor-pointer ${
                                rule.status === 'ACTIVE' ? 'text-slate-700' : 'text-emerald-700'
                              }`}
                            >
                              <Power size={16} className="shrink-0 text-slate-500" />
                              {rule.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              type="button"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation()
                                setOpenMenuId(null)
                                navigate(`/super-admin/shipping/pricing-rules/${rule.id}`)
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
                                navigate(`/super-admin/shipping/pricing-rules/${rule.id}/edit`)
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
                                confirmDelete(rule)
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
          itemLabel="pricing rules"
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

export default AdminPricingRulesPage

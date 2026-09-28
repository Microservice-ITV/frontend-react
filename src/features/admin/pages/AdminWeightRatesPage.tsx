import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import DataTablePagination from '@/components/ui/DataTablePagination'
import RowActionMenu from '@/components/ui/RowActionMenu'
import { Search, Plus, Pencil, Trash2, Scale, RefreshCw, Eye } from 'lucide-react'
import {
  adminShippingApi,
  type AdminWeightRateDto,
  type PricingRuleSummaryDto,
} from '../api/adminShippingApi'
import { deleteAdminWeightRate, fetchAdminWeightRates } from '../store/adminWeightRatesThunks'
import {
  selectAdminWeightRates,
  selectAdminWeightRatesError,
  selectAdminWeightRatesMutationError,
  selectAdminWeightRatesStatus,
  selectAdminWeightRatesTotal,
} from '../store/adminWeightRatesSelectors'

const formatDate = (value: string | null): string => {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatMoney = (value: number, currency: string): string =>
  `${new Intl.NumberFormat('en-US').format(value)} ${currency}`

const AdminWeightRatesPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { openModal } = useGlobalModal()
  const rates = useAppSelector(selectAdminWeightRates)
  const total = useAppSelector(selectAdminWeightRatesTotal)
  const status = useAppSelector(selectAdminWeightRatesStatus)
  const error = useAppSelector(selectAdminWeightRatesError)
  const mutationError = useAppSelector(selectAdminWeightRatesMutationError)
  const [rules, setRules] = useState<PricingRuleSummaryDto[]>([])
  const [ruleFilter, setRuleFilter] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    void adminShippingApi
      .listPricingRules({ pageSize: 100 })
      .then((res) => setRules(res.data.data.rules))
      .catch(() => setRules([]))
  }, [])

  useEffect(() => {
    dispatch(
      fetchAdminWeightRates({
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
      fetchAdminWeightRates({
        page,
        pageSize: rowsPerPage,
        pricingRuleId: ruleFilter || undefined,
        search: debouncedSearch || undefined,
      }),
    )
  }

  const confirmDelete = (rate: AdminWeightRateDto) => {
    openModal({
      title: 'Delete this weight rate?',
      content: (
        <p>
          This removes the weight rate for “{rate.pricingRule?.name ?? 'this rule'}”. The rule can
          be left without a weight rate, but quotes will not calculate until you add one again.
        </p>
      ),
      primaryLabel: 'Delete',
      primaryVariant: 'danger',
      secondaryLabel: 'Cancel',
      onPrimary: async () => {
        await dispatch(deleteAdminWeightRate(rate.id)).unwrap()
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
        <span className="text-slate-900">Weight Rates</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Weight Rates</h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Base and per-increment weight fees applied to each pricing rule.
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
            to="/super-admin/shipping/weight-rates/new"
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Plus size={18} />
            New weight rate
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
            placeholder="Search weight rates..."
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
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Base</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Additional
                </th>
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
                    Loading weight rates...
                  </td>
                </tr>
              )}
              {status === 'failed' && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center">
                    <p className="text-sm text-red-600">{error ?? 'Unable to load weight rates.'}</p>
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
              {status !== 'loading' && status !== 'failed' && rates.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <Scale size={22} />
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-700">No weight rates yet</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Add a weight rate for a pricing rule to start charging by weight.
                    </p>
                    <Link
                      to="/super-admin/shipping/weight-rates/new"
                      className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                    >
                      <Plus size={14} />
                      New weight rate
                    </Link>
                  </td>
                </tr>
              )}
              {status !== 'loading' &&
                status !== 'failed' &&
                rates.map((rate) => (
                  <tr
                    key={rate.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-slate-200 text-slate-500">
                          <Scale size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-900">
                            {rate.pricingRule?.name ?? 'Unknown rule'}
                          </p>
                          <p className="text-xs text-slate-500">
                            v{rate.pricingRule?.version ?? '—'} ·{' '}
                            {rate.pricingRule?.currency ?? ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {rate.baseWeightKg} kg →{' '}
                      {formatMoney(rate.baseFee, rate.pricingRule?.currency ?? '')}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      +{rate.additionalWeightKg} kg →{' '}
                      {formatMoney(rate.additionalFee, rate.pricingRule?.currency ?? '')}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{formatDate(rate.updatedAt)}</td>
                    <td className="w-16 px-2 py-3">
                      <RowActionMenu
                        ariaLabel="Weight rate actions"
                        items={[
                          {
                            key: 'view',
                            label: 'View',
                            icon: <Eye size={16} className="shrink-0 text-slate-500" />,
                            onClick: () => navigate(`/super-admin/shipping/weight-rates/${rate.id}`),
                          },
                          {
                            key: 'edit',
                            label: 'Edit',
                            icon: <Pencil size={16} className="shrink-0 text-slate-500" />,
                            onClick: () =>
                              navigate(`/super-admin/shipping/weight-rates/${rate.id}/edit`),
                          },
                          {
                            key: 'delete',
                            label: 'Delete',
                            icon: <Trash2 size={16} className="shrink-0 text-slate-500" />,
                            className:
                              'flex w-full items-center gap-3 px-4 py-2 text-left text-xs text-red-600 hover:bg-slate-50 cursor-pointer',
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
          itemLabel="weight rates"
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

export default AdminWeightRatesPage

import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import DataTablePagination from '@/components/ui/DataTablePagination'
import { Search, RefreshCw, FileText, Eye, Ban, MoreHorizontal } from 'lucide-react'
import type { DeliveryQuoteDto, DeliveryQuoteStatus } from '../api/adminShippingApi'
import {
  cancelAdminDeliveryQuote,
  fetchAdminDeliveryQuotes,
} from '../store/adminDeliveryQuotesThunks'
import {
  selectAdminDeliveryQuotes,
  selectAdminDeliveryQuotesError,
  selectAdminDeliveryQuotesMutationError,
  selectAdminDeliveryQuotesStatus,
  selectAdminDeliveryQuotesTotal,
} from '../store/adminDeliveryQuotesSelectors'

type StatusFilter = 'ALL' | DeliveryQuoteStatus

const FILTER_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'EXPIRED', label: 'Expired' },
  { key: 'USED', label: 'Used' },
  { key: 'CANCELLED', label: 'Cancelled' },
]

const statusBadgeClass = (status: DeliveryQuoteStatus): string => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-emerald-100 text-emerald-700'
    case 'USED':
      return 'bg-sky-100 text-sky-700'
    case 'EXPIRED':
      return 'bg-amber-100 text-amber-800'
    case 'CANCELLED':
      return 'bg-slate-100 text-slate-600'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

const formatDateTime = (value: string): string => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatMoney = (value: number, currency: string): string =>
  `${new Intl.NumberFormat('en-US').format(value)} ${currency}`

const AdminDeliveryQuotesPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { openModal } = useGlobalModal()
  const quotes = useAppSelector(selectAdminDeliveryQuotes)
  const total = useAppSelector(selectAdminDeliveryQuotesTotal)
  const quotesStatus = useAppSelector(selectAdminDeliveryQuotesStatus)
  const quotesError = useAppSelector(selectAdminDeliveryQuotesError)
  const mutationError = useAppSelector(selectAdminDeliveryQuotesMutationError)
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
      fetchAdminDeliveryQuotes({
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
      fetchAdminDeliveryQuotes({
        page,
        pageSize: rowsPerPage,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        search: debouncedSearch || undefined,
      }),
    )
  }

  const confirmCancel = (quote: DeliveryQuoteDto) => {
    openModal({
      title: `Cancel quote ${quote.quoteNumber}?`,
      content: (
        <p>
          This marks the quote as cancelled so it can no longer be used at checkout. Fee:{' '}
          <strong>{formatMoney(quote.totalFee, quote.currency)}</strong>.
        </p>
      ),
      primaryLabel: 'Cancel quote',
      primaryVariant: 'danger',
      secondaryLabel: 'Keep',
      onPrimary: async () => {
        await dispatch(cancelAdminDeliveryQuote(quote.id)).unwrap()
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
        <span className="text-slate-900">Delivery Quotes</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Delivery Quotes</h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Calculated shipping fees saved from checkout and calculate requests.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={quotesStatus === 'loading'}
          title="Refresh"
          className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 cursor-pointer"
        >
          <RefreshCw size={16} className={quotesStatus === 'loading' ? 'animate-spin' : ''} />
          Refresh
        </button>
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
            placeholder="Search quote #, shop, or customer..."
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
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Quote</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Shop</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Route</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Fee</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Expires</th>
                <th className="w-16 px-2 py-3 text-left text-xs font-medium text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {quotesStatus === 'loading' && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                    Loading delivery quotes...
                  </td>
                </tr>
              )}
              {quotesStatus === 'failed' && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center">
                    <p className="text-sm text-red-600">
                      {quotesError ?? 'Unable to load delivery quotes.'}
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
              {quotesStatus !== 'loading' && quotesStatus !== 'failed' && quotes.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <FileText size={22} />
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-700">No delivery quotes yet</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Quotes appear when shipping is calculated at checkout.
                    </p>
                  </td>
                </tr>
              )}
              {quotesStatus !== 'loading' &&
                quotesStatus !== 'failed' &&
                quotes.map((quote, index) => {
                  const openUpward = index >= quotes.length - 2
                  return (
                  <tr
                    key={quote.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-slate-200 text-slate-500">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="font-mono text-xs font-semibold text-slate-900">
                            {quote.quoteNumber}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {formatDateTime(quote.createdAt)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <span className="line-clamp-1 font-mono text-[11px]">{quote.shopId}</span>
                      {quote.customerId && (
                        <span className="mt-0.5 block text-[11px] text-slate-400">
                          customer {quote.customerId}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {quote.distanceKm.toFixed(1)} km
                      <br />
                      <span className="text-slate-400">{quote.durationMinutes} min</span>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-900">
                      {formatMoney(quote.totalFee, quote.currency)}
                      <br />
                      <span className="font-normal text-slate-400">
                        {quote.chargeableWeightKg.toFixed(2)} kg chargeable
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(quote.status)}`}
                      >
                        {quote.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {formatDateTime(quote.expiresAt)}
                    </td>
                    <td className="relative w-16 px-2 py-3">
                      <div
                        className="relative inline-block"
                        ref={openMenuId === quote.id ? menuRef : undefined}
                      >
                        <button
                          type="button"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenMenuId((id) => (id === quote.id ? null : quote.id))
                          }}
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                          aria-label="Actions"
                          aria-expanded={openMenuId === quote.id}
                        >
                          <MoreHorizontal size={18} />
                        </button>
                        {openMenuId === quote.id && (
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
                                navigate(`/super-admin/shipping/quotes/${quote.id}`)
                              }}
                              className="flex w-full items-center gap-3 px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                            >
                              <Eye size={16} className="shrink-0 text-slate-500" />
                              View
                            </button>
                            {quote.status === 'ACTIVE' && (
                              <button
                                type="button"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setOpenMenuId(null)
                                  confirmCancel(quote)
                                }}
                                className="flex w-full items-center gap-3 px-4 py-2 text-left text-xs text-red-600 hover:bg-slate-50 cursor-pointer"
                              >
                                <Ban size={16} className="shrink-0 text-slate-500" />
                                Cancel quote
                              </button>
                            )}
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
          itemLabel="quotes"
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

export default AdminDeliveryQuotesPage

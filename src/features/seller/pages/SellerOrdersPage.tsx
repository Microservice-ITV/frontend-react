import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import DataTablePagination from '@/components/ui/DataTablePagination'
import RowActionMenu from '@/components/ui/RowActionMenu'
import CopyToClipboardButton from '../components/CopyToClipboardButton'
import {
  canSellerShip,
  fetchCustomerAvatars,
  fetchSellerOrderPage,
  sellerOrderStatus,
  type SellerOrderSummary,
  type SellerOrderStatusFilter,
} from '../api/sellerOrderApi'
import CustomerAvatar from '../components/CustomerAvatar'
import { Search, Eye, Truck, RefreshCw, XCircle, PackageCheck } from 'lucide-react'

type SellerOrderTab = SellerOrderStatusFilter

const TABS: { key: SellerOrderTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'to-ship', label: 'To Ship' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'returned', label: 'Returned' },
]

const STATUS_STYLES: Record<string, string> = {
  READY_FOR_FULFILLMENT: 'bg-amber-100 text-amber-700',
  PARTIALLY_FULFILLED: 'bg-orange-100 text-orange-700',
  SHIPPED: 'bg-cyan-100 text-cyan-700',
  FULFILLED: 'bg-cyan-100 text-cyan-700',
  IN_TRANSIT: 'bg-blue-100 text-blue-700',
  OUT_FOR_DELIVERY: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
  RETURNED: 'bg-violet-100 text-violet-700',
  FAILED: 'bg-red-100 text-red-700',
  FAILED_PAYMENT: 'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<string, string> = {
  READY_FOR_FULFILLMENT: 'TO SHIP',
  PARTIALLY_FULFILLED: 'PARTIALLY SHIPPED',
  SHIPPED: 'SHIPPED',
  FULFILLED: 'SHIPPED',
  IN_TRANSIT: 'IN TRANSIT',
  OUT_FOR_DELIVERY: 'OUT FOR DELIVERY',
  DELIVERED: 'DELIVERED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  RETURNED: 'RETURNED',
  FAILED: 'FAILED',
  FAILED_PAYMENT: 'PAYMENT FAILED',
}

const formatMoney = (value: number, _currency?: string): string => {
  const amount = Number(value)
  const safe = Number.isFinite(amount) ? amount : 0
  return `Ks ${safe.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

const formatDate = (value?: string | null): string => {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}


type SellerOrdersPageProps = { fixedFilter?: 'cancelled' | 'returned' }

const SellerOrdersPage = ({ fixedFilter }: SellerOrdersPageProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const authUser = useAppSelector((state) => state.auth.user)
  const activeShopId = authUser?.active_shop_id ?? null
  const authUserId = authUser?.id ?? null
  const [orders, setOrders] = useState<SellerOrderSummary[]>([])
  const [ordersStatus, setOrdersStatus] = useState('idle')
  const [ordersError, setOrdersError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [selectedFilter, setSelectedFilter] = useState<SellerOrderTab>('all')
  const activeFilter = fixedFilter ?? selectedFilter
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [avatars, setAvatars] = useState<Record<string, string | null>>({})

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (!authUserId) {
      setOrders([])
      setTotal(0)
      setOrdersStatus('idle')
      return
    }
    const controller = new AbortController()
    setOrdersStatus('loading')
    setOrdersError(null)
    void fetchSellerOrderPage({
      userId: authUserId,
      activeShopId,
      statusFilter: activeFilter,
      search: debouncedSearch,
      page,
      limit: rowsPerPage,
    }, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return
        const lastPage = Math.max(1, Math.ceil(result.total / rowsPerPage))
        if (page > lastPage) {
          setPage(lastPage)
          return
        }
        setOrders(result.items)
        setTotal(result.total)
        setOrdersStatus('succeeded')
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setOrders([])
        setTotal(0)
        setOrdersError(error instanceof Error ? error.message : 'Unable to load orders')
        setOrdersStatus('failed')
      })
    return () => controller.abort()
  }, [authUserId, activeShopId, activeFilter, debouncedSearch, page, rowsPerPage, location.pathname, refreshVersion])

  const missingShopContext = !activeShopId && !authUserId
  const isLoading = ordersStatus === 'loading'
  const effectiveError = missingShopContext
    ? 'No active shop context found for this account.'
    : ordersError

  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage))
  const paginatedOrders = orders
  const visibleCustomerIds = useMemo(
    () => paginatedOrders.map((order) => order.customerId),
    [paginatedOrders],
  )

  useEffect(() => {
    let cancelled = false
    void fetchCustomerAvatars(visibleCustomerIds)
      .then((next) => {
        if (!cancelled) setAvatars(next)
      })
      .catch(() => {
        if (!cancelled) setAvatars({})
      })
    return () => {
      cancelled = true
    }
  }, [visibleCustomerIds])

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="text-xs text-slate-500">
        <Link to="/seller/overview" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
          <span className="text-slate-900">{fixedFilter === 'cancelled' ? 'Cancel Orders' : fixedFilter === 'returned' ? 'Return Orders' : 'Orders'}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {fixedFilter === 'cancelled' ? 'Cancel Orders' : fixedFilter === 'returned' ? 'Return Orders' : 'Orders'}
          </h1>
          <p className="mt-0.5 text-sm text-slate-600">
            {fixedFilter === 'cancelled'
              ? 'Review shipped orders cancelled by the customer.'
              : fixedFilter === 'returned'
                ? 'Review returned orders and their recorded reasons.'
                : 'Manage and fulfill orders containing your products.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (activeShopId || authUserId) {
              setRefreshVersion((value) => value + 1)
            }
          }}
          disabled={isLoading || missingShopContext}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : undefined} />
          Refresh
        </button>
      </div>

      {/* Status filters and search share a row on desktop. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {!fixedFilter && <div className="flex flex-wrap gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setSelectedFilter(tab.key)
                setPage(1)
              }}
              className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
                activeFilter === tab.key
                  ? 'bg-slate-200 text-slate-900'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>}
        <div className={`relative w-full ${fixedFilter ? '' : 'sm:max-w-md'}`}>
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search orders..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Order ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Waybill No
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Items
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Status
                </th>
               
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Total
                </th>
                 <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Date
                </th>
                <th className="w-16 px-2 py-3 text-left text-xs font-medium text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">
                    Loading orders...
                  </td>
                </tr>
              ) : effectiveError ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-red-600">
                    {effectiveError}
                  </td>
                </tr>
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="mx-auto flex max-w-lg flex-col items-center">
                      <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-full ${fixedFilter === 'cancelled' ? 'bg-rose-50 text-rose-600' : fixedFilter === 'returned' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                        {fixedFilter === 'cancelled'
                          ? <XCircle size={21} />
                          : fixedFilter === 'returned'
                            ? <PackageCheck size={21} />
                            : <Search size={20} />}
                      </div>
                      <p className="text-sm font-semibold text-slate-800">
                        {search.trim()
                          ? 'No matching orders'
                          : fixedFilter === 'cancelled'
                            ? 'No cancelled orders yet'
                            : fixedFilter === 'returned'
                              ? 'No returns recorded yet'
                              : activeFilter === 'to-ship'
                                ? 'No orders to ship'
                                : 'No orders found'}
                      </p>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                        {search.trim()
                          ? 'Try a different order ID or product name.'
                          : fixedFilter === 'cancelled'
                            ? 'Shipped orders you cancel will appear here with the cancellation reason and return deadline.'
                            : fixedFilter === 'returned'
                              ? 'Orders will appear here after the delivery company returns the product and you record the return reason.'
                              : activeFilter === 'to-ship'
                                ? 'Orders ready for fulfillment will appear here.'
                                : 'Orders matching this status will appear here.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const statusUpper = sellerOrderStatus(order)
                  const customerName = order.deliveryAddress?.recipientName || order.customerId
                  const itemNames = order.items.map((i) => i.name).join(', ')
                  // Seller's share of the order total (co-mingled orders from
                  // other owners' shops show their portion, matching detail).
                  const shareTotal = order.sellerTotals?.total ?? order.totals.total
                  const isSharedOrder = Boolean(
                    (order.scopedToSeller ?? false) &&
                      order.sellerTotals &&
                      Math.abs(order.sellerTotals.total - order.totals.total) > 0.005,
                  )

                  return (
                    <tr
                      key={order.orderId}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 text-xs font-medium text-slate-900">
                        <div className="inline-flex max-w-[190px] items-center gap-1">
                          <span className="min-w-0 truncate font-mono" title={order.orderId}>{order.orderId}</span>
                          <CopyToClipboardButton value={order.orderId} label="order ID" />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700">
                        <div className="inline-flex max-w-[210px] items-center gap-1">
                          <span className="min-w-0 truncate font-mono" title={order.wayBillNo || undefined}>
                            {order.wayBillNo?.trim() || '—'}
                          </span>
                          <CopyToClipboardButton value={order.wayBillNo?.trim() ?? ''} label="waybill number" />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <CustomerAvatar
                            imageUrl={avatars[order.customerId]}
                            alt={customerName}
                          />
                          <div>
                            <p className="text-xs font-medium text-slate-900">
                              {customerName}
                            </p>
                            <p className="text-xs text-slate-500">
                              {order.deliveryAddress?.city || '—'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="max-w-[200px] truncate text-xs text-slate-700" title={itemNames}>
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[statusUpper] || 'bg-slate-100 text-slate-600'}`}
                        >
                          {STATUS_LABELS[statusUpper] || statusUpper}
                        </span>
                      </td>
                      
                      <td className="px-4 py-3 text-xs font-medium text-slate-900">
                        <p className="whitespace-nowrap" title={isSharedOrder ? `Full order: ${formatMoney(order.totals.total, order.totals.currency)} (other shops' shares excluded)` : undefined}>
                          {formatMoney(shareTotal, order.totals.currency)}
                        </p>
                        {isSharedOrder && (
                          <p className="mt-0.5 text-[10px] font-normal text-slate-400">
                            your share · full {formatMoney(order.totals.total, order.totals.currency)}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {formatDate(order.placedAt || order.createdAt)}
                      </td>
                      <td className="w-28 px-2 py-3">
                        <div className="flex items-center gap-1">
                          {canSellerShip(order) && (
                            <button
                              type="button"
                              onClick={() => navigate(`/seller/orders/${order.orderId}`)}
                              className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                              aria-label={`Ship order ${order.orderId}`}
                            >
                              <Truck size={14} />
                              Ship
                            </button>
                          )}
                          <RowActionMenu
                            ariaLabel="Order actions"
                            items={[
                              {
                                key: 'view',
                                label: 'View',
                                icon: <Eye size={16} className="text-slate-500" />,
                                onClick: () => navigate(`/seller/orders/${order.orderId}`),
                              },
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <DataTablePagination
          page={page}
          totalPages={totalPages}
          rowsPerPage={rowsPerPage}
          totalItems={total}
          onPageChange={setPage}
          onRowsPerPageChange={(value) => {
            setPage(1)
            setRowsPerPage(value)
          }}
        />
      </div>
    </div>
  )
}

export default SellerOrdersPage

import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import DataTablePagination from '@/components/ui/DataTablePagination'
import { fetchSellerOrdersByShop } from '../store'
import { sellerOrderApi, type SellerOrder } from '../api/sellerOrderApi'
import {
  Search,
  MoreHorizontal,
  Eye,
  Truck,
  X,
} from 'lucide-react'

type SellerOrderTab = 'all' | 'to-ship' | 'shipped' | 'completed' | 'cancelled'

const TABS: { key: SellerOrderTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'to-ship', label: 'To Ship' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

const STATUS_STYLES: Record<string, string> = {
  READY_FOR_FULFILLMENT: 'bg-amber-100 text-amber-700',
  SHIPPED: 'bg-cyan-100 text-cyan-700',
  IN_TRANSIT: 'bg-blue-100 text-blue-700',
  OUT_FOR_DELIVERY: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
  FAILED: 'bg-red-100 text-red-700',
  FAILED_PAYMENT: 'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<string, string> = {
  READY_FOR_FULFILLMENT: 'To Ship',
  SHIPPED: 'Shipped',
  IN_TRANSIT: 'In Transit',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  FAILED: 'Failed',
  FAILED_PAYMENT: 'Payment Failed',
}

const isOrderInTab = (order: SellerOrder, tab: SellerOrderTab): boolean => {
  const status = (order.status || '').toUpperCase()
  if (tab === 'all') return true
  if (tab === 'to-ship') return status === 'READY_FOR_FULFILLMENT'
  if (tab === 'shipped') return ['SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(status)
  if (tab === 'completed') return ['DELIVERED', 'COMPLETED'].includes(status)
  if (tab === 'cancelled') return ['CANCELLED', 'FAILED', 'FAILED_PAYMENT', 'EXPIRED'].includes(status)
  return false
}

const formatMoney = (value: number, currency: string): string => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
    }).format(Number(value || 0))
  } catch {
    return `${currency} ${Number(value || 0).toFixed(2)}`
  }
}

const formatDate = (value?: string | null): string => {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const SellerOrdersPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { openModal } = useGlobalModal()
  const authUser = useAppSelector((state) => state.auth.user)
  const activeShopId = authUser?.active_shop_id ?? null
  const authUserId = authUser?.id ?? null
  const orders = useAppSelector((state) => state.sellerOrders.items)
  const ordersStatus = useAppSelector((state) => state.sellerOrders.status)
  const ordersError = useAppSelector((state) => state.sellerOrders.error)

  const [activeFilter, setActiveFilter] = useState<SellerOrderTab>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

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
    if (!activeShopId && !authUserId) return
    dispatch(fetchSellerOrdersByShop({ userId: authUserId, activeShopId }))
  }, [activeShopId, authUserId, dispatch, location.pathname])

  useEffect(() => {
    setPage(1)
  }, [activeShopId, orders.length])

  const missingShopContext = !activeShopId && !authUserId
  const isLoading = ordersStatus === 'loading'
  const effectiveError = missingShopContext
    ? 'No active shop context found for this account.'
    : ordersError

  const filteredOrders = orders.filter((order) => {
    const matchesFilter = isOrderInTab(order, activeFilter)
    const keyword = search.trim().toLowerCase()
    const matchesSearch =
      !keyword ||
      order.orderId.toLowerCase().includes(keyword) ||
      order.items.some((item) => item.name.toLowerCase().includes(keyword))
    return matchesFilter && matchesSearch
  })

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / rowsPerPage))
  const paginatedOrders = filteredOrders.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  )

  const handleShipOrder = (order: SellerOrder) => {
    openModal({
      title: 'Ship Order',
      content: (
        <div className="space-y-3 text-sm text-slate-700">
          <p>
            Create a shipment for order <strong className="text-slate-900">{order.orderId}</strong>?
          </p>
          <p className="text-xs text-slate-500">
            A tracking number will be automatically generated.
          </p>
        </div>
      ),
      primaryLabel: 'Ship Order',
      primaryVariant: 'success',
      secondaryLabel: 'Cancel',
      onPrimary: async () => {
        try {
          await sellerOrderApi.createShipment(order.orderId, {
            courier_code: 'STANDARD',
            courier_name: 'Standard Shipping',
            courier_phone: 'N/A',
          })
          if (activeShopId || authUserId) {
            await dispatch(fetchSellerOrdersByShop({ userId: authUserId, activeShopId })).unwrap()
          }
        } catch (error: any) {
          openModal({
            title: 'Shipment Failed',
            content: (
              <p className="text-sm text-red-600">
                {error?.response?.data?.error || error?.message || 'Failed to create shipment. Please try again.'}
              </p>
            ),
            primaryLabel: 'OK',
            primaryVariant: 'success',
          })
        }
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="text-xs text-slate-500">
        <Link to="/seller/overview" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Orders</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Orders</h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Manage and fulfill orders containing your products.
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1">
        {TABS.map((tab) => (
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

      {/* Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Order ID
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
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Total
                </th>
                <th className="w-16 px-2 py-3 text-left text-xs font-medium text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                    Loading orders...
                  </td>
                </tr>
              ) : effectiveError ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-red-600">
                    {effectiveError}
                  </td>
                </tr>
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                    No orders found for this shop.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order, index) => {
                  const openUpward = index >= paginatedOrders.length - 2
                  const statusUpper = (order.status || '').toUpperCase()
                  const customerName = order.deliveryAddress?.recipientName || order.customerId
                  const itemNames = order.items.map((i) => i.name).join(', ')

                  return (
                    <tr
                      key={order.orderId}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 text-xs font-medium text-slate-900">
                        {order.orderId}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-600">
                            {getInitials(customerName)}
                          </div>
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
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {formatDate(order.placedAt || order.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-slate-900">
                        {formatMoney(order.totals.total, order.totals.currency)}
                      </td>
                      <td className="relative w-16 px-2 py-3">
                        <div
                          className="relative inline-block"
                          ref={openMenuId === order.orderId ? menuRef : undefined}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setOpenMenuId((id) =>
                                id === order.orderId ? null : order.orderId,
                              )
                            }
                            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                            aria-label="Actions"
                            aria-expanded={openMenuId === order.orderId}
                          >
                            <MoreHorizontal size={18} />
                          </button>
                          {openMenuId === order.orderId && (
                            <div
                              className={`absolute right-0 z-50 min-w-[140px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg ${
                                openUpward ? 'bottom-full mb-1' : 'top-full mt-1'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null)
                                  navigate(`/seller/orders/${order.orderId}`)
                                }}
                                className="flex w-full items-center gap-3 px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                              >
                                <Eye size={16} className="text-slate-500 shrink-0" />
                                View
                              </button>
                              {statusUpper === 'READY_FOR_FULFILLMENT' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null)
                                    handleShipOrder(order)
                                  }}
                                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-xs text-emerald-700 hover:bg-slate-50 cursor-pointer"
                                >
                                  <Truck size={16} className="shrink-0" />
                                  Ship
                                </button>
                              )}
                            </div>
                          )}
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
          totalItems={filteredOrders.length}
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

export default SellerOrdersPage

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import { ordersApi } from '../api/ordersApi'
import OrderProductImage from '../components/OrderProductImage'
import DataTablePagination from '@/components/ui/DataTablePagination'
import type { PurchasedOrder } from '../types/orderTypes'
import { Typing } from '@/components/loading-ui/typing'

// Customer order list is always paginated 5 per page.
const ORDERS_PER_PAGE = 5

type OrderTab = 'all' | 'to-pay' | 'to-ship' | 'to-receive' | 'completed' | 'cancelled' | 'return-refund'

const TABS: { id: OrderTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'to-pay', label: 'To Pay' },
  { id: 'to-ship', label: 'To Ship' },
  { id: 'to-receive', label: 'To Receive' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'return-refund', label: 'Return Refund' },
]

const isOrderInTab = (order: PurchasedOrder, tab: OrderTab): boolean => {
  const status = String(order.status || '').toUpperCase()
  const paymentStatus = String(order.payment?.status || '').toUpperCase()
  const fulfillmentStatus = String(order.fulfillment?.status || '').toUpperCase()

  if (tab === 'all') return true
  if (tab === 'to-pay') return paymentStatus !== 'PAYMENT_COMPLETED'
  if (tab === 'to-ship') {
    return ['CREATED', 'PAID', 'STOCK_CONFIRMED', 'READY_FOR_FULFILLMENT'].includes(status)
  }
  if (tab === 'to-receive') {
    return ['IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(status) || ['IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(fulfillmentStatus)
  }
  if (tab === 'completed') return ['DELIVERED', 'COMPLETED'].includes(status)
  if (tab === 'cancelled') return ['CANCELLED', 'FAILED'].includes(status)
  if (tab === 'return-refund') return ['RETURNED', 'REFUNDED'].includes(status)
  return false
}

const formatMoney = (value: number, _currency?: string): string => {
  const amount = Number(value)
  const safe = Number.isFinite(amount) ? amount : 0
  return `Ks ${safe.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

const OrdersPage = () => {
  const [activeTab, setActiveTab] = useState<OrderTab>('all')
  const [search, setSearch] = useState('')
  const [orders, setOrders] = useState<PurchasedOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const userId = useAppSelector((s) => s.auth.user?.id)

  useEffect(() => {
    const fetchOrders = async () => {
      if (!userId) {
        setOrders([])
        return
      }

      try {
        setLoading(true)
        setError(null)
        const result = await ordersApi.myOrders()
        setOrders(result)
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load purchased orders')
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [userId])

  const visibleOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return orders
      .filter((order) => isOrderInTab(order, activeTab))
      .filter((order) => {
        if (!keyword) return true
        const byOrderId = order.orderId.toLowerCase().includes(keyword)
        const byProduct = order.items.some((item) => item.name.toLowerCase().includes(keyword))
        return byOrderId || byProduct
      })
  }, [orders, activeTab, search])

  // Changing tab or search invalidates the current offset.
  useEffect(() => {
    setPage(1)
  }, [activeTab, search])

  const totalPages = Math.max(1, Math.ceil(visibleOrders.length / ORDERS_PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paginatedOrders = visibleOrders.slice(
    (safePage - 1) * ORDERS_PER_PAGE,
    safePage * ORDERS_PER_PAGE,
  )

  return (
    <div className="p-0 md:p-6">
      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white px-4 md:px-6 pt-4">
        <div className="flex flex-wrap gap-4 text-sm">
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative pb-2 cursor-pointer
                  ${isActive ? 'text-emerald-600 font-medium' : 'text-gray-700 hover:text-emerald-600'}
                `}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-emerald-600 rounded-full" />
                )}
              </button>
            )
          })}
        </div>

        {/* Search bar */}
        <div className="mt-4 mb-3">
          <input
            type="text"
            placeholder="You can search by Seller Name, Order ID or Product Name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 text-xs md:text-sm border border-gray-200 rounded-sm focus:outline-none focus:border-emerald-600"
          />
        </div>
      </div>

      {/* Orders list */}
      <div className="px-4 md:px-6 pb-6 space-y-4 mt-2">
        {!userId && (
          <div className="bg-white border border-gray-200 rounded-sm px-4 py-6 text-sm text-gray-600">
            Please log in to see your purchased orders.
          </div>
        )}

        {loading && (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Typing className="w-8" />
          </div>
        )}

        {!!error && (
          <div className="bg-white border border-red-200 rounded-sm px-4 py-6 text-sm text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && userId && visibleOrders.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-sm px-4 py-6 text-sm text-gray-600">
            No purchased orders found.
          </div>
        )}

        {!loading &&
          !error &&
          paginatedOrders.map((order, orderIndex) => (
            <div key={order.orderId || `order-${orderIndex}`} className="bg-white border border-gray-200 rounded-sm">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between text-xs md:text-sm">
                <div className="text-gray-700">
                  Order ID: <span className="font-medium text-gray-900">{order.orderId}</span>
                </div>
                <span className="text-red-500 font-medium uppercase">{order.status}</span>
              </div>

              {order.items.map((item, index) => (
                <div
                  key={item.orderItemId || `${order.orderId}-${item.productId}-${item.sku}-${index}`}
                  className="px-4 py-3 border-b border-gray-100"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex gap-3">
                      <OrderProductImage imageUrl={item.imageUrl} alt={item.name} />
                      <div className="space-y-1 text-xs md:text-sm">
                        <p className="text-gray-800">{item.name}</p>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-gray-500">SKU: {item.sku || '-'}</span>
                          <span className="text-xs text-gray-500">x{item.quantity}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end text-xs md:text-sm">
                      <span className="text-sm text-emerald-600 font-semibold">
                        {formatMoney(item.lineTotal, item.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              <div className="px-4 py-2 border-b border-gray-100 flex justify-end">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">Order Total:</span>
                  <span className="text-emerald-600 font-semibold">
                    {formatMoney(order.totals.total, order.totals.currency)}
                  </span>
                </div>
              </div>

              <div className="px-4 py-2 flex justify-between text-xs text-gray-500">
                <span>Payment: {order.payment?.status || '-'}</span>
                <span>Placed: {order.placedAt ? new Date(order.placedAt).toLocaleString() : '-'}</span>
              </div>

              <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {order.fulfillment?.deliveries?.some(d => d.trackingNumber) ? (
                    <span className="text-emerald-600 font-medium">
                      Tracking: {order.fulfillment.deliveries.find(d => d.trackingNumber)?.trackingNumber}
                    </span>
                  ) : order.fulfillment?.status ? (
                    <span>Fulfillment: {order.fulfillment.status}</span>
                  ) : null}
                </div>
                <Link
                  to={`/account/orders/${order.orderId}`}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Track Order →
                </Link>
              </div>
            </div>
          ))}

        {!loading && !error && visibleOrders.length > ORDERS_PER_PAGE && (
          <DataTablePagination
            page={safePage}
            totalPages={totalPages}
            rowsPerPage={ORDERS_PER_PAGE}
            totalItems={visibleOrders.length}
            itemLabel="orders"
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  )
}

export default OrdersPage


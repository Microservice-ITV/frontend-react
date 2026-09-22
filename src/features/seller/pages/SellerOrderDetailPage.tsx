import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import { fetchSellerOrdersByShop } from '../store'
import {
  fetchOrdersAcrossOwnedShops,
  sellerOrderApi,
  type SellerOrder,
} from '../api/sellerOrderApi'
import { Truck, MapPin, Package, CreditCard, Mail } from 'lucide-react'

const STATUS_STEPS = [
  { key: 'READY_FOR_FULFILLMENT', label: 'Ready to Ship' },
  { key: 'SHIPPED', label: 'Shipped' },
  { key: 'IN_TRANSIT', label: 'In Transit' },
  { key: 'DELIVERED', label: 'Delivered' },
] as const

const STATUS_ORDER = STATUS_STEPS.map((s) => s.key)

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

function getStepIndex(status: string): number {
  const upper = (status || '').toUpperCase()
  const idx = STATUS_ORDER.indexOf(upper as (typeof STATUS_ORDER)[number])
  if (idx !== -1) return idx
  if (['COMPLETED'].includes(upper)) return STATUS_ORDER.length - 1
  return -1
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
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const SellerOrderDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { openModal } = useGlobalModal()
  const authUser = useAppSelector((state) => state.auth.user)
  const activeShopId = authUser?.active_shop_id ?? null
  const authUserId = authUser?.id ?? null

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [order, setOrder] = useState<SellerOrder | null>(null)

  useEffect(() => {
    if (!id) {
      setLoadError('Invalid order id.')
      setLoading(false)
      return
    }

    let cancelled = false

    const fetchOrder = async () => {
      setLoading(true)
      setLoadError('')
      try {
        const orders = await fetchOrdersAcrossOwnedShops(authUserId, activeShopId)
        const found = orders.find((o) => o.orderId === id)
        if (!cancelled) {
          setOrder(found ?? null)
          if (!found) setLoadError('Order not found.')
        }
      } catch (error: any) {
        if (!cancelled) {
          setLoadError(error?.message ?? 'Failed to load order details.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetchOrder()
    return () => { cancelled = true }
  }, [id, activeShopId, authUserId])

  const handleShipOrder = () => {
    if (!order) return

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
            const updated = await fetchOrdersAcrossOwnedShops(authUserId, activeShopId)
            const found = updated.find((o) => o.orderId === id)
            if (found) setOrder(found)
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

  const statusUpper = (order?.status || '').toUpperCase()
  const currentStep = order ? getStepIndex(order.status) : -1
  const isCancelled = ['CANCELLED', 'FAILED', 'FAILED_PAYMENT', 'EXPIRED'].includes(statusUpper)
  const canShip = statusUpper === 'READY_FOR_FULFILLMENT'
  const filteredItems = order?.items.filter(
    (item) => !activeShopId || (item.shopId === activeShopId),
  )

  const shopItems = filteredItems?.length > 0
    ? filteredItems
    : order?.items ?? []

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="text-xs text-slate-500">
        <Link to="/seller/overview" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <Link to="/seller/orders" className="hover:text-slate-700">
          Orders
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">{id}</span>
      </nav>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading order details...
        </div>
      )}

      {!loading && loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
          {loadError}
        </div>
      )}

      {!loading && !loadError && order && (
        <>
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Order {order.orderId}
              </h1>
              <p className="mt-0.5 text-sm text-slate-600">
                Placed {formatDate(order.placedAt || order.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[statusUpper] || 'bg-slate-100 text-slate-600'}`}
              >
                {STATUS_LABELS[statusUpper] || statusUpper}
              </span>
              {canShip && (
                <button
                  type="button"
                  onClick={handleShipOrder}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 cursor-pointer"
                >
                  <Truck size={16} />
                  Ship Order
                </button>
              )}
            </div>
          </div>

          {/* Status timeline */}
          {!isCancelled && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="text-base font-bold text-slate-900">Order Progress</h2>
              <div className="flex items-center gap-0 mt-5">
                {STATUS_STEPS.map((step, i) => {
                  const isActive = i <= currentStep
                  const isCurrent = i === currentStep
                  return (
                    <div key={step.key} className="flex-1 flex flex-col items-center relative">
                      {i > 0 && (
                        <div
                          className="absolute top-[11px] right-1/2 w-full h-0.5 -z-10"
                          style={{ background: i <= currentStep ? '#059669' : '#e2e8f0' }}
                        />
                      )}
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-all ${
                          isCurrent
                            ? 'border-emerald-600 bg-emerald-600 text-white scale-110'
                            : isActive
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-slate-300 bg-white text-slate-400'
                        }`}
                      >
                        {isActive && !isCurrent && (
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {isCurrent && <span className="w-2 h-2 bg-white rounded-full" />}
                        {!isActive && <span>{i + 1}</span>}
                      </div>
                      <span className={`mt-2 text-xs text-center leading-tight ${
                        isActive ? 'text-emerald-700 font-medium' : 'text-slate-400'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            {/* Main content */}
            <div className="space-y-6">
              {/* Order items */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Package size={18} />
                  Order Items
                </h2>
                <div className="mt-4 divide-y divide-slate-100">
                  {shopItems.map((item) => (
                    <div key={`${item.productId}-${item.sku}`} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-14 h-14 object-cover rounded-lg" />
                      ) : (
                        <div className="w-14 h-14 bg-slate-100 rounded-lg flex items-center justify-center">
                          <Package size={20} className="text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">SKU: {item.sku}</p>
                        <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-sm font-semibold text-slate-900 shrink-0">
                        {formatMoney(item.lineTotal, item.currency)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-between items-center border-t border-slate-200 pt-4">
                  <span className="text-sm text-slate-600">Order Total</span>
                  <span className="text-lg font-bold text-slate-900">
                    {formatMoney(order.totals.total, order.totals.currency)}
                  </span>
                </div>
              </section>

              {/* Shipment tracking */}
              {order.fulfillment?.deliveries && order.fulfillment.deliveries.length > 0 && (
                <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Truck size={18} />
                    Shipment Tracking
                  </h2>
                  <div className="mt-4 space-y-4">
                    {order.fulfillment.deliveries.map((delivery) => (
                      <div key={delivery.deliveryId} className="rounded-lg border border-slate-200 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-900">
                            {delivery.deliveryNumber || delivery.deliveryId}
                          </span>
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            delivery.status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-700'
                              : delivery.status === 'IN_TRANSIT'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-slate-100 text-slate-600'
                          }`}>
                            {delivery.status}
                          </span>
                        </div>
                        {delivery.trackingNumber && (
                          <p className="text-xs text-slate-600">Tracking: {delivery.trackingNumber}</p>
                        )}
                        {delivery.courier?.name && (
                          <p className="text-xs text-slate-600">Courier: {delivery.courier.name}</p>
                        )}
                        {delivery.trackingUrl && (
                          <a
                            href={delivery.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                          >
                            Track on courier website →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Payment */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard size={18} />
                  Payment
                </h2>
                <div className="mt-4 divide-y divide-slate-200">
                  <div className="flex items-center justify-between py-3">
                    <p className="text-sm text-slate-500">Status</p>
                    <span className="text-sm font-medium text-slate-900">{order.payment?.status || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <p className="text-sm text-slate-500">Transaction</p>
                    <span className="text-xs font-mono text-slate-700">{order.payment?.transactionId || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <p className="text-sm text-slate-500">Total</p>
                    <p className="text-lg font-bold tracking-tight text-slate-900">
                      {formatMoney(order.totals.total, order.totals.currency)}
                    </p>
                  </div>
                </div>
              </section>

              {/* Delivery address */}
              {order.deliveryAddress && (
                <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <MapPin size={18} />
                    Delivery Address
                  </h2>
                  <div className="mt-4 text-sm text-slate-700 space-y-0.5">
                    <p className="font-medium text-slate-900">{order.deliveryAddress.recipientName || '—'}</p>
                    {order.deliveryAddress.recipientPhone && (
                      <p className="text-slate-500">{order.deliveryAddress.recipientPhone}</p>
                    )}
                    {order.deliveryAddress.email && (
                      <p className="text-slate-500 flex items-center gap-1.5">
                        <Mail size={14} className="text-slate-400 shrink-0" />
                        {order.deliveryAddress.email}
                      </p>
                    )}
                    <p className="mt-1">
                      {order.deliveryAddress.addressLine1 && (
                        <span>{order.deliveryAddress.addressLine1}</span>
                      )}
                      {order.deliveryAddress.addressLine2 && (
                        <span>, {order.deliveryAddress.addressLine2}</span>
                      )}
                    </p>
                    <p>
                      {[order.deliveryAddress.ward, order.deliveryAddress.district, order.deliveryAddress.city, order.deliveryAddress.state]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                    {order.deliveryAddress.postalCode && (
                      <p>{order.deliveryAddress.postalCode}</p>
                    )}
                    {order.deliveryAddress.country && (
                      <p>{order.deliveryAddress.country}</p>
                    )}
                    {order.deliveryAddress.deliveryNote && (
                      <p className="text-xs text-slate-500 italic mt-2">Note: {order.deliveryAddress.deliveryNote}</p>
                    )}
                  </div>
                </section>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default SellerOrderDetailPage

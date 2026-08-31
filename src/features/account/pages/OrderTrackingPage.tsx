import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ecommerceReadClient } from '@/lib/api/ecommerceReadClient'
import { deliveryApi } from '@/lib/api/deliveryClient'
import type { PurchasedOrder } from '../types/orderTypes'

const ORDER_BY_ID_QUERY = `
  query OrderById($id: ID!) {
    orderById(id: $id) {
      orderId
      status
      createdAt
      placedAt
      items {
        productId
        sku
        name
        imageUrl
        quantity
        unitPrice
        lineTotal
        currency
      }
      totals {
        subtotal
        total
        currency
      }
      payment {
        status
        transactionId
      }
      deliveryAddress {
        recipientName
        recipientPhone
        country
        state
        city
        district
        ward
        addressLine1
        addressLine2
        postalCode
        deliveryNote
      }
      fulfillment {
        status
        deliveries {
          deliveryId
          deliveryNumber
          status
          trackingNumber
          trackingUrl
          estimatedDeliveryDate
          courier {
            code
            name
            phone
          }
          items {
            productId
            sku
            quantity
            status
          }
        }
      }
    }
  }
`

const STATUS_STEPS = [
  { key: 'PAID', label: 'Paid' },
  { key: 'READY_FOR_FULFILLMENT', label: 'Ready to Ship' },
  { key: 'SHIPPED', label: 'Shipped' },
  { key: 'IN_TRANSIT', label: 'In Transit' },
  { key: 'DELIVERED', label: 'Delivered' },
] as const

const STATUS_ORDER = STATUS_STEPS.map((s) => s.key)

function getStepIndex(status: string): number {
  const upper = (status || '').toUpperCase()
  const idx = STATUS_ORDER.indexOf(upper as (typeof STATUS_ORDER)[number])
  if (idx !== -1) return idx
  if (['COMPLETED'].includes(upper)) return STATUS_ORDER.length - 1
  if (['CANCELLED', 'FAILED', 'FAILED_PAYMENT', 'EXPIRED', 'RETURNED', 'REFUNDED'].includes(upper)) return -1
  return 0
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

const OrderTrackingPage = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const [order, setOrder] = useState<PurchasedOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) return

    let cancelled = false

    const fetchOrder = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await ecommerceReadClient.post<{
          data?: { orderById?: PurchasedOrder }
          errors?: { message?: string }[]
        }>('', {
          query: ORDER_BY_ID_QUERY,
          variables: { id: orderId },
        })

        if (cancelled) return

        if (response.data.errors?.length) {
          setError(response.data.errors[0]?.message ?? 'Failed to load order')
          return
        }

        setOrder(response.data.data?.orderById ?? null)
        if (!response.data.data?.orderById) {
          setError('Order not found')
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message ?? 'Failed to load order')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetchOrder()
    return () => { cancelled = true }
  }, [orderId])

  const currentStep = order ? getStepIndex(order.status) : -1
  const isCancelled = order
    ? ['CANCELLED', 'FAILED', 'FAILED_PAYMENT', 'EXPIRED', 'RETURNED', 'REFUNDED'].includes(order.status?.toUpperCase())
    : false

  const activeDelivery = order?.fulfillment?.deliveries?.find(
    (d) => !['DELIVERED', 'CANCELLED'].includes(d.status?.toUpperCase()),
  )

  const orderStatusUpper = (order?.status || '').toUpperCase()
  const canConfirmReceipt =
    order !== null &&
    !isCancelled &&
    orderStatusUpper !== 'DELIVERED' &&
    ['IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(
      activeDelivery?.status?.toUpperCase() ?? '',
    )

  const handleConfirmReceipt = async () => {
    if (!activeDelivery?.deliveryId) return
    setConfirming(true)
    setConfirmError(null)
    try {
      await deliveryApi.confirmReceipt(activeDelivery.deliveryId)
      // Refresh the order so the timeline/status reflects DELIVERED.
      const response = await ecommerceReadClient.post<{
        data?: { orderById?: PurchasedOrder }
        errors?: { message?: string }[]
      }>('', {
        query: ORDER_BY_ID_QUERY,
        variables: { id: orderId },
      })
      if (response.data.errors?.length) {
        setConfirmError(response.data.errors[0]?.message ?? 'Failed to refresh order')
        return
      }
      setOrder(response.data.data?.orderById ?? null)
    } catch (err: any) {
      const message =
        err?.response?.data?.message ??
        err?.message ??
        'Failed to confirm receipt. Please try again.'
      setConfirmError(message)
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="max-w-[900px] mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <Link to="/account/orders" className="hover:text-emerald-600">
          My Orders
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Order #{orderId}</span>
      </div>

      {loading && (
        <div className="bg-white border border-gray-200 rounded-sm px-4 py-10 text-sm text-gray-600 text-center">
          Loading order details...
        </div>
      )}

      {!!error && (
        <div className="bg-white border border-red-200 rounded-sm px-4 py-6 text-sm text-red-600">
          {error}
        </div>
      )}

      {!loading && !error && order && (
        <>
          {/* Status header */}
          <div className="bg-white border border-gray-200 rounded-sm px-5 py-5">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-lg font-semibold text-gray-900">Order Status</h1>
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                isCancelled
                  ? 'bg-red-50 text-red-600'
                  : currentStep >= STATUS_ORDER.length - 1
                    ? 'bg-green-50 text-green-700'
                    : 'bg-emerald-50 text-emerald-700'
              }`}>
                {(order.status || '').replace(/_/g, ' ')}
              </span>
            </div>

            {/* Timeline */}
            {!isCancelled && (
              <div className="flex items-center gap-0 mt-4">
                {STATUS_STEPS.map((step, i) => {
                  const isActive = i <= currentStep
                  const isCurrent = i === currentStep
                  return (
                    <div key={step.key} className="flex-1 flex flex-col items-center relative">
                      {/* Connector line */}
                      {i > 0 && (
                        <div className="absolute top-[11px] right-1/2 w-full h-0.5 -z-10" style={{ background: i <= currentStep ? '#059669' : '#e5e7eb' }} />
                      )}
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-all ${
                          isCurrent
                            ? 'border-emerald-600 bg-emerald-600 text-white scale-110'
                            : isActive
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-gray-300 bg-white text-gray-400'
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
                        isActive ? 'text-emerald-700 font-medium' : 'text-gray-400'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Tracking info */}
          {activeDelivery && (
            <div className="bg-white border border-gray-200 rounded-sm px-5 py-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Shipment Tracking</h2>
              <div className="space-y-2 text-sm">
                {activeDelivery.trackingNumber && (
                  <div className="flex gap-2">
                    <span className="text-gray-500 w-28 shrink-0">Tracking No.</span>
                    <span className="text-gray-900 font-medium">{activeDelivery.trackingNumber}</span>
                  </div>
                )}
                {activeDelivery.courier?.name && (
                  <div className="flex gap-2">
                    <span className="text-gray-500 w-28 shrink-0">Courier</span>
                    <span className="text-gray-900">{activeDelivery.courier.name}</span>
                  </div>
                )}
                {activeDelivery.estimatedDeliveryDate && (
                  <div className="flex gap-2">
                    <span className="text-gray-500 w-28 shrink-0">Est. Delivery</span>
                    <span className="text-gray-900">
                      {new Date(activeDelivery.estimatedDeliveryDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {activeDelivery.trackingUrl && (
                  <div className="mt-3">
                    <a
                      href={activeDelivery.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                    >
                      Track on courier website
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z" />
                      </svg>
                    </a>
                  </div>
                )}
                {!activeDelivery.trackingNumber && !activeDelivery.trackingUrl && (
                  <p className="text-gray-500 text-xs">Tracking details will appear once the shipment is dispatched.</p>
                )}

                {canConfirmReceipt && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={handleConfirmReceipt}
                      disabled={confirming}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-sm bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {confirming ? 'Confirming...' : 'Confirm Receipt'}
                    </button>
                    <p className="mt-2 text-xs text-gray-400">
                      Received your package? Confirm to complete the order and release payment to the seller.
                    </p>
                  </div>
                )}
                {confirmError && (
                  <p className="mt-3 text-xs text-red-500">{confirmError}</p>
                )}
              </div>
            </div>
          )}

          {/* Delivery address */}
          {order.deliveryAddress && (
            <div className="bg-white border border-gray-200 rounded-sm px-5 py-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Delivery Address</h2>
              <div className="text-sm text-gray-700 space-y-0.5">
                <p className="font-medium">{order.deliveryAddress.recipientName}</p>
                {order.deliveryAddress.addressLine1 && <p>{order.deliveryAddress.addressLine1}</p>}
                {order.deliveryAddress.addressLine2 && <p>{order.deliveryAddress.addressLine2}</p>}
                <p>
                  {[order.deliveryAddress.ward, order.deliveryAddress.district, order.deliveryAddress.city, order.deliveryAddress.state]
                    .filter(Boolean)
                    .join(', ')}
                </p>
                {order.deliveryAddress.postalCode && <p>{order.deliveryAddress.postalCode}</p>}
                {order.deliveryAddress.deliveryNote && (
                  <p className="text-xs text-gray-500 italic mt-1">Note: {order.deliveryAddress.deliveryNote}</p>
                )}
              </div>
            </div>
          )}

          {/* Order items */}
          <div className="bg-white border border-gray-200 rounded-sm">
            <div className="px-5 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Order Items</h2>
            </div>
            {order.items.map((item) => (
              <div key={`${item.productId}-${item.sku}`} className="px-5 py-3 border-b border-gray-100 last:border-0">
                <div className="flex gap-3">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-14 h-14 object-cover rounded-sm" />
                  ) : (
                    <div className="w-14 h-14 bg-gray-100 rounded-sm" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">SKU: {item.sku} &middot; x{item.quantity}</p>
                  </div>
                  <div className="text-sm text-emerald-600 font-semibold shrink-0">
                    {formatMoney(item.lineTotal, item.currency)}
                  </div>
                </div>
              </div>
            ))}
            <div className="px-5 py-3 flex justify-between items-center bg-gray-50">
              <span className="text-sm text-gray-600">Total</span>
              <span className="text-base font-semibold text-emerald-600">
                {formatMoney(order.totals.total, order.totals.currency)}
              </span>
            </div>
          </div>

          {/* Payment info */}
          {order.payment && (
            <div className="bg-white border border-gray-200 rounded-sm px-5 py-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Payment</h2>
              <div className="text-sm space-y-1">
                <div className="flex gap-2">
                  <span className="text-gray-500 w-28 shrink-0">Status</span>
                  <span className="text-gray-900">{order.payment.status}</span>
                </div>
                {order.payment.transactionId && (
                  <div className="flex gap-2">
                    <span className="text-gray-500 w-28 shrink-0">Transaction</span>
                    <span className="text-gray-900 font-mono text-xs">{order.payment.transactionId}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex gap-3 pb-6">
            <Link
              to="/account/orders"
              className="px-6 py-2.5 border border-gray-300 rounded-sm text-sm text-gray-700 hover:bg-gray-50"
            >
              Back to Orders
            </Link>
            <Link
              to="/"
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-sm text-sm font-medium hover:bg-emerald-700"
            >
              Continue Shopping
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

export default OrderTrackingPage

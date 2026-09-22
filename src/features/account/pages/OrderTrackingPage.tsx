import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ecommerceReadClient } from '@/lib/api/ecommerceReadClient'
import { deliveryApi } from '@/lib/api/deliveryClient'
import { createPartialInvoice } from '@/lib/api/invoiceClient'
import type { PurchasedOrder, PurchasedOrderItem, PurchasedOrderTotals } from '../types/orderTypes'

const ORDER_BY_ID_QUERY = `
  query OrderById($id: ID!) {
    orderById(id: $id) {
      orderId
      status
      createdAt
      placedAt
      items {
        orderItemId
        productId
        sku
        name
        imageUrl
        quantity
        unitPrice
        lineTotal
        currency
        shopId
      }
      totals {
        subtotal
        discount
        shipping
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

const TERMINAL_STATUSES = [
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
  'FAILED',
  'FAILED_PAYMENT',
  'EXPIRED',
  'RETURNED',
  'REFUNDED',
] as const

function getStepIndex(status: string): number {
  const upper = (status || '').toUpperCase()
  const idx = STATUS_ORDER.indexOf(upper as (typeof STATUS_ORDER)[number])
  if (idx !== -1) return idx
  if (['COMPLETED'].includes(upper)) return STATUS_ORDER.length - 1
  if (TERMINAL_STATUSES.includes(upper as (typeof TERMINAL_STATUSES)[number])) return -1
  return 0
}

function isTerminal(status: string): boolean {
  return TERMINAL_STATUSES.includes(
    (status || '').toUpperCase() as (typeof TERMINAL_STATUSES)[number],
  )
}

const formatMoney = (value: number, currency: string): string => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
    }).format(Number.isFinite(value) ? value : 0)
  } catch {
    return `${currency} ${(Number.isFinite(value) ? value : 0).toFixed(2)}`
  }
}

const toSafeAmount = (value: unknown): number => {
  const amount = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(amount) ? amount : 0
}

const normalizeOrderTotals = (totals: PurchasedOrderTotals | null | undefined): PurchasedOrderTotals => {
  const subtotal = toSafeAmount(totals?.subtotal)
  const discount = toSafeAmount(totals?.discount)
  const shipping = toSafeAmount(totals?.shipping)
  const total = toSafeAmount(
    totals?.total ?? Math.max(0, subtotal + shipping - discount),
  )

  return {
    subtotal,
    discount,
    shipping,
    total,
    currency: totals?.currency?.trim() || 'USD',
  }
}

const OrderTrackingPage = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const [order, setOrder] = useState<PurchasedOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  const [invoiceQuantities, setInvoiceQuantities] = useState<Record<string, number>>({})
  const [partialInvoiceIdempotencyKey, setPartialInvoiceIdempotencyKey] = useState<string | null>(null)
  const [partialInvoiceSubmitting, setPartialInvoiceSubmitting] = useState(false)
  const [partialInvoiceError, setPartialInvoiceError] = useState<string | null>(null)
  const [partialInvoiceSuccess, setPartialInvoiceSuccess] = useState<string | null>(null)

  const orderRef = useRef<PurchasedOrder | null>(null)
  orderRef.current = order

  useEffect(() => {
    if (!orderId) return

    let cancelled = false

    const fetchOrder = async () => {
      try {
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

    // Poll the read model until the order reaches a terminal state, so the
    // status updates shortly after the payment completes and fulfillment
    // advances (the read model is eventually consistent).
    const POLL_INTERVAL_MS = 3000
    const intervalId = window.setInterval(() => {
      if (isTerminal(orderRef.current?.status ?? '')) {
        window.clearInterval(intervalId)
        return
      }
      void fetchOrder()
    }, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [orderId])

  const currentStep = order ? getStepIndex(order.status) : -1
  const isCancelled = order
    ? ['CANCELLED', 'FAILED', 'FAILED_PAYMENT', 'EXPIRED', 'RETURNED', 'REFUNDED'].includes(order.status?.toUpperCase())
    : false

  const selectedItems = useMemo(
    () => order?.items.filter((item) => item.orderItemId && selectedItemIds.includes(item.orderItemId)) ?? [],
    [order, selectedItemIds],
  )

  const selectedShopIds = useMemo(
    () => [...new Set(selectedItems.map((item) => item.shopId).filter(Boolean))],
    [selectedItems],
  )

  const hasValidInvoiceQuantities = selectedItems.every((item) => {
    const quantity = invoiceQuantities[item.orderItemId as string]
    return Number.isInteger(quantity) && quantity >= 1 && quantity <= item.quantity
  })
  const canSubmitPartialInvoice = selectedItems.length > 0 && selectedShopIds.length === 1 && hasValidInvoiceQuantities

  const orderTotals = useMemo(
    () => normalizeOrderTotals(order?.totals),
    [order?.totals],
  )

  const activeDelivery = order?.fulfillment?.deliveries?.find(
    (d) => !['DELIVERED', 'CANCELLED'].includes(d.status?.toUpperCase()),
  )
  
  const orderStatusUpper = (order?.status || '').toUpperCase()
  const canConfirmReceipt =
    order !== null &&
    !isCancelled &&
    orderStatusUpper !== 'DELIVERED' &&
    ['IN_TRANSIT','CREATED','OUT_FOR_DELIVERY'].includes(
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

  const togglePartialInvoiceItem = (item: PurchasedOrderItem) => {
    if (!item.orderItemId) return

    const itemKey = item.orderItemId
    setSelectedItemIds((current) =>
      current.includes(itemKey)
        ? current.filter((id) => id !== itemKey)
        : [...current, itemKey],
    )
    setInvoiceQuantities((current) => ({
      ...current,
      [itemKey]: current[itemKey] ?? item.quantity,
    }))
    setPartialInvoiceIdempotencyKey(null)
    setPartialInvoiceError(null)
    setPartialInvoiceSuccess(null)
  }

  const updateInvoiceQuantity = (item: PurchasedOrderItem, value: string) => {
    if (!item.orderItemId) return

    setInvoiceQuantities((current) => ({
      ...current,
      [item.orderItemId as string]: Number(value),
    }))
    setPartialInvoiceIdempotencyKey(null)
    setPartialInvoiceError(null)
    setPartialInvoiceSuccess(null)
  }

  const handleCreatePartialInvoice = async () => {
    if (!order || !orderId) {
      return
    }

    if (selectedItems.length === 0) {
      setPartialInvoiceError('Please select at least one item.')
      setPartialInvoiceSuccess(null)
      return
    }

    if (selectedShopIds.length !== 1) {
      setPartialInvoiceError('Items from different shops must be invoiced separately.')
      setPartialInvoiceSuccess(null)
      return
    }

    if (!hasValidInvoiceQuantities) {
      setPartialInvoiceError('Invoice quantity must be between 1 and the ordered quantity.')
      setPartialInvoiceSuccess(null)
      return
    }

    const selectedOrderItems = selectedItems.map((item) => ({
      orderItemId: item.orderItemId as string,
      quantity: invoiceQuantities[item.orderItemId as string],
    }))

    const idempotencyKey = partialInvoiceIdempotencyKey ?? (
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `partial-invoice-${Date.now()}-${Math.random().toString(16).slice(2)}`
    )
    if (!partialInvoiceIdempotencyKey) {
      setPartialInvoiceIdempotencyKey(idempotencyKey)
    }

    setPartialInvoiceSubmitting(true)
    setPartialInvoiceError(null)
    setPartialInvoiceSuccess(null)

    try {
      await createPartialInvoice({
        orderId,
        items: selectedOrderItems,
        customerName: order.deliveryAddress?.recipientName || undefined,
        customerEmail: order.deliveryAddress?.email || undefined,
        paymentMethod: order.payment?.status ? 'CARD' : 'CASH',
      }, idempotencyKey)

      setSelectedItemIds([])
      setInvoiceQuantities({})
      setPartialInvoiceIdempotencyKey(null)
      setPartialInvoiceSuccess('Partial invoice created successfully.')
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Unable to create the partial invoice right now.'
      setPartialInvoiceError(message)
    } finally {
      setPartialInvoiceSubmitting(false)
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
          <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Order Items</h2>
              <p className="mt-0.5 text-xs text-gray-500">
                {order.items.length} item{order.items.length === 1 ? '' : 's'} in this order
              </p>
            </div>

            <div className="divide-y divide-gray-100">
              {order.items.map((item, index) => {
                const itemKey = item.orderItemId ?? `unavailable-${index}`
                const isChecked = Boolean(item.orderItemId && selectedItemIds.includes(item.orderItemId))
                return (
                  <div key={itemKey} className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePartialInvoiceItem(item)}
                        disabled={!item.orderItemId}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="flex-1">
                        <OrderItemRow item={item} />
                        {!item.orderItemId && (
                          <p className="mt-2 text-xs text-amber-700">
                            This item cannot be invoiced because its order item ID is unavailable.
                          </p>
                        )}
                        {item.orderItemId && isChecked && (
                          <label className="mt-3 flex items-center gap-2 text-xs text-gray-600">
                            <span>Invoice quantity:</span>
                            <input
                              type="number"
                              min={1}
                              max={item.quantity}
                              step={1}
                              value={invoiceQuantities[item.orderItemId] ?? item.quantity}
                              onChange={(event) => updateInvoiceQuantity(item, event.target.value)}
                              className="w-20 rounded-sm border border-gray-300 px-2 py-1 text-sm text-gray-900"
                            />
                            <span>of {item.quantity}</span>
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Partial invoice</p>
                  <p className="text-xs text-gray-500">Select the items to invoice together. Mixed-shop selections are blocked.</p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleCreatePartialInvoice()}
                  disabled={partialInvoiceSubmitting || !canSubmitPartialInvoice}
                  className="inline-flex items-center justify-center rounded-sm bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {partialInvoiceSubmitting ? 'Creating...' : 'Create partial invoice'}
                </button>
              </div>
              {selectedItems.length === 0 && (
                <p className="mt-3 text-xs text-gray-500">Please select at least one item.</p>
              )}
              {selectedItems.length > 0 && !hasValidInvoiceQuantities && (
                <p className="mt-3 text-xs text-red-600">
                  Invoice quantity must be between 1 and the ordered quantity.
                </p>
              )}
              {partialInvoiceError && <p className="mt-3 text-xs text-red-600">{partialInvoiceError}</p>}
              {partialInvoiceSuccess && <p className="mt-3 text-xs text-emerald-600">{partialInvoiceSuccess}</p>}
            </div>

            <OrderPaymentSummary totals={orderTotals} />
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

const OrderItemRow = ({ item }: { item: PurchasedOrderItem }) => {
  const currency = item.currency || 'USD'
  const unitPrice = toSafeAmount(item.unitPrice)
  const lineTotal = toSafeAmount(item.lineTotal)
  const quantity = toSafeAmount(item.quantity)

  return (
    <div className="px-5 py-4">
      <div className="flex gap-3">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-sm border border-gray-100" />
        ) : (
          <div className="w-16 h-16 bg-gray-100 rounded-sm border border-gray-100" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
          <p className="mt-1 text-xs text-gray-500">
            SKU: {item.sku || '—'} · Qty {quantity}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {formatMoney(unitPrice, currency)} each
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold text-emerald-600">{formatMoney(lineTotal, currency)}</p>
        </div>
      </div>
    </div>
  )
}

const OrderPaymentSummary = ({ totals }: { totals: PurchasedOrderTotals }) => {
  const { subtotal, discount, shipping, total, currency } = totals

  return (
    <div className="border-t border-dashed border-black/10 bg-[#fffefb] px-5 py-5">
      <div className="text-sm text-gray-700">
        <div className="mb-3 flex justify-between">
          <span className="text-gray-600">Merchandise Subtotal</span>
          <span className="text-gray-900">{formatMoney(subtotal, currency)}</span>
        </div>

        <div className="mb-3 flex justify-between">
          <span className="text-gray-600">Shipping Subtotal</span>
          <span className="text-gray-900">{formatMoney(shipping, currency)}</span>
        </div>

        <div className="mb-4 space-y-2 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-800">Your savings</p>
              <p className="mt-0.5 text-xs text-emerald-700">Promotions applied to this order</p>
            </div>
            <span className="text-lg font-bold text-emerald-700">
              -{formatMoney(discount, currency)}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-emerald-100 pt-2 text-xs">
            <span className="text-gray-600">Promotion discount</span>
            <span className="font-semibold text-emerald-700">-{formatMoney(discount, currency)}</span>
          </div>
        </div>

        <div className="flex items-end justify-between border-t border-black/10 pt-4">
          <span className="font-medium text-gray-900">Total Payment:</span>
          <span className="text-3xl font-semibold text-emerald-600">
            {formatMoney(total, currency)}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-end gap-1 text-xs text-gray-500">
        <span>GST included, where applicable.</span>
      </div>
    </div>
  )
}

export default OrderTrackingPage

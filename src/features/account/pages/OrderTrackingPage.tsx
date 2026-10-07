import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ecommerceReadClient } from '@/lib/api/ecommerceReadClient'
import { productClient } from '@/lib/api/productClient'
import { deliveryApi } from '@/lib/api/deliveryClient'
import { createPartialInvoice } from '@/lib/api/invoiceClient'
import DataTablePagination from '@/components/ui/DataTablePagination'
import { Package, Store, Copy, Check } from 'lucide-react'
import OrderProductImage from '../components/OrderProductImage'
import { Typing } from '@/components/loading-ui/typing'
import type {
  PurchasedOrder,
  PurchasedOrderDelivery,
  PurchasedOrderItem,
  PurchasedOrderPromotion,
  PurchasedOrderTotals,
} from '../types/orderTypes'

// Customer-facing order item list is always paginated 5 per page.
const ITEMS_PER_PAGE = 5

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
        variantId
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
        bundleDiscount
        shipping
        total
        currency
      }
      payment {
        status
        transactionId
      }
      shopBreakdown {
        shopOrderId
        shopId
        subtotal
        discount
        bundleDiscount
        shipping
        total
        currency
        status
        courierName
      }
      promotions {
        promotionId
        rewardId
        promotionName
        shopId
        discountType
        fundedBy
        amount
      }
      deliveryAddress {
        recipientName
        recipientPhone
        email
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
            variantId
            shopId
            sku
            quantity
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

const STATUS_LABELS: Record<string, string> = {
  PAID: 'Paid',
  CONFIRMED: 'Confirmed',
  READY_FOR_FULFILLMENT: 'Ready to Ship',
  PARTIALLY_FULFILLED: 'Partially Shipped',
  SHIPPED: 'Shipped',
  FULFILLED: 'In Transit',
  IN_TRANSIT: 'In Transit',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  FAILED: 'Failed',
  FAILED_PAYMENT: 'Payment Failed',
}

/** Chip palettes kept identical to the seller order pages. */
const ENTITY_STATUS_STYLES: Record<string, string> = {
  PAID: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-slate-100 text-slate-600',
  PENDING: 'bg-slate-100 text-slate-600',
  CREATED: 'bg-slate-100 text-slate-600',
  READY_FOR_FULFILLMENT: 'bg-violet-100 text-violet-700',
  PARTIALLY_FULFILLED: 'bg-orange-100 text-orange-700',
  SHIPPED: 'bg-sky-100 text-sky-700',
  FULFILLED: 'bg-sky-100 text-sky-700',
  IN_TRANSIT: 'bg-blue-100 text-blue-700',
  OUT_FOR_DELIVERY: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
  FAILED: 'bg-red-100 text-red-700',
}

function getStepIndex(status: string): number {
  const upper = (status || '').toUpperCase()
  const idx = STATUS_ORDER.indexOf(upper as (typeof STATUS_ORDER)[number])
  if (idx !== -1) return idx
  // PARTIALLY_FULFILLED: some shops shipped → show "Shipped" as current.
  if (upper === 'PARTIALLY_FULFILLED') return STATUS_ORDER.indexOf('SHIPPED')
  // FULFILLED: every shop shipped → the order is on its way.
  if (upper === 'FULFILLED') return STATUS_ORDER.indexOf('IN_TRANSIT')
  if (['COMPLETED'].includes(upper)) return STATUS_ORDER.length - 1
  if (TERMINAL_STATUSES.includes(upper as (typeof TERMINAL_STATUSES)[number])) return -1
  return 0
}

function isTerminal(status: string): boolean {
  return TERMINAL_STATUSES.includes(
    (status || '').toUpperCase() as (typeof TERMINAL_STATUSES)[number],
  )
}

const formatMoney = (value: number, _currency?: string): string => {
  const amount = Number(value)
  const safe = Number.isFinite(amount) ? amount : 0
  return `Ks ${safe.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
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

const formatDate = (value?: string | null): string => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Match a package line back to the ordered item it shipped. */
const matchOrderItem = (
  delivery: { productId?: string | null; variantId?: string | null; shopId?: string | null },
  items: PurchasedOrderItem[],
): PurchasedOrderItem | undefined =>
  items.find(
    (item) =>
      item.productId === delivery.productId &&
      (!item.variantId || !delivery.variantId || item.variantId === delivery.variantId) &&
      (!item.shopId || !delivery.shopId || item.shopId === delivery.shopId),
  )

const StatusChip = ({ status }: { status?: string | null }) => {
  const upper = (status || '').toUpperCase()
  const label =
    STATUS_LABELS[upper] || (upper ? upper.replace(/_/g, ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase()) : '—')
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
        ENTITY_STATUS_STYLES[upper] ?? 'bg-slate-100 text-slate-600'
      }`}
    >
      {label}
    </span>
  )
}

const OrderTrackingPage = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const [order, setOrder] = useState<PurchasedOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [shopNames, setShopNames] = useState<Record<string, string>>({})

  // Items pagination (fixed page size)
  const [itemsPage, setItemsPage] = useState(1)

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

  // Reset pagination when switching orders.
  useEffect(() => {
    setItemsPage(1)
  }, [orderId])

  const orderShopIds = useMemo(
    () => [...new Set((order?.items ?? []).map((item) => item.shopId).filter(Boolean))] as string[],
    [order?.items],
  )

  // Resolve shop display names for the shops this order came from
  // (best-effort; falls back to short ids).
  useEffect(() => {
    const missing = orderShopIds.filter((id) => !shopNames[id])
    if (missing.length === 0) return
    let cancelled = false
    void Promise.allSettled(
      missing.map(async (id) => {
        const response = await productClient.get<{
          success?: boolean
          data?: { name?: string | null; slug?: string | null }
        }>(`/shops/${id}`)
        return [id, response.data.data?.name?.trim() || response.data.data?.slug || ''] as const
      }),
    ).then((results) => {
      if (cancelled) return
      setShopNames((current) => {
        const next = { ...current }
        for (const result of results) {
          if (result.status === 'fulfilled' && result.value[1]) {
            next[result.value[0]] = result.value[1]
          }
        }
        return next
      })
    })
    return () => {
      cancelled = true
    }
    // shopNames intentionally omitted: it only grows, this effect guards via `missing`.
  }, [orderShopIds]) // eslint-disable-line react-hooks/exhaustive-deps

  const shopLabel = (shopId?: string | null) => {
    if (!shopId) return 'Unknown shop'
    return shopNames[shopId] || `Shop ${shopId.slice(0, 8)}`
  }

  const currentStep = order ? getStepIndex(order.status) : -1
  const isCancelled = order
    ? ['CANCELLED', 'FAILED', 'FAILED_PAYMENT', 'EXPIRED', 'RETURNED', 'REFUNDED'].includes(order.status?.toUpperCase())
    : false

  const deliveries = order?.fulfillment?.deliveries ?? []
  const activeDeliveries = deliveries.filter(
    (d) => !['DELIVERED', 'CANCELLED'].includes(d.status?.toUpperCase()),
  )
  const deliveredCount = deliveries.filter((d) => d.status?.toUpperCase() === 'DELIVERED').length

  // Shops represented in this order, grouped in first-seen order.
  const itemsByShop = useMemo(() => {
    const map = new Map<string, PurchasedOrderItem[]>()
    for (const item of order?.items ?? []) {
      const key = item.shopId || ''
      const bucket = map.get(key)
      if (bucket) bucket.push(item)
      else map.set(key, [item])
    }
    return [...map.entries()]
  }, [order?.items])

  const promotionsForShop = (shopId: string): PurchasedOrderPromotion[] =>
    (order?.promotions ?? []).filter((row) => row.shopId === shopId)

  // Which shops have at least one shipped package (deliveries items, or the
  // per-shop status row for orders projected after per-shop attribution).
  const shippedShopIds = useMemo(() => {
    const ids = new Set<string>()
    for (const delivery of deliveries) {
      for (const item of delivery.items ?? []) {
        if (item.shopId) ids.add(item.shopId)
      }
    }
    for (const row of order?.shopBreakdown ?? []) {
      if (['SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FULFILLED'].includes(
        (row.status || '').toUpperCase(),
      )) {
        ids.add(row.shopId)
      }
    }
    return ids
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveries, order?.shopBreakdown])

  const totalShops = orderShopIds.length || 1
  const orderStatusUpper = (order?.status || '').toUpperCase()
  // Order-level status is derived from per-shop progress by the read model:
  // PARTIALLY_FULFILLED while other shops still need to ship, IN_TRANSIT once
  // every shop's package is on its way. Legacy whole-order shipments report
  // SHIPPED/IN_TRANSIT directly.
  const allShopsShipped = [
    'SHIPPED',
    'FULFILLED',
    'IN_TRANSIT',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'COMPLETED',
  ].includes(orderStatusUpper)
  const canConfirmReceipt =
    order !== null &&
    !isCancelled &&
    orderStatusUpper !== 'DELIVERED' &&
    allShopsShipped &&
    activeDeliveries.length > 0
  const waitingForMoreShops = !isCancelled && !allShopsShipped && deliveries.length > 0
  const unshippedShops = itemsByShop
    .map(([shopId]) => shopId)
    .filter((shopId) => shopId && !shippedShopIds.has(shopId))

  // Flat item list ordered by shop groups, paginated.
  const groupedItems = useMemo(
    () => itemsByShop.flatMap(([, items]) => items),
    [itemsByShop],
  )
  const itemsTotalPages = Math.max(1, Math.ceil(groupedItems.length / ITEMS_PER_PAGE))
  const safeItemsPage = Math.min(itemsPage, itemsTotalPages)
  const paginatedItems = groupedItems.slice(
    (safeItemsPage - 1) * ITEMS_PER_PAGE,
    safeItemsPage * ITEMS_PER_PAGE,
  )

  const copyTracking = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedKey(key)
      window.setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 1500)
    } catch {
      /* clipboard unavailable — user can still read the number */
    }
  }

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

  const handleConfirmReceipt = async () => {
    if (activeDeliveries.length === 0) return
    setConfirming(true)
    setConfirmError(null)
    try {
      // Multi-shop orders: confirm every shipped package that is still
      // outstanding (each shipment confirms its own delivery).
      for (const delivery of activeDeliveries) {
        const deliveryIdLooksLikeTracking = /^TRK-/i.test(delivery.deliveryId)
        const identifiers = [
          delivery.trackingNumber,
          deliveryIdLooksLikeTracking ? null : delivery.deliveryId,
          activeDeliveries.length === 1 ? orderId : null,
          deliveryIdLooksLikeTracking ? delivery.deliveryId : null,
        ].filter((value): value is string => typeof value === 'string' && value.trim() !== '')

        let confirmed = false
        let lastError: unknown = null
        for (const identifier of [...new Set(identifiers)]) {
          try {
            await deliveryApi.confirmReceipt(identifier)
            confirmed = true
            break
          } catch (err: any) {
            lastError = err
            if (err?.response?.status !== 404) {
              throw err
            }
          }
        }

        if (!confirmed) {
          throw lastError ?? new Error('Delivery not found')
        }
      }
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

  /** Render one package card: who shipped it, what's inside, tracking. */
  const renderPackageCard = (delivery: PurchasedOrderDelivery, index: number) => {
    const packageLines = (delivery.items ?? []).map((line, lineIndex) => ({
      line,
      item: matchOrderItem(line, order?.items ?? []),
      key: `${line.productId ?? 'line'}-${line.variantId ?? ''}-${lineIndex}`,
    }))
    const packageShopIds = [
      ...new Set(
        packageLines
          .map(({ line, item }) => line.shopId || item?.shopId || '')
          .filter(Boolean),
      ),
    ] as string[]
    const delivered = delivery.status?.toUpperCase() === 'DELIVERED'
    const trackingKey = delivery.deliveryId || delivery.trackingNumber || String(index)

    return (
      <div
        key={trackingKey}
        className={`rounded-sm border p-3 ${
          delivered ? 'border-emerald-100 bg-emerald-50/40' : 'border-gray-200 bg-white'
        }`}
      >
        {/* Package header: identity + status */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <Package size={14} />
          </span>
          <p className="text-sm font-semibold text-gray-900">Package {index + 1}</p>
          {packageShopIds.map((shopId) => (
            <span
              key={shopId}
              className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700"
            >
              <Store size={11} />
              {shopLabel(shopId)}
            </span>
          ))}
          <span className="ml-auto">
            <StatusChip status={delivery.status} />
          </span>
        </div>

        {/* What's inside this package */}
        {packageLines.length > 0 && (
          <ul className="mt-2.5 divide-y divide-gray-100 rounded-sm border border-gray-100 bg-white">
            {packageLines.map(({ line, item, key }) => (
              <li key={key} className="flex items-center gap-2.5 px-2.5 py-2">
                <OrderProductImage
                  imageUrl={item?.imageUrl}
                  alt={item?.name || line.sku || 'Product'}
                  className="h-9 w-9"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-gray-900">
                    {item?.name || line.sku || line.productId || 'Item'}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    SKU {line.sku || item?.sku || '—'}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] text-gray-500">×{line.quantity ?? item?.quantity ?? 1}</span>
                {item && (
                  <span className="shrink-0 text-xs font-semibold text-gray-900">
                    {formatMoney(item.lineTotal, item.currency || orderTotals.currency)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Tracking details */}
        <div className="mt-2.5 grid gap-1.5 text-xs sm:grid-cols-2">
          {delivery.trackingNumber && (
            <div className="flex items-center gap-1.5 sm:col-span-2">
              <span className="w-24 shrink-0 text-gray-500">Tracking No.</span>
              <span className="break-all font-mono font-medium text-gray-900">
                {delivery.trackingNumber}
              </span>
              <button
                type="button"
                onClick={() => void copyTracking(trackingKey, delivery.trackingNumber as string)}
                className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
                title="Copy tracking number"
                aria-label="Copy tracking number"
              >
                {copiedKey === trackingKey ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              </button>
            </div>
          )}
          {delivery.courier?.name && (
            <div className="flex gap-2">
              <span className="w-24 shrink-0 text-gray-500">Courier</span>
              <span className="text-gray-900">{delivery.courier.name}</span>
            </div>
          )}
          {delivery.estimatedDeliveryDate && (
            <div className="flex gap-2">
              <span className="w-24 shrink-0 text-gray-500">Est. Delivery</span>
              <span className="text-gray-900">{formatDate(delivery.estimatedDeliveryDate)}</span>
            </div>
          )}
          {delivered && (
            <div className="flex gap-2">
              <span className="w-24 shrink-0 text-gray-500">Delivered</span>
              <span className="font-medium text-emerald-700">Received ✓</span>
            </div>
          )}
        </div>

        {delivery.trackingUrl && (
          <a
            href={delivery.trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700"
          >
            Track on courier website
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z" />
            </svg>
          </a>
        )}

        {!delivery.trackingNumber && !delivery.trackingUrl && !delivered && (
          <p className="mt-2 text-[11px] text-gray-400">
            Tracking details will appear once this package is dispatched.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1080px] px-4 py-6 space-y-6">
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <Link to="/account/orders" className="hover:text-emerald-600">
          My Orders
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Order #{orderId}</span>
      </div>

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

      {!loading && !error && order && (
        <>
          {/* Status header */}
          <div className="bg-white border border-gray-200 rounded-sm px-5 py-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Order Status</h1>
                <p className="mt-0.5 text-xs text-gray-500">
                  Placed {formatDate(order.placedAt || order.createdAt)}
                  {itemsByShop.length > 1 && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700">
                      <Store size={11} />
                      Ships from {itemsByShop.length} shops
                    </span>
                  )}
                </p>
              </div>
              <StatusChip status={order.status} />
            </div>

            {/* Timeline */}
            {!isCancelled && (
              <div className="flex items-center gap-0 mt-5">
                {STATUS_STEPS.map((step, i) => {
                  const isActive = i <= currentStep
                  const isCurrent = i === currentStep
                  return (
                    <div key={step.key} className="flex-1 flex flex-col items-center relative">
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

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            {/* ───────────────── Main column ───────────────── */}
            <div className="min-w-0 space-y-6">
              {/* Packages: one card per shipped package + awaiting placeholders */}
              {(deliveries.length > 0 || unshippedShops.length > 0) && !isCancelled && (
                <div className="bg-white border border-gray-200 rounded-sm px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-gray-900">
                      Packages
                      {totalShops > 1 && (
                        <span className="ml-2 text-xs font-normal text-gray-500">
                          each shop ships its own box
                        </span>
                      )}
                    </h2>
                    <span className="text-xs text-gray-500">
                      {deliveredCount}/{Math.max(deliveries.length, unshippedShops.length)} delivered
                    </span>
                  </div>

                  <div className="space-y-3">
                    {deliveries.map((delivery, index) => renderPackageCard(delivery, index))}

                    {unshippedShops.map((shopId) => (
                      <div
                        key={`pending-${shopId}`}
                        className="rounded-sm border border-dashed border-gray-300 bg-gray-50/60 p-3"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-gray-400 ring-1 ring-gray-200">
                            <Store size={14} />
                          </span>
                          <p className="text-sm font-semibold text-gray-700">{shopLabel(shopId)}</p>
                          <span className="inline-flex shrink-0 items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                            Awaiting shipment
                          </span>
                          <span className="ml-auto text-[11px] text-gray-400">
                            {itemsByShop.find(([id]) => id === shopId)?.[1].length ?? 0} item(s)
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs text-gray-500">
                          The shop is preparing your items — tracking appears here once it ships.
                        </p>
                      </div>
                    ))}
                  </div>

                  {waitingForMoreShops && unshippedShops.length > 0 && (
                    <p className="mt-3 rounded-sm bg-amber-50 px-3 py-2 text-xs text-amber-700">
                      Waiting for {unshippedShops.length} more shop{unshippedShops.length !== 1 ? 's' : ''} to ship — receipt can be confirmed once every package is on its way.
                    </p>
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
                        {activeDeliveries.length > 1
                          ? `Received all ${activeDeliveries.length} packages? Confirm to complete the order and release payment to the sellers.`
                          : 'Received your package? Confirm to complete the order and release payment to the seller.'}
                      </p>
                    </div>
                  )}
                  {confirmError && (
                    <p className="mt-3 text-xs text-red-500">{confirmError}</p>
                  )}
                </div>
              )}

              {/* Order items (paginated) */}
              <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-b border-gray-100">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">Order Items</h2>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {order.items.length} item{order.items.length === 1 ? '' : 's'}
                      {itemsByShop.length > 1 && ` from ${itemsByShop.length} shops`}
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {paginatedItems.map((item, index) => {
                    const itemKey = item.orderItemId || `unavailable-${index}`
                    const isChecked = Boolean(item.orderItemId && selectedItemIds.includes(item.orderItemId))
                    return (
                      <div key={`${itemKey}-${index}`} className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePartialInvoiceItem(item)}
                            disabled={!item.orderItemId}
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <div className="flex-1 min-w-0">
                            <OrderItemRow item={item} shopLabel={item.shopId ? shopLabel(item.shopId) : null} />
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

                {groupedItems.length > ITEMS_PER_PAGE && (
                  <DataTablePagination
                    page={safeItemsPage}
                    totalPages={itemsTotalPages}
                    rowsPerPage={ITEMS_PER_PAGE}
                    totalItems={groupedItems.length}
                    itemLabel="items"
                    onPageChange={setItemsPage}
                  />
                )}

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
              </div>

              {/* Cost breakdown by shop */}
              {order.shopBreakdown && order.shopBreakdown.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100">
                    <h2 className="text-sm font-semibold text-gray-900">Cost by Shop</h2>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Discounts and shipping are charged per shop.
                    </p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {order.shopBreakdown.map((row, rowIndex) => {
                      const promos = promotionsForShop(row.shopId)
                      const itemPromos = promos.filter((p) => p.discountType !== 'SHIPPING')
                      const shippingPromos = promos.filter((p) => p.discountType === 'SHIPPING')
                      const shopItems = itemsByShop.find(([id]) => id === row.shopId)?.[1] ?? []
                      const status = (row.status || '').toUpperCase()
                      return (
                        <div key={row.shopOrderId || row.shopId || `shop-${rowIndex}`} className="px-5 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                              <Store size={12} />
                            </span>
                            <p className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">
                              {shopLabel(row.shopId)}
                            </p>
                            <span className="text-[11px] text-gray-400">
                              {shopItems.length} item{shopItems.length === 1 ? '' : 's'}
                            </span>
                            {status && <StatusChip status={status} />}
                          </div>

                          <div className="mt-2.5 space-y-1.5 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Items subtotal</span>
                              <span className="font-medium text-gray-900">
                                {formatMoney(row.subtotal, row.currency || orderTotals.currency)}
                              </span>
                            </div>
                            {(row.bundleDiscount ?? 0) > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Bundle discount</span>
                                <span className="font-medium text-emerald-600">
                                  −{formatMoney(row.bundleDiscount ?? 0, row.currency || orderTotals.currency)}
                                </span>
                              </div>
                            )}
                            {row.discount > 0 && (
                              <div className="flex justify-between">
                                <span className="flex items-center gap-1.5 text-gray-500">
                                  Discount
                                  {itemPromos.map((promo) => (
                                    <span
                                      key={`${promo.promotionId}-${promo.rewardId}`}
                                      className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-100"
                                    >
                                      {promo.promotionName || 'promo'}
                                    </span>
                                  ))}
                                </span>
                                <span className="font-medium text-emerald-600">
                                  −{formatMoney(row.discount, row.currency || orderTotals.currency)}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="flex items-center gap-1.5 text-gray-500">
                                Shipping
                                {shippingPromos.length > 0 && (
                                  <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-100">
                                    free shipping reward
                                  </span>
                                )}
                              </span>
                              <span className="font-medium text-gray-900">
                                {row.shipping > 0
                                  ? formatMoney(row.shipping, row.currency || orderTotals.currency)
                                  : 'Free'}
                              </span>
                            </div>
                            <div className="flex justify-between border-t border-gray-100 pt-1.5">
                              <span className="font-semibold text-gray-900">Shop total</span>
                              <span className="text-sm font-bold text-gray-900">
                                {formatMoney(row.total, row.currency || orderTotals.currency)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ───────────────── Side column ───────────────── */}
            <div className="space-y-6">
              {/* Payment summary */}
              <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-900">Summary</h2>
                </div>
                <OrderPaymentSummary totals={orderTotals} />
                {order.payment && (
                  <div className="border-t border-gray-100 px-5 py-3 text-xs">
                    <div className="flex items-center justify-between py-1">
                      <span className="text-gray-500">Payment status</span>
                      <StatusChip status={order.payment.status} />
                    </div>
                    {order.payment.transactionId && (
                      <div className="flex items-center justify-between gap-2 py-1">
                        <span className="text-gray-500">Transaction</span>
                        <span className="truncate font-mono text-gray-700" title={order.payment.transactionId}>
                          {order.payment.transactionId}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Delivery address */}
              {order.deliveryAddress && (
                <div className="bg-white border border-gray-200 rounded-sm px-5 py-4">
                  <h2 className="text-sm font-semibold text-gray-900 mb-2">Delivery Address</h2>
                  <div className="text-sm text-gray-700 space-y-0.5">
                    <p className="font-medium">{order.deliveryAddress.recipientName}</p>
                    {order.deliveryAddress.recipientPhone && (
                      <p className="text-xs text-gray-500">{order.deliveryAddress.recipientPhone}</p>
                    )}
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
            </div>
          </div>

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

const OrderItemRow = ({ item, shopLabel }: { item: PurchasedOrderItem; shopLabel?: string | null }) => {
  const currency = item.currency || 'USD'
  const unitPrice = toSafeAmount(item.unitPrice)
  const lineTotal = toSafeAmount(item.lineTotal)
  const quantity = toSafeAmount(item.quantity)

  return (
    <div className="flex gap-3">
      <OrderProductImage imageUrl={item.imageUrl} alt={item.name} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
        {shopLabel && (
          <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600">
            <Store size={11} />
            {shopLabel}
          </p>
        )}
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
  )
}

const OrderPaymentSummary = ({ totals }: { totals: PurchasedOrderTotals }) => {
  const { subtotal, discount, shipping, total, currency } = totals

  return (
    <div className="px-5 py-4">
      <div className="text-sm text-gray-700">
        <div className="mb-2 flex justify-between">
          <span className="text-gray-600">Merchandise Subtotal</span>
          <span className="text-gray-900">{formatMoney(subtotal, currency)}</span>
        </div>

        <div className="mb-2 flex justify-between">
          <span className="text-gray-600">Shipping Subtotal</span>
          <span className="text-gray-900">{formatMoney(shipping, currency)}</span>
        </div>

        <div className="mb-2 flex justify-between">
          <span className="text-gray-600">Promotion Discount</span>
          <span className="font-medium text-emerald-600">-{formatMoney(discount, currency)}</span>
        </div>

        {(totals.bundleDiscount ?? 0) > 0 && (
          <div className="mb-3 flex justify-between">
            <span className="text-gray-600">Bundle Discount</span>
            <span className="font-medium text-emerald-600">
              -{formatMoney(totals.bundleDiscount ?? 0, currency)}
            </span>
          </div>
        )}

        <div className="flex items-end justify-between border-t border-gray-100 pt-3">
          <span className="font-medium text-gray-900">Total Payment:</span>
          <span className="text-2xl font-semibold text-emerald-600">
            {formatMoney(total, currency)}
          </span>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-1 text-[11px] text-gray-400">
        <span>GST included, where applicable.</span>
      </div>
    </div>
  )
}

export default OrderTrackingPage

import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import { fetchSellerOrdersByShop } from '../store'
import {
  fetchCustomerAvatars,
  fetchOrdersAcrossOwnedShops,
  sellerOrderApi,
  type SellerOrder,
  type SellerOrderItem,
  type PaymentAllocation,
} from '../api/sellerOrderApi'
import CustomerAvatar from '../components/CustomerAvatar'
import OrderProductImage from '@/features/account/components/OrderProductImage'
import { Truck, MapPin, Package, CreditCard, Mail, Store, Tag, Check, Home, type LucideIcon } from 'lucide-react'
import { StepConnector } from '@/components/ui/StepConnector'
import PaymentAllocationCard from '../components/PaymentAllocationCard'

const STATUS_STEPS: { key: 'READY_FOR_FULFILLMENT' | 'SHIPPED' | 'IN_TRANSIT' | 'DELIVERED'; label: string; icon: LucideIcon }[] = [
  { key: 'READY_FOR_FULFILLMENT', label: 'Ready to Ship', icon: Package },
  { key: 'SHIPPED', label: 'Shipped', icon: Truck },
  { key: 'IN_TRANSIT', label: 'In Transit', icon: MapPin },
  { key: 'DELIVERED', label: 'Delivered', icon: Home },
]

const STATUS_ORDER = STATUS_STEPS.map((s) => s.key)

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
  FAILED: 'bg-red-100 text-red-700',
  FAILED_PAYMENT: 'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<string, string> = {
  READY_FOR_FULFILLMENT: 'To Ship',
  PARTIALLY_FULFILLED: 'Partially Shipped',
  SHIPPED: 'Shipped',
  FULFILLED: 'Shipped',
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
  // Some/all shops shipped → show the "Shipped" step as current.
  if (upper === 'PARTIALLY_FULFILLED' || upper === 'FULFILLED') return 1
  const idx = STATUS_ORDER.indexOf(upper as (typeof STATUS_ORDER)[number])
  if (idx !== -1) return idx
  if (['COMPLETED'].includes(upper)) return STATUS_ORDER.length - 1
  return -1
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
  const [shopNames, setShopNames] = useState<Record<string, string>>({})
  const [allocations, setAllocations] = useState<PaymentAllocation[]>([])
  const [customerAvatar, setCustomerAvatar] = useState<string | null>(null)

  // Payment allocation (payout split) restricted to this seller's shops.
  useEffect(() => {
    if (!order) {
      setAllocations([])
      return
    }
    const shopIds = [...new Set(order.items.map((item) => item.shopId).filter(Boolean))]
    let cancelled = false
    sellerOrderApi
      .paymentAllocations(order.orderId, shopIds)
      .then((rows) => {
        if (!cancelled) setAllocations(rows)
      })
      .catch(() => {
        if (!cancelled) setAllocations([])
      })
    return () => {
      cancelled = true
    }
  }, [order])

  useEffect(() => {
    const customerId = order?.customerId
    if (!customerId) {
      setCustomerAvatar(null)
      return
    }
    let cancelled = false
    void fetchCustomerAvatars([customerId])
      .then((avatars) => {
        if (!cancelled) setCustomerAvatar(avatars[customerId] ?? null)
      })
      .catch(() => {
        if (!cancelled) setCustomerAvatar(null)
      })
    return () => {
      cancelled = true
    }
  }, [order?.customerId])

  // Resolve shop display names (every shop owned by this seller).
  useEffect(() => {
    if (!authUserId) return

    let cancelled = false
    sellerOrderApi
      .listShopsByUser(authUserId)
      .then((shops) => {
        if (cancelled) return
        const map: Record<string, string> = {}
        for (const shop of shops) {
          const id = shop.id ?? shop.shopId
          if (id) map[id] = shop.name?.trim() || shop.slug || id
        }
        setShopNames(map)
      })
      .catch(() => {
        // Non-fatal: fall back to short shop ids in the UI.
      })

    return () => {
      cancelled = true
    }
  }, [authUserId])

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

  const handleShipOrder = async (shopId?: string, shopName?: string) => {
    if (!order) return

    openModal({
      title: 'Ship Order',
      content: (
        <div className="space-y-3 text-sm text-slate-700">
          <p>
            {shopName ? (
              <>
                Create a shipment for <strong className="text-slate-900">{shopName}</strong>
                &apos;s items in order <strong className="text-slate-900">{order.orderId}</strong>?
              </>
            ) : (
              <>
                Create a shipment for order <strong className="text-slate-900">{order.orderId}</strong>?
              </>
            )}
          </p>
          <p className="text-xs text-slate-500">
            {shopId
              ? 'Only this shop’s items will be shipped using its configured Delivery Company — other shops ship separately with their own tracking numbers.'
              : 'The shop’s configured Delivery Company will be used. A tracking number will be automatically generated.'}
          </p>
        </div>
      ),
      primaryLabel: 'Ship Order',
      primaryVariant: 'success',
      secondaryLabel: 'Cancel',
      onPrimary: async () => {
        try {
          await sellerOrderApi.createShipment(order.orderId, {
            ...(shopId ? { shop_id: shopId } : {}),
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
  const orderComplete = ['DELIVERED', 'COMPLETED'].includes(statusUpper)
  const isCancelled = ['CANCELLED', 'FAILED', 'FAILED_PAYMENT', 'EXPIRED'].includes(statusUpper)
  // Shops with at least one shipment already on their way (fallback signal
  // when per-shop status rows are missing, e.g. orders projected before
  // per-shop fulfillment existed).
  const shippedShopIds = new Set(
    (order?.fulfillment?.deliveries ?? [])
      .flatMap((d) => (d.items ?? []).map((i) => i.shopId ?? ''))
      .filter(Boolean),
  )
  // The read-service already scopes results to the seller's shops; show every
  // ordered product across all of them (an order may span multiple shops that
  // belong to the same owner), grouped by shop for readability.
  const orderedItems = order?.items ?? []
  const shopGroups = (() => {
    const map = new Map<string, SellerOrderItem[]>()
    for (const item of orderedItems) {
      const key = item.shopId || ''
      const bucket = map.get(key)
      if (bucket) bucket.push(item)
      else map.set(key, [item])
    }
    return [...map.entries()]
  })()

  const shopLabel = (shopId: string) =>
    shopNames[shopId] || (shopId ? `Shop ${shopId.slice(0, 8)}` : 'Unknown shop')

  // Promotion discounts grouped per shop (an order may apply the same promo
  // as both an item and shipping reward, so amounts merge by promotion).
  type ShopPromoSummary = { id: string; name: string; amount: number; fundedBy: string }
  const promotionsByShop = (() => {
    const map = new Map<string, Map<string, ShopPromoSummary>>()
    for (const allocation of order?.promotions ?? []) {
      const shopKey = allocation.shopId
      const promoKey = allocation.promotionId || allocation.promotionName
      if (!shopKey || !promoKey) continue
      let byPromo = map.get(shopKey)
      if (!byPromo) {
        byPromo = new Map()
        map.set(shopKey, byPromo)
      }
      const existing = byPromo.get(promoKey)
      if (existing) {
        existing.amount = Number((existing.amount + allocation.amount).toFixed(2))
      } else {
        byPromo.set(promoKey, {
          id: promoKey,
          name: allocation.promotionName || 'Promotion',
          amount: allocation.amount,
          fundedBy: allocation.fundedBy,
        })
      }
    }
    return map
  })()

  const breakdownForShop = (shopId: string, groupItems: SellerOrderItem[]) => {
    const row = order?.shopBreakdown?.find((b) => b.shopId === shopId)
    const itemDiscount = Number(
      (order?.promotions ?? [])
        .filter((p) => p.shopId === shopId)
        .reduce((carry, p) => carry + p.amount, 0)
        .toFixed(2),
    )
    return {
      subtotal:
        row?.subtotal ?? Number(groupItems.reduce((c, i) => c + i.lineTotal, 0).toFixed(2)),
      discount: row?.discount ?? itemDiscount,
      bundleDiscount: row?.bundleDiscount ?? 0,
      shipping: row?.shipping ?? null,
      total: row?.total ?? null,
      currency: row?.currency ?? order?.totals.currency ?? 'USD',
    }
  }

  // Totals shown to this seller. When the order co-mingles shops from other
  // owners, the buyer-level totals would overstate what this seller shipped,
  // so display their shops' share instead (server-scoped sellerTotals,
  // per-shop breakdown sum, or scoped-items fallback for legacy orders).
  const sellerTotals = (() => {
    if (!order) return null
    if (order.sellerTotals) return order.sellerTotals

    const rows = order.shopBreakdown ?? []
    if (rows.length > 0) {
      const sum = (pick: (row: (typeof rows)[number]) => number) =>
        Number(rows.reduce((carry, row) => carry + pick(row), 0).toFixed(2))
      return {
        subtotal: sum((r) => r.subtotal),
        discount: sum((r) => r.discount),
        bundleDiscount: sum((r) => r.bundleDiscount ?? 0),
        shipping: sum((r) => r.shipping) as number | null,
        total: sum((r) => r.total),
        currency: rows[0].currency || order.totals.currency,
      }
    }

    const subtotal = Number(
      orderedItems.reduce((carry, item) => carry + item.lineTotal, 0).toFixed(2),
    )
    const discount = Number(
      (order.promotions ?? []).reduce((carry, p) => carry + p.amount, 0).toFixed(2),
    )
    return {
      subtotal,
      discount,
      bundleDiscount: 0,
      shipping: null as number | null,
      total: Number(Math.max(0, subtotal - discount).toFixed(2)),
      currency: order.totals.currency,
    }
  })()

  const isSharedOrder = Boolean(
    order &&
      (order.scopedToSeller ?? false) &&
      sellerTotals &&
      Math.abs(sellerTotals.total - Number(order.totals.total ?? 0)) > 0.005,
  )

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
            </div>
          </div>

          {/* Status timeline */}
          {!isCancelled && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="text-base font-bold text-slate-900">Order Progress</h2>
              <div className="relative mt-8 flex w-full items-start justify-between">
                <StepConnector
                  stepCount={STATUS_STEPS.length}
                  reach={orderComplete ? 1 : Math.max(currentStep, 0) / (STATUS_STEPS.length - 1)}
                  flowing={!orderComplete && currentStep > 0}
                  colorClass="bg-emerald-600"
                />

                {STATUS_STEPS.map((step, index) => {
                  const state = orderComplete || index < currentStep
                    ? 'completed'
                    : index === currentStep
                      ? 'active'
                      : 'pending'
                  const Icon = step.icon
                  const emphasized = state === 'completed' || state === 'active'

                  return (
                    <div key={step.key} className="relative flex flex-1 flex-col items-center">
                      <div
                        className={`relative z-10 flex h-9 w-9 items-center justify-center shadow-sm transition-all duration-300 ${
                          state === 'active'
                            ? 'scale-105 rounded-full bg-emerald-600 text-white'
                            : state === 'completed'
                              ? 'rounded-full bg-emerald-600 text-white'
                              : 'rounded-lg bg-gray-100 text-gray-400'
                        }`}
                      >
                        {state === 'completed' ? (
                          <Check className="h-5 w-5" strokeWidth={2.5} />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                      </div>

                      <div className="mt-3 select-none space-y-1 px-1 text-center">
                        <p
                          className={`text-xs font-medium leading-tight transition-colors duration-300 sm:text-sm ${
                            emphasized ? 'font-semibold text-gray-900' : 'text-gray-400'
                          }`}
                        >
                          {step.label}
                        </p>
                        <p
                          className={`text-[11px] font-medium transition-colors duration-300 sm:text-xs ${
                            state === 'pending' ? 'text-gray-400' : 'text-emerald-700'
                          }`}
                        >
                          {state === 'completed' ? 'Completed' : state === 'active' ? 'Processing' : 'Pending'}
                        </p>
                      </div>
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
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Package size={18} />
                    Order Items
                  </h2>
                  {shopGroups.length > 1 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                      <Store size={13} />
                      Ships from {shopGroups.length} shops
                    </span>
                  )}
                </div>

                <div className="mt-4 space-y-4">
                  {shopGroups.map(([shopId, groupItems]) => {
                    const shopTotals = breakdownForShop(shopId, groupItems)
                    const shopPromos = [...(promotionsByShop.get(shopId)?.values() ?? [])]
                    // Per-shop fulfillment progress. Confirmed progress from
                    // the shop_order row wins; shipped-delivery detection
                    // overrides a stale READY row (orders projected before
                    // per-shop status existed); legacy orders with no rows
                    // at all fall back to the order-level status.
                    const shopRow = order?.shopBreakdown?.find((b) => b.shopId === shopId)
                    const rowStatus = (shopRow?.status || '').toUpperCase()
                    const derivedShipped = shopId && shippedShopIds.has(shopId)
                    const shopStatus =
                      (rowStatus && rowStatus !== 'READY_FOR_FULFILLMENT'
                        ? rowStatus
                        : derivedShipped
                          ? 'SHIPPED'
                          : rowStatus || (shopRow ? '' : statusUpper)
                      ).toUpperCase()
                    const shopCanShip =
                      !isCancelled && !!order && shopStatus === 'READY_FOR_FULFILLMENT'
                    const shopShipped = ['SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FULFILLED'].includes(shopStatus)
                    return (
                      <div
                        key={shopId || 'unknown'}
                        className="overflow-hidden rounded-xl border border-slate-200"
                      >
                        <div className="flex items-center gap-2.5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-2.5">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200">
                            <Store size={14} />
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">
                            {shopLabel(shopId)}
                          </span>
                          {shopCanShip && (
                            <button
                              type="button"
                              onClick={() => handleShipOrder(shopId || undefined, shopId ? shopLabel(shopId) : undefined)}
                              className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700 cursor-pointer"
                            >
                              <Truck size={13} />
                              Ship this shop
                            </button>
                          )}
                          {shopShipped && (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-cyan-100 px-2 py-0.5 text-[11px] font-semibold text-cyan-700">
                              {shopStatus === 'DELIVERED' ? 'Delivered' : 'Shipped'}
                            </span>
                          )}
                          <span className="shrink-0 text-xs text-slate-400">
                            {groupItems.length} item{groupItems.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="divide-y divide-slate-100 px-4">
                          {groupItems.map((item) => (
                            <div
                              key={`${item.shopId}-${item.productId}-${item.sku}`}
                              className="flex gap-3 py-3.5"
                            >
                              <OrderProductImage
                                imageUrl={item.imageUrl}
                                alt={item.name}
                                className="h-14 w-14"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                                <p className="text-xs text-slate-400 mt-0.5 truncate">SKU: {item.sku || '—'}</p>
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="text-sm font-semibold text-slate-900">
                                  {formatMoney(item.lineTotal, item.currency)}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {formatMoney(item.unitPrice, item.currency)} × {item.quantity}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                        {shopPromos.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 border-t border-slate-100 bg-emerald-50/40 px-4 py-2">
                            {shopPromos.map((promo) => (
                              <span
                                key={promo.id}
                                className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100"
                                title={`Funded by ${promo.fundedBy === 'SELLER' ? 'the seller' : 'the platform'}`}
                              >
                                <Tag size={11} />
                                {promo.name} −{formatMoney(promo.amount, shopTotals.currency)}
                                <span className="text-emerald-500">
                                  · {promo.fundedBy === 'SELLER' ? 'Shop' : 'Platform'}
                                </span>
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-4 py-2.5 text-xs">
                          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-slate-500">
                            <span>
                              Items{' '}
                              <span className="font-semibold text-slate-700">
                                {formatMoney(shopTotals.subtotal, shopTotals.currency)}
                              </span>
                            </span>
                            {(shopTotals.bundleDiscount ?? 0) > 0 && (
                              <span>
                                Bundle{' '}
                                <span className="font-semibold text-emerald-600">
                                  −{formatMoney(shopTotals.bundleDiscount ?? 0, shopTotals.currency)}
                                </span>
                              </span>
                            )}
                            {shopTotals.discount > 0 && (
                              <span>
                                Discount{' '}
                                <span className="font-semibold text-emerald-600">
                                  −{formatMoney(shopTotals.discount, shopTotals.currency)}
                                </span>
                              </span>
                            )}
                            {shopTotals.shipping != null && (
                              <span>
                                Shipping{' '}
                                <span className="font-semibold text-slate-700">
                                  {formatMoney(shopTotals.shipping, shopTotals.currency)}
                                </span>
                              </span>
                            )}
                          </div>
                          {shopTotals.total != null && (
                            <span className="shrink-0 font-bold text-slate-900">
                              {formatMoney(shopTotals.total, shopTotals.currency)}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {shopGroups.length === 0 && (
                    <p className="text-sm text-slate-500">No items in this order.</p>
                  )}
                </div>

                {/* Totals: this seller's share only when the order spans shops */}
                {sellerTotals && (
                <div className="mt-5 rounded-xl bg-slate-50 ring-1 ring-slate-100 p-4">
                  {isSharedOrder && (
                    <p className="mb-2.5 border-b border-slate-200 pb-2 text-xs text-slate-500">
                      This order also includes other owners&apos; shops — showing only your shops&apos; amounts
                    </p>
                  )}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Subtotal</span>
                      <span className="font-medium text-slate-800">
                        {formatMoney(sellerTotals.subtotal, sellerTotals.currency)}
                      </span>
                    </div>
                    {(sellerTotals.bundleDiscount ?? 0) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Bundle Discount</span>
                        <span className="font-medium text-emerald-600">
                          −{formatMoney(sellerTotals.bundleDiscount ?? 0, sellerTotals.currency)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Total Discount</span>
                      <span
                        className={`font-medium ${
                          sellerTotals.discount > 0 ? 'text-emerald-600' : 'text-slate-800'
                        }`}
                      >
                        {sellerTotals.discount > 0
                          ? `−${formatMoney(sellerTotals.discount, sellerTotals.currency)}`
                          : formatMoney(sellerTotals.discount, sellerTotals.currency)}
                      </span>
                    </div>
                    {sellerTotals.shipping != null && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Total Shipping</span>
                        <span className="font-medium text-slate-800">
                          {formatMoney(sellerTotals.shipping, sellerTotals.currency)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center border-t border-slate-200 pt-3 mt-1">
                      <span className="text-sm font-semibold text-slate-900">
                        {isSharedOrder ? 'Your Shops Total' : 'Order Total'}
                      </span>
                      <span className="text-xl font-bold tracking-tight text-slate-900">
                        {formatMoney(sellerTotals.total, sellerTotals.currency)}
                      </span>
                    </div>
                  </div>
                </div>
                )}
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
                  {allocations.length > 0 ? (
                    <PaymentAllocationCard
                      allocations={allocations}
                      currency={order.totals.currency}
                      shopLabel={shopLabel}
                      scopedCaption={isSharedOrder}
                    />
                  ) : (
                    <div className="flex items-center justify-between py-3">
                      <p className="text-sm text-slate-500">Total</p>
                      <p className="text-lg font-bold tracking-tight text-slate-900">
                        {formatMoney(sellerTotals?.total ?? order.totals.total, order.totals.currency)}
                      </p>
                    </div>
                  )}
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
                    <div className="mb-2 flex items-center gap-2.5">
                      <CustomerAvatar
                        imageUrl={customerAvatar}
                        alt={order.deliveryAddress.recipientName || 'Customer'}
                        className="h-10 w-10"
                      />
                      <p className="font-medium text-slate-900">{order.deliveryAddress.recipientName || '—'}</p>
                    </div>
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

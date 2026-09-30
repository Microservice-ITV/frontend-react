import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { RefreshCw, ArrowLeft, CreditCard, PackageCheck, Fingerprint, History, Wallet } from 'lucide-react'
import { useAppSelector } from '@/app/hooks'
import {
  sellerOrderApi,
  type PaymentAllocation,
  type PaymentDetail,
} from '../api/sellerOrderApi'
import PaymentAllocationCard from '../components/PaymentAllocationCard'

const money = (value: number, currency: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(value || 0)

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  COLLECTED: 'bg-emerald-100 text-emerald-700',
  SUCCESS: 'bg-sky-100 text-sky-700',
  PENDING: 'bg-amber-100 text-amber-700',
  FAILED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-slate-200 text-slate-600',
}

const EVENT_STYLES: Record<string, string> = {
  REQUESTED: 'bg-sky-100 text-sky-700',
  SUCCESS: 'bg-emerald-100 text-emerald-700',
  COLLECTED: 'bg-emerald-100 text-emerald-700',
  FAILED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-slate-200 text-slate-600',
  WEBHOOK_RECEIVED: 'bg-violet-100 text-violet-700',
}

const deliveryLabel = (status?: string | null) => {
  if (!status) return '—'
  switch (status.toUpperCase()) {
    case 'DELIVERED':
      return 'Delivered'
    case 'SHIPPED':
      return 'Shipped'
    case 'IN_TRANSIT':
      return 'In Transit'
    case 'OUT_FOR_DELIVERY':
      return 'Out for Delivery'
    case 'PARTIALLY_FULFILLED':
      return 'Partially Shipped'
    case 'FULFILLED':
      return 'Shipped'
    case 'READY_FOR_FULFILLMENT':
      return 'Ready to fulfil'
    default:
      return status.charAt(0) + status.slice(1).toLowerCase()
  }
}

const formatDate = (value?: string | null) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function PaymentDetailPage() {
  const { paymentId = '' } = useParams()
  const authUser = useAppSelector((state) => state.auth.user)
  const [payment, setPayment] = useState<PaymentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [shopNames, setShopNames] = useState<Record<string, string>>({})
  const [sellerShopIds, setSellerShopIds] = useState<string[]>([])
  const [allocations, setAllocations] = useState<PaymentAllocation[]>([])

  // Resolve the shops owned by this account so the allocation view can be
  // restricted to the seller's own slice of a shared payment.
  useEffect(() => {
    if (!authUser?.id) return
    let cancelled = false
    sellerOrderApi
      .listShopsByUser(authUser.id)
      .then((shops) => {
        if (cancelled) return
        const map: Record<string, string> = {}
        const ids: string[] = []
        for (const shop of shops) {
          const id = shop.id ?? shop.shopId
          if (id) {
            map[id] = shop.name?.trim() || shop.slug || id
            ids.push(id)
          }
        }
        setShopNames(map)
        setSellerShopIds(ids)
      })
      .catch(() => {
        /* Non-fatal: share card stays hidden. */
      })
    return () => {
      cancelled = true
    }
  }, [authUser?.id])

  // Per-shop payout split for this payment (seller's shops only).
  useEffect(() => {
    const orderId = payment?.orderId
    if (!orderId || !payment || sellerShopIds.length === 0) {
      setAllocations([])
      return
    }
    let cancelled = false
    sellerOrderApi
      .paymentAllocations(orderId, sellerShopIds)
      .then((rows) => {
        if (!cancelled) setAllocations(rows.filter((row) => row.paymentId === payment.id))
      })
      .catch(() => {
        if (!cancelled) setAllocations([])
      })
    return () => {
      cancelled = true
    }
  }, [payment?.orderId, payment?.id, sellerShopIds])

  const shopLabel = (shopId: string) =>
    shopNames[shopId] || (shopId ? `Shop ${shopId.slice(0, 8)}` : 'Unknown shop')

  const sellerShareTotal = useMemo(
    () => Number(allocations.reduce((carry, row) => carry + row.orderAmount, 0).toFixed(2)),
    [allocations],
  )
  const isSharedPayment =
    allocations.length > 0 && Math.abs(sellerShareTotal - (payment?.amount ?? 0)) > 0.005

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setPayment(await sellerOrderApi.paymentDetail(paymentId))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load payment details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [paymentId])

  if (loading) {
    return <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">Loading payment details…</div>
  }

  if (error || !payment) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
        <p className="text-sm text-red-700">{error || 'Payment not found.'}</p>
        <Link to=".." className="mt-4 inline-block text-sm font-medium text-emerald-600 hover:underline">
          Back to payments
        </Link>
      </div>
    )
  }

  const statusStyle = PAYMENT_STATUS_STYLES[payment.status.toUpperCase()] ?? 'bg-slate-100 text-slate-600'

  return (
    <section className="space-y-6">
      <div>
        <nav className="text-xs text-slate-500">
          <Link to="..">Dashboard</Link>
          <span className="mx-1">/</span>
          <Link to="..">Payments</Link>
          <span className="mx-1">/</span>
          {payment.invoiceNo || 'Payment'}
        </nav>
        <div className="mt-1 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to=".."
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              aria-label="Back to payments"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{payment.invoiceNo || 'Payment Details'}</h1>
              <p className="mt-0.5 text-sm text-slate-600">Traceability record for this payment.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle}`}>
              {payment.status}
            </span>
            <button
              onClick={() => void load()}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
            >
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
              <CreditCard size={15} className="text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900">Payment</h2>
            </div>
            <dl className="grid gap-x-6 gap-y-4 px-4 py-4 sm:grid-cols-2">
              <DetailItem label="Invoice No." value={payment.invoiceNo || '—'} mono />
              <DetailItem label="Order ID" value={payment.orderId || '—'} mono />
              <DetailItem label="Amount" value={money(payment.amount, payment.currency)} />
              <DetailItem label="Provider" value={payment.provider} />
              <DetailItem label="Payment Method" value={payment.paymentMethod || '—'} />
              <DetailItem label="Status" value={payment.status} />
              <DetailItem label="Created" value={formatDate(payment.createdAt)} />
              <DetailItem label="Updated" value={formatDate(payment.updatedAt)} />
              {payment.failureReason && <DetailItem label="Failure Reason" value={payment.failureReason} />}
            </dl>
          </div>

          {allocations.length > 0 && (
            <div className="mt-6 rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/60 to-white">
              <div className="flex items-center gap-2 border-b border-emerald-100 px-4 py-3">
                <Wallet size={15} className="text-emerald-600" />
                <h2 className="text-sm font-semibold text-slate-900">Your Share of This Payment</h2>
                {isSharedPayment && (
                  <span className="ml-auto inline-flex rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                    shared order
                  </span>
                )}
              </div>
              <div className="px-4">
                {isSharedPayment && (
                  <p className="border-b border-emerald-100 pb-2 pt-1 text-xs text-slate-500">
                    This payment covers other owners&apos; shops too — showing only your shops&apos; amounts.
                  </p>
                )}
                <PaymentAllocationCard
                  allocations={allocations}
                  currency={payment.currency}
                  shopLabel={shopLabel}
                  title="Payout by shop"
                  scopedCaption={isSharedPayment}
                />
              </div>
            </div>
          )}

          <div className="mt-6 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
              <PackageCheck size={15} className="text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900">Delivery</h2>
            </div>
            <dl className="grid gap-x-6 gap-y-4 px-4 py-4 sm:grid-cols-2">
              <DetailItem label="Delivery Status" value={deliveryLabel(payment.deliveryStatus ?? payment.order?.orderStatus)} />
              <DetailItem label="Order Status ID" value={payment.deliveryStatusId != null ? String(payment.deliveryStatusId) : (payment.order?.orderStatusId != null ? String(payment.order.orderStatusId) : '—')} />
              <DetailItem label="Tracking Number" value={payment.order?.trackingNumber || '—'} mono />
              <DetailItem label="Courier" value={payment.order ? `${payment.order.courierName || ''} ${payment.order.courierCode || ''}`.trim() : '—'} />
              <DetailItem label="Shipment Created" value={formatDate(payment.order?.shipmentCreatedAt ?? null)} />
              {payment.order?.trackingUrl && (
                <div className="sm:col-span-2">
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Tracking URL</dt>
                  <dd className="mt-1 text-xs text-emerald-600 hover:underline">
                    <a href={payment.order.trackingUrl} target="_blank" rel="noreferrer">{payment.order.trackingUrl}</a>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
              <Fingerprint size={15} className="text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900">Traceability</h2>
            </div>
            <dl className="space-y-3 px-4 py-4">
              <DetailItem label="Payment ID" value={payment.id} mono />
              <DetailItem label="Checkout ID" value={payment.checkoutId} mono />
              <DetailItem label="Reservation ID" value={payment.reservationId || '—'} mono />
              <DetailItem label="Correlation ID" value={payment.correlationId || '—'} mono />
              <DetailItem label="Gateway Payment ID" value={payment.gatewayPaymentId || '—'} mono />
            </dl>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
              <History size={15} className="text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900">Event Timeline</h2>
            </div>
            <ol className="space-y-0 px-4 py-4">
              {payment.events.length === 0 ? (
                <li className="text-xs text-slate-500">No events recorded.</li>
              ) : (
                payment.events.map((event) => {
                  const payload = event.payload
                  let payloadSummary = ''
                  if (event.type === 'WEBHOOK_RECEIVED' && payload && typeof payload === 'object') {
                    payloadSummary = (payload as Record<string, unknown>).id
                      ? `event ${String((payload as Record<string, unknown>).id)}`
                      : ''
                  }
                  return (
                    <li key={event.id} className="relative pl-4 pb-4 last:pb-0">
                      <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-slate-300" />
                      <div className="flex items-center justify-between gap-2">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${EVENT_STYLES[event.type] ?? 'bg-slate-100 text-slate-600'}`}>
                          {event.type}
                        </span>
                        <span className="text-[11px] text-slate-500">{formatDate(event.createdAt)}</span>
                      </div>
                      {payloadSummary && <p className="mt-1 text-[11px] text-slate-400">{payloadSummary}</p>}
                    </li>
                  )
                })
              )}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}

function DetailItem({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className={`mt-1 break-words text-xs ${mono ? 'font-mono' : ''} text-slate-800`}>{value}</dd>
    </div>
  )
}
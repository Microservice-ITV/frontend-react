import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Banknote, Check, ChevronRight, Clock, Copy, Hash, Mail, MessageSquare, Package, Phone, X } from 'lucide-react'
import { useAppSelector } from '@/app/hooks'
import { sellerOrderApi, type ShopApprovalDetail } from '../api/sellerOrderApi'

const formatDate = (value?: string | null): string => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatMoney = (value: number): string =>
  `Ks ${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-600',
  approved: 'bg-emerald-50 text-emerald-600',
  rejected: 'bg-red-50 text-red-600',
}

const customerInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

const SellerQuantityApprovalDetailPage = () => {
  const { checkoutId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const shopId = searchParams.get('shopId') ?? ''
  const authUserId = useAppSelector((state) => state.auth.user?.id ?? null)
  const [detail, setDetail] = useState<ShopApprovalDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [acting, setActing] = useState<'approve' | 'reject' | null>(null)
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!checkoutId || !shopId) {
      setDetail(null)
      setError('This quantity request could not be found.')
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    void sellerOrderApi.getShopApproval(checkoutId, shopId)
      .then((next) => {
        if (!cancelled) setDetail(next)
      })
      .catch(() => {
        if (!cancelled) {
          setDetail(null)
          setError('Unable to load this quantity request.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [checkoutId, shopId, refreshVersion])

  const pending = detail?.status === 'pending'
  const statusLabel = (detail?.status ?? 'pending').replaceAll('_', ' ').toUpperCase()
  const merchandiseTotal = (detail?.items ?? []).reduce((sum, item) => sum + item.line_total, 0)

  const decide = (action: 'approve' | 'reject') => {
    if (!detail) return
    setActing(action)
    setActionError(null)
    const request = action === 'approve'
      ? sellerOrderApi.approveShopOrder(detail.checkout_id, detail.shop_id, authUserId)
      : sellerOrderApi.rejectShopOrder(detail.checkout_id, detail.shop_id, authUserId, reason)
    void request
      .then(() => setRefreshVersion((value) => value + 1))
      .catch((caught: unknown) => {
        const apiError = caught && typeof caught === 'object' && 'response' in caught
          ? (caught as { response?: { data?: { error?: string } } }).response?.data?.error
          : null
        setActionError(apiError || `Unable to ${action} this request.`)
      })
      .finally(() => setActing(null))
  }

  return (
    <div className="space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-400">
        <Link to="/seller/overview" className="hover:text-slate-600">Dashboard</Link>
        <ChevronRight size={14} />
        <Link to="/seller/quantity-approvals" className="hover:text-slate-600">Quantity Approvals</Link>
        <ChevronRight size={14} />
        <span className="text-slate-700">Detail</span>
      </nav>

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading quantity request...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">{error}</div>
      )}

      {!loading && detail && (
        <>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[28px] font-bold tracking-tight text-slate-900">Quantity request</h1>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[detail.status] ?? 'bg-slate-100 text-slate-600'}`}>
                <Clock size={13} />
                {statusLabel}
              </span>
            </div>
            <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
              <Clock size={15} className="text-slate-400" />
              {formatDate(detail.created_at)}
            </p>
          </div>

          <section className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white md:grid-cols-3">
            <div className="flex items-center gap-3 border-b border-slate-100 p-5 md:border-b-0 md:border-r">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                <Package size={18} />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Items</p>
                <p className="text-2xl font-bold text-slate-900">{detail.quantity}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 border-b border-slate-100 p-5 md:border-b-0 md:border-r">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
                <Banknote size={18} />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Merchandise total</p>
                <p className="text-2xl font-bold text-slate-900">{formatMoney(merchandiseTotal)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 p-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-500">
                  <Hash size={18} />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Checkout</p>
                  <p className="truncate text-sm font-semibold text-slate-800">{detail.checkout_id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const write = navigator.clipboard?.writeText(detail.checkout_id)
                  if (!write) return
                  void write.then(() => {
                    setCopied(true)
                    window.setTimeout(() => setCopied(false), 1600)
                  }).catch(() => undefined)
                }}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </section>

          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <h2 className="border-b border-slate-100 px-5 py-4 text-base font-semibold text-slate-900">Product</h2>
                <div className="hidden grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,0.7fr))] gap-4 border-b border-slate-100 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400 md:grid">
                  <span>Item</span>
                  <span>Quantity</span>
                  <span>Price</span>
                  <span>Line total</span>
                </div>
                {detail.items.length === 0 && (
                  <p className="px-5 py-6 text-sm text-slate-500">No items on this request.</p>
                )}
                {detail.items.map((item, index) => (
                  <div
                    key={`${item.sku ?? item.title}:${index}`}
                    className="grid items-center gap-4 border-b border-slate-100 px-5 py-4 last:border-b-0 md:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,0.7fr))]"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{item.title}</p>
                      {item.sku && <p className="mt-0.5 truncate text-xs text-slate-400">{item.sku}</p>}
                    </div>
                    <p className="font-semibold text-slate-900">{item.qty}</p>
                    <p className="font-semibold text-slate-900">{formatMoney(item.price)}</p>
                    <p className="font-semibold text-slate-900">{formatMoney(item.line_total)}</p>
                  </div>
                ))}
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="text-base font-semibold text-slate-900">Decision</h2>
                {detail.rejection_reason && (
                  <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    Rejection reason: {detail.rejection_reason}
                  </p>
                )}
                {pending ? (
                  <>
                    <label htmlFor="rejection-reason" className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <MessageSquare size={16} className="text-slate-400" />
                      Reason for rejection
                    </label>
                    <textarea
                      id="rejection-reason"
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      rows={3}
                      maxLength={500}
                      placeholder="Optional. Saved with the request if you reject it."
                      className="mt-3 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
                    />
                    {actionError && <p className="mt-2 text-sm text-red-600">{actionError}</p>}
                    <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
                      <button
                        type="button"
                        disabled={acting !== null}
                        onClick={() => decide('reject')}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 disabled:opacity-50"
                      >
                        <X size={15} />
                        {acting === 'reject' ? 'Rejecting…' : 'Reject'}
                      </button>
                      <button
                        type="button"
                        disabled={acting !== null}
                        onClick={() => decide('approve')}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <Check size={15} />
                        {acting === 'approve' ? 'Approving…' : 'Approve'}
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="mt-4 text-sm text-slate-600">
                    {detail.status === 'approved'
                      ? detail.order_placed
                        ? 'Approved. The order has been placed for the customer.'
                        : 'This request is approved. The customer can place the order.'
                      : 'This request was rejected. The customer cannot place this order.'}
                  </p>
                )}
              </section>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-base font-semibold text-slate-900">Customer</h2>
              <div className="mt-4 flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                  {customerInitials(detail.customer_name || '')}
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Name</p>
                  <p className="truncate text-sm font-semibold text-slate-900">{detail.customer_name || 'No name'}</p>
                </div>
              </div>
              <div className="mt-5 flex items-start gap-3">
                <Mail size={16} className="mt-0.5 shrink-0 text-slate-400" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Email</p>
                  <p className="break-all text-sm font-semibold text-slate-900">{detail.customer_email || 'No email'}</p>
                </div>
              </div>
              <div className="mt-5 flex items-start gap-3">
                <Phone size={16} className="mt-0.5 shrink-0 text-slate-400" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Phone</p>
                  <p className="text-sm font-semibold text-slate-900">{detail.customer_phone || 'No phone'}</p>
                </div>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  )
}

export default SellerQuantityApprovalDetailPage

import { useState, type ReactNode } from 'react'
import { Calendar, Check, Eye, Package, UserRound, X } from 'lucide-react'
import type { ShopApprovalItem } from '../api/sellerOrderApi'

const formatMoney = (value: number): string =>
  `Ks ${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const formatWhen = (value?: string | null): { date: string; time: string } => {
  if (!value) return { date: '—', time: '' }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return { date: '—', time: '' }
  return {
    date: parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: parsed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  }
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending Review',
  approved: 'Approved',
  rejected: 'Declined',
}

type QuantityRequestCardProps = {
  createdAt?: string | null
  status: string
  quantity: number
  customerName: string
  customerImage?: string | null
  items: ShopApprovalItem[]
  merchandiseTotal: number
  pending: boolean
  requestKey: string
  savedReason?: string | null
  onView?: () => void
  onApprove?: () => Promise<void>
  onDecline?: (reason: string) => Promise<void>
  children?: ReactNode
}

const QuantityRequestCard = ({
  createdAt,
  status,
  quantity,
  customerName,
  customerImage,
  items,
  merchandiseTotal,
  pending,
  requestKey,
  savedReason,
  onView,
  onApprove,
  onDecline,
  children,
}: QuantityRequestCardProps) => {
  const [reason, setReason] = useState('')
  const [acting, setActing] = useState<'approve' | 'decline' | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const when = formatWhen(createdAt)
  const firstItem = items[0]
  const extraItems = Math.max(0, items.length - 1)
  const itemLabel = firstItem
    ? `${firstItem.title} × ${firstItem.qty}${extraItems > 0 ? ` +${extraItems}` : ''}`
    : 'No items'

  const run = (action: 'approve' | 'decline') => {
    const request = action === 'approve' ? onApprove?.() : onDecline?.(reason)
    if (!request) return
    setActing(action)
    setActionError(null)
    void request
      .catch(() => setActionError(action === 'approve' ? 'Unable to approve this request.' : 'Unable to decline this request.'))
      .finally(() => setActing(null))
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 p-4 xl:flex-row xl:items-stretch">
        <div className="flex min-w-[148px] flex-col justify-center gap-2 border-slate-100 xl:border-r xl:pr-4">
          <p className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700">
            <Calendar size={15} className="text-sky-500" />
            {when.date}
          </p>
          {when.time && <p className="pl-5 text-xs text-slate-400">{when.time}</p>}
          <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
            status === 'approved'
              ? 'bg-emerald-50 text-emerald-600'
              : status === 'rejected'
                ? 'bg-red-50 text-red-600'
                : 'bg-sky-50 text-sky-600'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${
              status === 'approved' ? 'bg-emerald-500' : status === 'rejected' ? 'bg-red-500' : 'bg-sky-500'
            }`} />
            {STATUS_LABEL[status] ?? status}
          </span>
          <div className="pt-1">
            <p className="text-[11px] text-slate-400">Quantity</p>
            <p className="text-2xl font-semibold leading-none text-slate-800">{quantity}</p>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:items-center">
          <div className="flex items-center gap-3">
            {customerImage ? (
              <img src={customerImage} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-500">
                <UserRound size={18} />
              </span>
            )}
            <div className="min-w-0">
              <p className="text-[11px] text-slate-400">Customer</p>
              <p className="truncate text-sm font-semibold text-slate-800">{customerName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {firstItem?.image_url ? (
              <img src={firstItem.image_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                <Package size={18} />
              </span>
            )}
            <div className="min-w-0">
              <p className="text-[11px] text-slate-400">Items</p>
              <p className="truncate text-sm font-semibold text-slate-800" title={itemLabel}>{itemLabel}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
              <Package size={18} />
            </span>
            <div>
              <p className="text-[11px] text-slate-400">Quantity</p>
              <p className="text-sm font-semibold text-slate-800">{quantity}</p>
              <p className="text-[11px] text-slate-400">Order total {formatMoney(merchandiseTotal)}</p>
            </div>
          </div>

          {onView && (
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <Eye size={18} />
              </span>
              <div>
                <p className="text-[11px] text-slate-400">Detail</p>
                <button
                  type="button"
                  onClick={onView}
                  className="text-sm font-semibold text-slate-700 hover:text-slate-900"
                >
                  View detail
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex min-w-[240px] flex-col justify-center gap-2 border-slate-100 xl:border-l xl:pl-4">
          <p className="text-xs font-medium text-slate-500">Decision</p>
          {pending ? (
            <>
              <label className="text-[11px] text-slate-400" htmlFor={`decline-reason-${requestKey}`}>
                Reason if you decline
              </label>
              <textarea
                id={`decline-reason-${requestKey}`}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={2}
                maxLength={500}
                placeholder="Add reason (optional)"
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none placeholder:text-slate-300 focus:border-sky-400"
              />
              {actionError && <p className="text-xs text-red-600">{actionError}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={acting !== null}
                  onClick={() => run('approve')}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
                >
                  <Check size={15} />
                  {acting === 'approve' ? 'Approving…' : 'Approve'}
                </button>
                <button
                  type="button"
                  disabled={acting !== null}
                  onClick={() => run('decline')}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 disabled:opacity-50"
                >
                  <X size={15} />
                  {acting === 'decline' ? 'Declining…' : 'Decline'}
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-600">
              {status === 'approved'
                ? 'Approved. The customer can place this order.'
                : savedReason
                  ? `Declined. ${savedReason}`
                  : 'Declined. The customer cannot place this order.'}
            </p>
          )}
        </div>
      </div>
      {children}
    </article>
  )
}

export default QuantityRequestCard

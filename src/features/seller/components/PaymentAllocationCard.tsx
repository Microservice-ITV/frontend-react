import type { PaymentAllocation } from '../api/sellerOrderApi'

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

type Props = {
  /** Per-shop payout splits restricted to this seller's shops. */
  allocations: PaymentAllocation[]
  currency: string
  shopLabel: (shopId: string) => string
  title?: string
  /** Append the "(your shops only)" qualifier to the title. */
  scopedCaption?: boolean
}

/**
 * Per-shop payout breakdown of a payment, shared by the seller order detail
 * and payment detail pages so amounts read identically everywhere.
 */
export default function PaymentAllocationCard({
  allocations,
  currency,
  shopLabel,
  title = 'Payment Allocation',
  scopedCaption = false,
}: Props) {
  if (allocations.length === 0) return null

  const totalPayout = Number(
    allocations.reduce((carry, allocation) => carry + allocation.sellerAmount, 0).toFixed(2),
  )

  return (
    <div className="py-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {title}
        {scopedCaption ? ' (your shops only)' : ''}
      </p>
      <div className="space-y-2">
        {allocations.map((allocation) => (
          <div
            key={allocation.id}
            className="rounded-lg border border-slate-100 bg-slate-50/60 p-3 text-xs"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate font-medium text-slate-800">
                {shopLabel(allocation.shopId)}
              </span>
              <span className="shrink-0 text-right text-slate-500">
                {formatMoney(allocation.orderAmount, currency)}
                {allocation.discountShare > 0 && (
                  <span className="ml-1 text-[11px] text-emerald-600">
                    (after −{formatMoney(allocation.discountShare, currency)} discount)
                  </span>
                )}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1 text-slate-500">
              <span>Shipping −{formatMoney(allocation.shippingShare, currency)}</span>
              <span className="text-right">
                Platform fee −{formatMoney(allocation.platformFee, currency)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2">
              <span className="font-semibold text-slate-700">Payout</span>
              <span className="font-bold text-emerald-700">
                {formatMoney(allocation.sellerAmount, currency)}
              </span>
            </div>
          </div>
        ))}
        {allocations.length > 1 && (
          <div className="flex items-center justify-between pt-1 text-sm">
            <span className="text-slate-600">Total Payout</span>
            <span className="text-base font-bold tracking-tight text-slate-900">
              {formatMoney(totalPayout, currency)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

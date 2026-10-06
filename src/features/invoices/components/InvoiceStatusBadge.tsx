import type { InvoiceStatus } from '@/lib/api/invoiceClient'

export type InvoiceStatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const TONE_CLASSES: Record<InvoiceStatusTone, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  warning: 'bg-amber-50 text-amber-700 ring-amber-600/15',
  danger: 'bg-rose-50 text-rose-700 ring-rose-600/15',
  info: 'bg-sky-50 text-sky-700 ring-sky-600/15',
  neutral: 'bg-slate-100 text-slate-600 ring-slate-500/15',
}

const DOT_CLASSES: Record<InvoiceStatusTone, string> = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  info: 'bg-sky-500',
  neutral: 'bg-slate-400',
}

/**
 * Visual mapping only — the invoice status values themselves are never altered.
 * Consumers keep owning their own status labels.
 */
export const INVOICE_STATUS_TONES: Record<string, InvoiceStatusTone> = {
  PAID: 'success',
  UNPAID: 'warning',
  PENDING_VERIFICATION: 'info',
  REJECTED: 'danger',
  VOID: 'neutral',
  REFUNDED: 'info',
}

type InvoiceStatusBadgeProps = {
  status: InvoiceStatus | string
  label: string
  size?: 'sm' | 'md'
  className?: string
}

export const getInvoiceStatusTone = (status: InvoiceStatus | string): InvoiceStatusTone =>
  INVOICE_STATUS_TONES[status] ?? 'neutral'

const InvoiceStatusBadge = ({ status, label, size = 'md', className = '' }: InvoiceStatusBadgeProps) => {
  const tone = getInvoiceStatusTone(status)
  const compact = size === 'sm'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold uppercase tracking-[0.08em] ring-1 ring-inset transition ${TONE_CLASSES[tone]} ${
        compact ? 'px-2 py-1 text-[10px]' : 'px-2.5 py-1.5 text-[11px]'
      } ${className}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT_CLASSES[tone]}`} aria-hidden="true" />
      {label}
    </span>
  )
}

export default InvoiceStatusBadge
import type { ReactNode } from 'react'

export type InvoiceStatTone = 'emerald' | 'amber' | 'sky' | 'slate' | 'rose' | 'violet'

const TONE_ICON_CLASSES: Record<InvoiceStatTone, string> = {
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  sky: 'bg-sky-50 text-sky-600',
  slate: 'bg-slate-100 text-slate-600',
  rose: 'bg-rose-50 text-rose-600',
  violet: 'bg-violet-50 text-violet-600',
}

type InvoiceStatCardProps = {
  label: string
  value: string
  valueClassName?: string
  hint?: string
  icon?: ReactNode
  tone?: InvoiceStatTone
}

/** Compact summary card used by the invoice pages. Values are supplied by the caller. */
const InvoiceStatCard = ({ label, value, valueClassName = 'truncate text-lg sm:text-xl', hint, icon, tone = 'slate' }: InvoiceStatCardProps) => (
  <div className="rounded-sm border border-slate-200 bg-white px-3 py-2.5 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:px-4 sm:py-3.5">
    <div className="flex items-start justify-between gap-2 sm:gap-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 sm:text-[11px]">{label}</p>
      {icon && (
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-sm sm:h-7 sm:w-7 ${TONE_ICON_CLASSES[tone]}`}>
          {icon}
        </span>
      )}
    </div>
    <p className={`mt-1 font-semibold tracking-tight text-slate-900 sm:mt-2 ${valueClassName}`} title={value}>{value}</p>
    {hint && <p className="mt-0.5 hidden truncate text-[11px] text-slate-400 sm:block">{hint}</p>}
  </div>
)

export default InvoiceStatCard

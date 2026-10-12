import type { ReactNode } from 'react'
import { Loader2, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react'
import clsx from 'clsx'
import type { BadgeTone } from './StatusBadge'

export type StatCardTone = Extract<BadgeTone, 'brand' | 'info' | 'warning' | 'danger' | 'neutral' | 'success'>

const TONE_CHIP_CLASSES: Record<StatCardTone, string> = {
  brand: 'bg-[var(--dni-primary-soft)] text-[var(--dni-primary-600)]',
  success: 'bg-emerald-50 text-emerald-600',
  info: 'bg-sky-50 text-sky-600',
  warning: 'bg-amber-50 text-amber-600',
  danger: 'bg-rose-50 text-rose-600',
  neutral: 'bg-slate-100 text-slate-600',
}

export type StatCardProps = {
  title: string
  value: ReactNode
  icon: LucideIcon
  tone?: StatCardTone
  hint?: string
  trend?: {
    value: string
    isPositive: boolean
  }
  loading?: boolean
  className?: string
}

const StatCard = ({
  title,
  value,
  icon: Icon,
  tone = 'brand',
  hint,
  trend,
  loading = false,
  className,
}: StatCardProps) => (
  <div
    className={clsx(
      'min-w-0 rounded-xl border border-slate-200 bg-white p-4',
      className,
    )}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-[10px] font-medium uppercase tracking-wide text-slate-500">
          {title}
        </p>
        <p className="mt-1.5 truncate text-xl font-bold text-slate-900">
          {loading ? '—' : value}
        </p>
        {trend && !loading && (
          <p
            className={clsx(
              'mt-0.5 flex items-center gap-1 text-xs font-medium',
              trend.isPositive ? 'text-emerald-600' : 'text-rose-600',
            )}
          >
            {trend.isPositive ? (
              <TrendingUp size={12} strokeWidth={2.5} />
            ) : (
              <TrendingDown size={12} strokeWidth={2.5} />
            )}
            {trend.value}
          </p>
        )}
        {!trend && hint && (
          <p className="mt-0.5 truncate text-xs text-slate-500">{hint}</p>
        )}
      </div>
      <div
        className={clsx(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          TONE_CHIP_CLASSES[tone],
        )}
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
        ) : (
          <Icon size={16} />
        )}
      </div>
    </div>
  </div>
)

export default StatCard

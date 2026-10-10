import clsx from 'clsx'

export type BadgeTone =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'brand'
  | 'neutral'

export const BADGE_TONE_CLASSES: Record<BadgeTone, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  warning: 'bg-amber-50 text-amber-700 ring-amber-600/15',
  danger: 'bg-rose-50 text-rose-700 ring-rose-600/15',
  info: 'bg-sky-50 text-sky-700 ring-sky-600/15',
  brand: 'bg-[var(--dni-primary-soft)] text-[var(--dni-primary-700)] ring-[var(--dni-primary-600)]/15',
  neutral: 'bg-slate-100 text-slate-600 ring-slate-500/15',
}

export type StatusBadgeProps = {
  label: string
  tone?: BadgeTone
  size?: 'sm' | 'md'
  className?: string
  title?: string
}

const StatusBadge = ({
  label,
  tone = 'neutral',
  size = 'sm',
  className,
  title,
}: StatusBadgeProps) => (
  <span
    title={title}
    className={clsx(
      'inline-flex items-center gap-1 rounded-full font-medium ring-1 ring-inset whitespace-nowrap',
      BADGE_TONE_CLASSES[tone],
      size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
      className,
    )}
  >
    {label}
  </span>
)

export default StatusBadge

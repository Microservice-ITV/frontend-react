import type { BundleStatus } from '../types/bundleTypes'

const STATUS_STYLES: Record<BundleStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  ACTIVE: 'bg-[var(--dni-primary-100)] text-[var(--dni-primary-700)]',
  PAUSED: 'bg-amber-100 text-amber-700',
  ENDED: 'bg-slate-200 text-slate-500',
}

const STATUS_LABELS: Record<BundleStatus, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  ENDED: 'Ended',
}

const BundleStatusBadge = ({ status }: { status: BundleStatus }) => (
  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status] ?? STATUS_STYLES.DRAFT}`}>
    {STATUS_LABELS[status] ?? status}
  </span>
)

export default BundleStatusBadge

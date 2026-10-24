import type { ReactNode } from 'react'

type DetailRowProps = {
  label: string
  value: ReactNode
  /** Tighter vertical spacing for compact modals. */
  dense?: boolean
}

/** Label + value row used inside detail modals (no card boxes). */
const DetailRow = ({ label, value, dense = false }: DetailRowProps) => (
  <div
    className={`grid min-w-0 grid-cols-[8.5rem_minmax(0,1fr)] items-start gap-x-3 border-b border-slate-100 last:border-b-0 sm:grid-cols-[9.5rem_minmax(0,1fr)] ${
      dense ? 'py-1.5' : 'py-2.5'
    }`}
  >
    <p className="text-xs font-medium text-slate-500">{label}</p>
    <div className="break-words text-sm font-semibold text-slate-900">{value}</div>
  </div>
)

export default DetailRow

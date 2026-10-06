import type { ReactNode } from 'react'

type InvoiceEmptyStateProps = {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  compact?: boolean
}

/** Shared empty state so every invoice surface reads the same way. */
const InvoiceEmptyState = ({ icon, title, description, action, compact = false }: InvoiceEmptyStateProps) => (
  <div className={`flex flex-col items-center justify-center text-center ${compact ? 'px-4 py-10' : 'px-6 py-16'}`}>
    {icon && (
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-300 ring-1 ring-slate-100">
        {icon}
      </div>
    )}
    <p className="mt-4 text-sm font-semibold text-slate-900">{title}</p>
    {description && <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
)

export default InvoiceEmptyState
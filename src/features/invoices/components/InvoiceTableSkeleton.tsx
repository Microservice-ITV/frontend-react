type InvoiceTableSkeletonProps = {
  rows?: number
  className?: string
}

/** Shared loading placeholder for invoice tables. */
const InvoiceTableSkeleton = ({ rows = 4, className = '' }: InvoiceTableSkeletonProps) => (
  <div className={`divide-y divide-slate-100 ${className}`}>
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="flex items-center gap-4 px-4 py-4 sm:px-5">
        <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-slate-100" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
          <div className="h-2.5 w-1/5 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="hidden h-3 w-24 animate-pulse rounded bg-slate-100 sm:block" />
        <div className="h-5 w-20 shrink-0 animate-pulse rounded-full bg-slate-100" />
      </div>
    ))}
  </div>
)

export default InvoiceTableSkeleton
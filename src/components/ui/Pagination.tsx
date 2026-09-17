type PageItem = number | 'ellipsis-start' | 'ellipsis-end'

function buildPageItems(current: number, total: number): PageItem[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const windowStart = Math.max(2, current - 1)
  const windowEnd = Math.min(total - 1, current + 1)
  const hasLeadEllipsis = windowStart > 2
  const hasTrailEllipsis = windowEnd < total - 1

  const items: PageItem[] = [1]
  if (hasLeadEllipsis) {
    items.push('ellipsis-start')
  } else {
    for (let p = 2; p < windowStart; p++) items.push(p)
  }
  for (let p = windowStart; p <= windowEnd; p++) items.push(p)
  if (hasTrailEllipsis) {
    items.push('ellipsis-end')
  } else {
    for (let p = windowEnd + 1; p < total; p++) items.push(p)
  }
  items.push(total)
  return items
}

const baseButtonClass =
  'flex h-9 min-w-9 items-center justify-center border px-1 text-sm transition-colors'

const inactiveButtonClass =
  'cursor-pointer border-[#e2e2e2] bg-white text-[var(--dni-primary)] hover:bg-[var(--dni-primary-100)] hover:text-[var(--dni-primary-700)] disabled:cursor-not-allowed disabled:text-slate-400'

const activeButtonClass =
  'cursor-default border-[var(--dni-primary)] bg-[var(--dni-primary)] font-medium text-white shadow-[0_1px_3px_rgba(0,0,0,0.15)]'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

const Pagination = ({
  page,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) => {
  const safeTotal = Math.max(1, totalPages)
  const safePage = Math.min(Math.max(1, page), safeTotal)
  const items = buildPageItems(safePage, safeTotal)

  return (
    <nav
      aria-label="Pagination"
      className={`flex flex-wrap items-center gap-2 ${className ?? ''}`}
    >
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, safePage - 1))}
        disabled={safePage === 1}
        aria-label="Previous page"
        className={`${baseButtonClass} ${inactiveButtonClass}`}
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden>
          <path d="M12.3 4.7 7.6 10l4.7 5.3-1 1.3L5.4 10l5.9-6.6 1 1.3z" />
        </svg>
      </button>

      {items.map((item) => {
        if (item === 'ellipsis-start' || item === 'ellipsis-end') {
          const jump =
            item === 'ellipsis-start'
              ? Math.max(1, safePage - 5)
              : Math.min(safeTotal, safePage + 5)
          const isDisabled = jump === safePage
          return (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(jump)}
              disabled={isDisabled}
              aria-label={
                item === 'ellipsis-start' ? 'Go back 5 pages' : 'Go forward 5 pages'
              }
              className={`${baseButtonClass} ${inactiveButtonClass}`}
            >
              <span className="flex items-end gap-[3px]" aria-hidden>
                <span className="h-1 w-1 rounded-full bg-current" />
                <span className="h-1 w-1 rounded-full bg-current" />
                <span className="h-1 w-1 rounded-full bg-current" />
              </span>
            </button>
          )
        }

        const isCurrent = item === safePage
        return (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            aria-current={isCurrent ? 'page' : undefined}
            className={`${baseButtonClass} ${
              isCurrent ? activeButtonClass : inactiveButtonClass
            }`}
          >
            {item}
          </button>
        )
      })}

      <button
        type="button"
        onClick={() => onPageChange(Math.min(safeTotal, safePage + 1))}
        disabled={safePage === safeTotal}
        aria-label="Next page"
        className={`${baseButtonClass} ${inactiveButtonClass}`}
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden>
          <path d="m7.7 4.7 1-1.3 5.9 6.6-5.9 6.6-1-1.3 4.7-5.3-4.7-5.3z" />
        </svg>
      </button>
    </nav>
  )
}

export default Pagination
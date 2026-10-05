import { ChevronLeft, ChevronRight } from 'lucide-react'

type DataTablePaginationProps = {
  page: number
  totalPages: number
  rowsPerPage: number
  totalItems: number
  onPageChange: (page: number) => void
  onRowsPerPageChange: (value: number) => void
  rowsPerPageOptions?: number[]
  itemLabel?: string
}

const DataTablePagination = ({
  page,
  totalPages,
  rowsPerPage,
  totalItems,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [10, 20, 50],
  itemLabel = 'results',
}: DataTablePaginationProps) => {
  const safeTotalPages = Math.max(1, totalPages)
  const safePage = Math.min(Math.max(1, page), safeTotalPages)
  const start = totalItems === 0 ? 0 : (safePage - 1) * rowsPerPage + 1
  const end = Math.min(safePage * rowsPerPage, totalItems)
  const pageItems: Array<number | 'ellipsis'> =
    safeTotalPages <= 5
      ? Array.from({ length: safeTotalPages }, (_, index) => index + 1)
      : [
          1,
          ...(safePage > 3 ? ['ellipsis' as const] : []),
          ...Array.from(
            { length: Math.min(safeTotalPages - 1, safePage + 1) - Math.max(2, safePage - 1) + 1 },
            (_, index) => Math.max(2, safePage - 1) + index,
          ),
          ...(safePage < safeTotalPages - 2 ? ['ellipsis' as const] : []),
          safeTotalPages,
        ]

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-slate-600" aria-live="polite">
        Showing <span className="font-semibold text-slate-900">{start}-{end}</span> of{' '}
        <span className="font-semibold text-slate-900">{totalItems}</span> {itemLabel}
      </p>
      <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-slate-600">
            Rows per page
            <select
              value={rowsPerPage}
              onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm outline-none transition hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              {rowsPerPageOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
        <nav aria-label="Table pagination" className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, safePage - 1))}
            disabled={safePage === 1}
            aria-label="Go to previous page"
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={14} />
            <span className="hidden sm:inline">Previous</span>
          </button>
          {pageItems.map((item, index) =>
            item === 'ellipsis' ? (
              <span key={`ellipsis-${index}`} className="px-1 text-xs text-slate-400" aria-hidden="true">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                aria-label={`Go to page ${item}`}
                aria-current={safePage === item ? 'page' : undefined}
                className={`h-8 min-w-8 rounded-lg px-2 text-xs font-medium transition ${
                  safePage === item
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                {item}
              </button>
            ),
          )}
          <button
            type="button"
            onClick={() => onPageChange(Math.min(safeTotalPages, safePage + 1))}
            disabled={safePage === safeTotalPages}
            aria-label="Go to next page"
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight size={14} />
          </button>
        </nav>
      </div>
    </div>
  )
}

export default DataTablePagination
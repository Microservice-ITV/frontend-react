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

function pageWindow(current: number, total: number): Array<number | 'ellipsis'> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  const pages = new Set<number>([1, total, current - 1, current, current + 1])
  if (current <= 3) {
    pages.add(2)
    pages.add(3)
    pages.add(4)
  }
  if (current >= total - 2) {
    pages.add(total - 1)
    pages.add(total - 2)
    pages.add(total - 3)
  }

  const sorted = [...pages].filter((value) => value >= 1 && value <= total).sort((a, b) => a - b)
  const items: Array<number | 'ellipsis'> = []
  sorted.forEach((value, index) => {
    if (index > 0 && value - sorted[index - 1] > 1) items.push('ellipsis')
    items.push(value)
  })
  return items
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

  return (
    <div className="flex flex-col gap-4 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-slate-600">
        Showing {start}-{end} of {totalItems} {itemLabel}
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600">Rows</span>
          <select
            value={rowsPerPage}
            onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
            className="rounded border border-slate-200 bg-white px-2 py-1 text-xs"
          >
            {rowsPerPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, safePage - 1))}
            disabled={safePage === 1}
            className="rounded px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
          >
            Previous
          </button>
          {pageWindow(safePage, safeTotalPages).map((item, index) =>
            item === 'ellipsis' ? (
              <span key={`ellipsis-${index}`} className="px-1 text-xs text-slate-400">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                className={`min-w-8 rounded px-3 py-1.5 text-xs cursor-pointer ${
                  safePage === item
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
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
            className="rounded px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

export default DataTablePagination
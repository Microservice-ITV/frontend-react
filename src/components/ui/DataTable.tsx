import { useMemo, useState, type ReactNode } from 'react'
import { ChevronDown, ChevronUp, Inbox, type LucideIcon } from 'lucide-react'
import clsx from 'clsx'
import DataTablePagination from './DataTablePagination'

export type SortDirection = 'asc' | 'desc'

export type DataTableColumn<T> = {
  key: string
  header: ReactNode
  render: (row: T, index: number) => ReactNode
  /** Enables sorting for the column (client-side). */
  sortValue?: (row: T) => string | number
  align?: 'left' | 'center' | 'right'
  width?: string
  /** Tailwind breakpoint at which the column is hidden (e.g. 'md', 'lg'). */
  hideBelow?: 'sm' | 'md' | 'lg' | 'xl'
}

export type DataTableProps<T> = {
  columns: Array<DataTableColumn<T>>
  rows: T[]
  rowKey: (row: T, index: number) => string
  loading?: boolean
  error?: string | null
  emptyMessage?: string
  emptyIcon?: LucideIcon
  /** Client-side sorting + pagination driven by the table itself. */
  clientPaginated?: boolean
  rowsPerPageOptions?: number[]
  initialRowsPerPage?: number
  itemLabel?: string
  /** Replaces the built-in client pagination footer (e.g. a custom footer). */
  footer?: ReactNode
  minWidth?: string
  fixedLayout?: boolean
  /** Renders the table without its own card, so a parent can wrap it. */
  embedded?: boolean
  onRowClick?: (row: T) => void
}

const ALIGN_CLASSES = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const

const HIDE_BELOW_CLASSES = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
  xl: 'hidden xl:table-cell',
} as const

function pageWindow(current: number, total: number): Array<number | 'ellipsis'> {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)

  const pages = new Set<number>([1, total, current - 1, current, current + 1])
  if (current <= 3) [2, 3, 4].forEach((value) => pages.add(value))
  if (current >= total - 2) {
    ;[total - 1, total - 2, total - 3].forEach((value) => pages.add(value))
  }

  const sorted = [...pages]
    .filter((value) => value >= 1 && value <= total)
    .sort((a, b) => a - b)
  const items: Array<number | 'ellipsis'> = []
  sorted.forEach((value, index) => {
    if (index > 0 && value - sorted[index - 1] > 1) items.push('ellipsis')
    items.push(value)
  })
  return items
}

function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  error = null,
  emptyMessage = 'No results found.',
  emptyIcon: EmptyIcon = Inbox,
  clientPaginated = true,
  rowsPerPageOptions = [10, 20, 50],
  initialRowsPerPage = 10,
  itemLabel = 'results',
  footer,
  minWidth = '860px',
  fixedLayout = false,
  embedded = false,
  onRowClick,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; direction: SortDirection } | null>(
    null,
  )
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage)

  const sortedRows = useMemo(() => {
    if (!sort) return rows
    const column = columns.find((item) => item.key === sort.key)
    if (!column?.sortValue) return rows

    const factor = sort.direction === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const left = column.sortValue!(a)
      const right = column.sortValue!(b)
      if (typeof left === 'number' && typeof right === 'number') {
        return (left - right) * factor
      }
      return String(left).localeCompare(String(right)) * factor
    })
  }, [rows, sort, columns])

  const totalItems = sortedRows.length
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage))
  const safePage = Math.min(page, totalPages)
  const visibleRows = clientPaginated
    ? sortedRows.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage)
    : sortedRows

  const toggleSort = (column: DataTableColumn<T>) => {
    if (!column.sortValue) return
    setPage(1)
    setSort((current) => {
      if (current?.key !== column.key) {
        return { key: column.key, direction: 'asc' }
      }
      return current.direction === 'asc'
        ? { key: column.key, direction: 'desc' }
        : null
    })
  }

  const colSpan = columns.length

  const body = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan={colSpan} className="px-4 py-8 text-center text-sm text-slate-500">
            Loading…
          </td>
        </tr>
      )
    }

    if (error) {
      return (
        <tr>
          <td colSpan={colSpan} className="px-4 py-8 text-center text-sm text-rose-600">
            {error}
          </td>
        </tr>
      )
    }

    if (visibleRows.length === 0) {
      return (
        <tr>
          <td colSpan={colSpan} className="px-4 py-8 text-center">
            <span className="inline-flex flex-col items-center gap-2 text-sm text-slate-500">
              <EmptyIcon size={22} className="text-slate-400" aria-hidden="true" />
              {emptyMessage}
            </span>
          </td>
        </tr>
      )
    }

    return visibleRows.map((row, index) => (
      <tr
        key={rowKey(row, index)}
        onClick={onRowClick ? () => onRowClick(row) : undefined}
        className={clsx(
          'border-b border-slate-100 last:border-0 hover:bg-slate-50',
          onRowClick && 'cursor-pointer',
        )}
      >
        {columns.map((column) => (
          <td
            key={column.key}
            style={column.width ? { width: column.width } : undefined}
            className={clsx(
              'px-3 py-2 text-xs text-slate-700',
              ALIGN_CLASSES[column.align ?? 'left'],
              column.hideBelow && HIDE_BELOW_CLASSES[column.hideBelow],
            )}
          >
            {column.render(row, index)}
          </td>
        ))}
      </tr>
    ))
  }

  return (
    <div className={embedded ? undefined : 'overflow-hidden rounded-xl border border-slate-200 bg-white'}>
      <div className="overflow-x-auto">
        <table className={clsx('w-full', fixedLayout && 'table-fixed')} style={{ minWidth }}>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {columns.map((column) => {
                const active = sort?.key === column.key
                return (
                  <th
                    key={column.key}
                    scope="col"
                    style={column.width ? { width: column.width } : undefined}
                    className={clsx(
                      'px-3 py-2 text-xs font-medium text-slate-600',
                      ALIGN_CLASSES[column.align ?? 'left'],
                      column.hideBelow && HIDE_BELOW_CLASSES[column.hideBelow],
                    )}
                  >
                    {column.sortValue ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column)}
                        className={clsx(
                          'inline-flex cursor-pointer items-center gap-1 hover:text-slate-900',
                          active && 'text-[var(--dni-primary)]',
                        )}
                      >
                        {column.header}
                        {active ? (
                          sort!.direction === 'asc' ? (
                            <ChevronUp size={13} />
                          ) : (
                            <ChevronDown size={13} />
                          )
                        ) : (
                          <ChevronDown size={13} className="text-slate-300" />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>{body()}</tbody>
        </table>
      </div>

      {footer ??
        (clientPaginated && (
          <DataTablePagination
            page={safePage}
            totalPages={totalPages}
            rowsPerPage={rowsPerPage}
            totalItems={totalItems}
            onPageChange={setPage}
            onRowsPerPageChange={(value) => {
              setRowsPerPage(value)
              setPage(1)
            }}
            rowsPerPageOptions={rowsPerPageOptions}
            itemLabel={itemLabel}
          />
        ))}
    </div>
  )
}

export default DataTable

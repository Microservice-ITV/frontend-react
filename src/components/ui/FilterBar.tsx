import type { ReactNode } from 'react'
import { Search } from 'lucide-react'
import clsx from 'clsx'

export type FilterOption = {
  value: string
  label: string
}

export type FilterSelectField = {
  key: string
  label: string
  value: string
  options: FilterOption[]
  onChange: (value: string) => void
  /** Label of the empty option ('All …'). Omit to hide the empty option. */
  allLabel?: string
  className?: string
}

export type FilterDateRange = {
  from: string
  to: string
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
}

export type FilterBarProps = {
  search?: {
    value: string
    onChange: (value: string) => void
    placeholder?: string
  }
  selects?: FilterSelectField[]
  dateRange?: FilterDateRange
  /** Trailing controls (buttons, role specific selectors…). */
  actions?: ReactNode
  /** Extra controls rendered between the search box and the actions. */
  children?: ReactNode
  className?: string
}

const CONTROL_CLASS =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[var(--dni-primary)] focus:ring-1 focus:ring-[var(--dni-primary)] placeholder:text-slate-400'

const FieldLabel = ({ children }: { children: ReactNode }) => (
  <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">
    {children}
  </span>
)

const FilterBar = ({
  search,
  selects = [],
  dateRange,
  actions,
  children,
  className,
}: FilterBarProps) => {
  const hasControls =
    Boolean(search) || selects.length > 0 || Boolean(dateRange) || Boolean(children)

  if (!hasControls && !actions) return null

  return (
    <div
      className={clsx(
        'flex flex-col gap-3 rounded-xl border border-[var(--dni-border)] bg-white p-3',
        className,
      )}
    >
      <div className="flex flex-wrap items-end gap-3">
        {search && (
          <div className="min-w-[200px] flex-1">
            <FieldLabel>Search</FieldLabel>
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search.value}
                onChange={(event) => search.onChange(event.target.value)}
                placeholder={search.placeholder ?? 'Search…'}
                className={clsx(CONTROL_CLASS, 'pl-9')}
              />
            </div>
          </div>
        )}

        {selects.map((field) => (
          <div
            key={field.key}
            className={clsx('min-w-[150px]', field.className ?? 'flex-1')}
          >
            <FieldLabel>{field.label}</FieldLabel>
            <select
              value={field.value}
              onChange={(event) => field.onChange(event.target.value)}
              className={clsx(CONTROL_CLASS, 'cursor-pointer')}
            >
              {field.allLabel !== undefined && (
                <option value="">{field.allLabel}</option>
              )}
              {field.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {dateRange && (
          <div>
            <FieldLabel>Date range</FieldLabel>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateRange.from}
                onChange={(event) => dateRange.onFromChange(event.target.value)}
                className={clsx(CONTROL_CLASS, 'w-[150px]')}
                aria-label="From date"
              />
              <span className="text-xs text-slate-400">→</span>
              <input
                type="date"
                value={dateRange.to}
                onChange={(event) => dateRange.onToChange(event.target.value)}
                className={clsx(CONTROL_CLASS, 'w-[150px]')}
                aria-label="To date"
              />
            </div>
          </div>
        )}

        {children}

        {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

export default FilterBar

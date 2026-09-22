import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import { ChevronDown, Loader2, Search } from 'lucide-react'

export type SearchableSelectOption = {
  value: string
  label: string
  disabled?: boolean
}

/**
 * - `search-and-scroll`: filter by typing + list has max height and scrolls
 * - `search-only`: filter by typing; list grows with results (no inner scroll cap)
 * - `scroll-only`: no search field; long lists scroll inside a max-height panel
 */
export type SearchableSelectMode = 'search-and-scroll' | 'search-only' | 'scroll-only'

export type SearchableSelectProps = {
  id?: string
  options: SearchableSelectOption[]
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  /** Shown on the trigger when nothing is selected */
  emptyLabel?: string
  disabled?: boolean
  mode?: SearchableSelectMode
  /** Applied to the scrollable list when scroll is enabled (search-and-scroll | scroll-only) */
  scrollClassName?: string
  className?: string
  buttonClassName?: string
  'aria-invalid'?: boolean
  /** Screen reader label for the search field (when visible) */
  searchAriaLabel?: string
  /**
   * Called with the raw text every time the user types in the search field.
   * Use it to fetch options from a paginated API (server-side search).
   */
  onQueryChange?: (query: string) => void
  /** Renders a busy state while the parent is fetching async options. */
  loading?: boolean
  /**
   * When `false` the options given by the parent are rendered as-is because the
   * parent already searched them server-side. Defaults to `true` (in-memory).
   */
  filterLocally?: boolean
}

const defaultScrollClass = 'max-h-60 overflow-y-auto'

export const SearchableSelect = ({
  id,
  options,
  value,
  onChange,
  onBlur,
  placeholder = 'Select…',
  emptyLabel = 'Select…',
  disabled = false,
  mode = 'search-and-scroll',
  scrollClassName = defaultScrollClass,
  className,
  buttonClassName,
  'aria-invalid': ariaInvalid,
  searchAriaLabel = 'Filter options',
  onQueryChange,
  loading = false,
  filterLocally = true,
}: SearchableSelectProps) => {
  const reactId = useId()
  const listboxId = `${reactId}-listbox`
  const searchId = `${reactId}-search`

  const showSearch = mode !== 'scroll-only'
  const listScrollable = mode !== 'search-only'

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    if (!showSearch || !filterLocally || !query.trim()) return options
    const q = query.trim().toLowerCase()
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, query, showSearch, filterLocally])

  const selectedLabel = useMemo(() => {
    const found = options.find((o) => o.value === value)
    return found?.label ?? ''
  }, [options, value])

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
    onBlur?.()
  }, [onBlur])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        close()
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open, close])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, close])

  return (
    <div ref={rootRef} className={clsx('relative', className)}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-invalid={ariaInvalid}
        aria-busy={loading}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={clsx(
          'relative flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 pr-10 text-left text-sm outline-none',
          'focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500',
          disabled && 'cursor-not-allowed opacity-60',
          !disabled && 'cursor-pointer hover:border-slate-300',
          buttonClassName,
        )}
      >
        <span className={clsx('truncate', !selectedLabel && 'text-slate-400')}>
          {selectedLabel || emptyLabel}
        </span>
        {loading ? (
          <Loader2
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 shrink-0 -translate-y-1/2 animate-spin text-slate-400"
          />
        ) : (
          <ChevronDown
            size={16}
            className={clsx(
              'pointer-events-none absolute right-3 top-1/2 shrink-0 -translate-y-1/2 text-slate-400 transition-transform',
              open && 'rotate-180',
            )}
          />
        )}
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 z-50 mt-1 rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
          role="presentation"
        >
          {showSearch && (
            <div className="border-b border-slate-100 px-2 py-2">
              <label htmlFor={searchId} className="sr-only">
                {searchAriaLabel}
              </label>
              <div className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id={searchId}
                  type="search"
                  autoComplete="off"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    onQueryChange?.(e.target.value)
                  }}
                  placeholder={placeholder}
                  className="w-full rounded-md border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <ul
            id={listboxId}
            role="listbox"
            className={clsx(
              'py-1',
              listScrollable ? scrollClassName : 'max-h-none overflow-visible',
            )}
          >
            {loading && (
              <li className="flex items-center gap-2 px-3 py-2 text-xs text-slate-500">
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                Searching…
              </li>
            )}
            {!loading && filtered.length === 0 && (
              <li className="px-3 py-2 text-center text-xs text-slate-500">
                {options.length === 0 ? 'No options' : 'No matches'}
              </li>
            )}
            {filtered.map((opt) => {
              const isSelected = opt.value === value
              return (
                <li key={opt.value} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={opt.disabled}
                    onClick={() => {
                      onChange(opt.value)
                      close()
                    }}
                    className={clsx(
                      'flex w-full cursor-pointer items-center px-3 py-2 text-left text-sm',
                      isSelected ? 'bg-emerald-50 font-medium text-emerald-900' : 'text-slate-800 hover:bg-slate-50',
                      opt.disabled && 'cursor-not-allowed opacity-50',
                    )}
                  >
                    {opt.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

export default SearchableSelect
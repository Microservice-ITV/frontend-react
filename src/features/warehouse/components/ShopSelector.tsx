import { useEffect, useState } from 'react'
import SearchableSelect, {
  type SearchableSelectOption,
} from '@/components/ui/SearchableSelect'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { shopApi } from '@/features/shops/api/shopApi'

export type ShopSelectorProps = {
  value: string
  onChange: (shopId: string) => void
  className?: string
  label?: string
}

/**
 * Platform-level shop filter. `value === ''` means "All Shops".
 * Options are searched server-side (product-service `/shops`).
 */
const ShopSelector = ({
  value,
  onChange,
  className,
  label = 'Shop',
}: ShopSelectorProps) => {
  const [query, setQuery] = useState('')
  const [options, setOptions] = useState<SearchableSelectOption[]>([])
  const [loading, setLoading] = useState(false)
  const debouncedQuery = useDebouncedValue(query, 350)

  useEffect(() => {
    let cancelled = false

    const search = async () => {
      const term = debouncedQuery.trim()
      setLoading(true)
      try {
        const result = await shopApi.searchPublic({ search: term, perPage: 10 })
        if (cancelled) return
        setOptions([
          { value: '', label: 'All Shops' },
          ...result.shops.map((shop) => ({ value: shop.id, label: shop.name })),
        ])
      } catch {
        if (!cancelled) setOptions([{ value: '', label: 'All Shops' }])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void search()
    return () => {
      cancelled = true
    }
  }, [debouncedQuery])

  return (
    <div className={className}>
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <SearchableSelect
        options={options}
        value={value}
        onChange={onChange}
        onQueryChange={setQuery}
        loading={loading}
        filterLocally={false}
        placeholder="Search shops…"
        emptyLabel="All Shops"
        className="min-w-[190px]"
        searchAriaLabel="Search shops"
      />
    </div>
  )
}

export default ShopSelector

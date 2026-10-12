import { useEffect, useState } from 'react'
import SearchableSelect, {
  type SearchableSelectOption,
} from '@/components/ui/SearchableSelect'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { productClient } from '@/lib/api/productClient'
import { productServiceAssetUrl } from '@/lib/api/apiConfig'

type ProductRow = {
  id: string
  name?: string
  title?: string
  price?: number | string
  images?: string[]
}

type ProductResponse = {
  success?: boolean
  data?: ProductRow | ProductRow[]
}

type ProductsResponse = {
  success?: boolean
  data?: ProductRow[]
  pagination?: { page: number; limit: number; total: number; totalPages: number }
}

export type ProductSearchSelectProps = {
  value: string
  onChange: (productId: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  ariaInvalid?: boolean
}

const ProductSearchSelect = ({
  value,
  onChange,
  placeholder = 'Search product by name or SKU…',
  disabled = false,
  className,
  ariaInvalid,
}: ProductSearchSelectProps) => {
  const [query, setQuery] = useState('')
  const [options, setOptions] = useState<SearchableSelectOption[]>([])
  const [loading, setLoading] = useState(false)
  const debouncedQuery = useDebouncedValue(query, 350)

  useEffect(() => {
    let cancelled = false

    const search = async () => {
      const term = debouncedQuery.trim()
      if (!term) {
        setOptions([])
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const response = await productClient.get<ProductsResponse>('/products', {
          params: { search: term, page: 1, limit: 10 },
        })
        if (cancelled) return
        const rows = response.data?.data ?? []
        setOptions(
          rows.map((row) => ({
            value: row.id,
            label:
              row.name ??
              row.title ??
              row.id,
            image: row.images?.[0]
              ? productServiceAssetUrl(row.images[0])
              : null,
          })),
        )
      } catch {
        if (!cancelled) setOptions([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void search()
    return () => {
      cancelled = true
    }
  }, [debouncedQuery])

  const toOption = (row: ProductRow): SearchableSelectOption => ({
    value: row.id,
    label: row.name ?? row.title ?? row.id,
    image: row.images?.[0] ? productServiceAssetUrl(row.images[0]) : null,
  })

  const [pinnedOption, setPinnedOption] = useState<SearchableSelectOption | null>(
    null,
  )

  useEffect(() => {
    if (!value) {
      setPinnedOption(null)
      return
    }
    if (pinnedOption?.value === value) return
    let cancelled = false

    const hydrate = async () => {
      try {
        const response = await productClient.get<ProductResponse>(
          `/products/${value}`,
        )
        if (cancelled) return
        const row = Array.isArray(response.data?.data)
          ? response.data?.data[0]
          : (response.data?.data as ProductRow | undefined)
        if (row) setPinnedOption(toOption(row))
      } catch {
        if (!cancelled) setPinnedOption({ value, label: value })
      }
    }

    void hydrate()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const mergedOptions = pinnedOption
    ? [pinnedOption, ...options.filter((option) => option.value !== pinnedOption.value)]
    : options

  return (
    <SearchableSelect
      options={mergedOptions}
      value={value}
      onChange={onChange}
      onQueryChange={setQuery}
      loading={loading}
      filterLocally={false}
      placeholder={placeholder}
      emptyLabel="Search a product…"
      disabled={disabled}
      className={className}
      aria-invalid={ariaInvalid}
      searchAriaLabel="Search products"
    />
  )
}

export default ProductSearchSelect

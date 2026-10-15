import { useEffect, useState } from 'react'
import SearchableSelect, {
  type SearchableSelectOption,
} from '@/components/ui/SearchableSelect'
import { useAppSelector } from '@/app/hooks'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { productClient } from '@/lib/api/productClient'
import { productServiceAssetUrl } from '@/lib/api/apiConfig'

type ProductRow = {
  id: string
  name?: string
  title?: string
  sku?: string | null
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
  onChange: (productId: string, option?: SearchableSelectOption) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  ariaInvalid?: boolean
  /** Limit the list and search to products owned by the signed-in seller. */
  ownedOnly?: boolean
}

const OWNED_PAGE_LIMIT = 100
const ownedProductsCache = new Map<string, { at: number; promise: Promise<SearchableSelectOption[]> }>()
const OWNED_PRODUCTS_TTL = 30_000

const toOption = (row: ProductRow): SearchableSelectOption => ({
  value: row.id,
  label: row.name ?? row.title ?? row.id,
  image: row.images?.[0] ? productServiceAssetUrl(row.images[0]) : null,
})

/** All products for the seller’s active shop (or every shop they own). */
const loadOwnedProductOptions = (cacheKey: string, shopId?: string) => {
  const cached = ownedProductsCache.get(cacheKey)
  if (cached && Date.now() - cached.at < OWNED_PRODUCTS_TTL) return cached.promise

  const promise = (async () => {
    const collected: ProductRow[] = []
    let page = 1
    let totalPages = 1
    do {
      const response = await productClient.get<ProductsResponse>('/products', {
        params: shopId
          ? { shopId, page, limit: OWNED_PAGE_LIMIT }
          : { owned: 'true', page, limit: OWNED_PAGE_LIMIT },
      })
      collected.push(...(response.data?.data ?? []))
      totalPages = Math.max(1, response.data?.pagination?.totalPages ?? 1)
      page += 1
    } while (page <= totalPages && page <= 20)

    const seen = new Set<string>()
    return collected
      .filter((row) => {
        if (seen.has(row.id)) return false
        seen.add(row.id)
        return true
      })
      .map(toOption)
  })().catch((error: unknown) => {
    ownedProductsCache.delete(cacheKey)
    throw error
  })

  ownedProductsCache.set(cacheKey, { at: Date.now(), promise })
  return promise
}

const ProductSearchSelect = ({
  value,
  onChange,
  placeholder = 'Search product by name or SKU…',
  disabled = false,
  className,
  ariaInvalid,
  ownedOnly = false,
}: ProductSearchSelectProps) => {
  const userId = useAppSelector((state) => state.auth.user?.id ?? '')
  const activeShopId = useAppSelector(
    (state) => state.auth.user?.active_shop_id?.trim() ?? '',
  )
  const [query, setQuery] = useState('')
  const [options, setOptions] = useState<SearchableSelectOption[]>([])
  const [loading, setLoading] = useState(false)
  const debouncedQuery = useDebouncedValue(query, 350)

  useEffect(() => {
    if (!ownedOnly) return
    if (!userId && !activeShopId) {
      setOptions([])
      return
    }
    const cacheKey = activeShopId ? `shop:${activeShopId}` : `user:${userId}`
    let cancelled = false
    setLoading(true)
    void loadOwnedProductOptions(cacheKey, activeShopId || undefined)
      .then((rows) => {
        if (!cancelled) setOptions(rows)
      })
      .catch(() => {
        if (!cancelled) setOptions([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [ownedOnly, userId, activeShopId])

  useEffect(() => {
    if (ownedOnly) return
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
  }, [debouncedQuery, ownedOnly])

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
      onChange={(nextId) => {
        const option = mergedOptions.find((entry) => entry.value === nextId)
        onChange(nextId, option)
      }}
      onQueryChange={ownedOnly ? undefined : setQuery}
      loading={loading}
      filterLocally={ownedOnly}
      mode={ownedOnly ? 'search-and-scroll' : 'search-only'}
      placeholder={ownedOnly ? 'Search your products…' : placeholder}
      emptyLabel="Search a product…"
      disabled={disabled}
      className={className}
      aria-invalid={ariaInvalid}
      searchAriaLabel="Search products"
    />
  )
}

export default ProductSearchSelect

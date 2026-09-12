export type ProductSortKey =
  | 'popular'
  | 'latest'
  | 'top-sales'
  | 'price-asc'
  | 'price-desc'

export const PRODUCT_SORT_OPTIONS: Array<{ value: ProductSortKey; label: string }> = [
  { value: 'popular', label: 'Popular' },
  { value: 'latest', label: 'Latest' },
  { value: 'top-sales', label: 'Top Sales' },
]

export const normalizeProductSort = (value?: string | null): ProductSortKey => {
  const next = (value ?? 'popular').trim().toLowerCase()

  if (next === 'popular') {
    return 'popular'
  }

  if (next === 'latest' || next === 'top-sales') {
    return next
  }

  if (next === 'price-asc' || next === 'price-desc') {
    return next
  }

  return 'popular'
}

export const getPriceSortLabel = (sort: string): string => {
  const normalized = normalizeProductSort(sort)

  if (normalized === 'price-asc') return 'Price: Low to High'
  if (normalized === 'price-desc') return 'Price: High to Low'

  return 'Price'
}

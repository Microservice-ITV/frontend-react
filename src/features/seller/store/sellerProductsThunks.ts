import { createAsyncThunk } from '@reduxjs/toolkit'
import { sellerProductApi, type CatalogProductReadItem } from '../api/sellerProductApi'
import type { Product, ProductStatus } from '../types/productTypes'
import type { RootState } from '@/app/store'

const PAGE_LIMIT = 100

const formatPrice = (price: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 2,
    }).format(price)
  } catch {
    return `$${price.toFixed(2)}`
  }
}

const normalizeIsoDate = (
  value?: string | { $date?: string },
): string | undefined => {
  if (!value) return undefined
  if (typeof value === 'string') return value
  if (typeof value === 'object' && typeof value.$date === 'string') return value.$date
  return undefined
}

const formatCreatedDate = (value?: string | { $date?: string }) => {
  const normalized = normalizeIsoDate(value)
  if (!normalized) return '—'
  const parsed = new Date(normalized)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const resolveStock = (item: CatalogProductReadItem): number => {
  const candidate =
    typeof item.stock === 'number'
      ? item.stock
      : typeof item.shopAvailableStock === 'number'
        ? item.shopAvailableStock
        : 0
  return Number.isFinite(candidate) ? Number(candidate) : 0
}

const mapCatalogProductToUi = (item: CatalogProductReadItem): Product => {
  const computedStatus: ProductStatus = item.isActive ? 'active' : 'archived'
  const resolvedCategoryId = item.categoryId ?? item.category?.id ?? ''
  const resolvedCategoryName =
    item.categoryName ??
    item.category?.name ??
    item.category?.title ??
    'Uncategorized'

  return {
    id: item.productId,
    title: item.title || item.slug,
    description: item.description || 'No description',
    categoryId: resolvedCategoryId,
    categoryName: resolvedCategoryName,
    status: computedStatus,
    stock: resolveStock(item),
    price: formatPrice(Number(item.price || 0), item.currency || 'USD'),
    created: formatCreatedDate(item.createdAt),
  }
}

const resolveShopId = (item: CatalogProductReadItem): string | null =>
  item.shopId ?? item.shop_id ?? item.shop?.id ?? null

export const fetchSellerProductsByShop = createAsyncThunk<
  Product[],
  { shopId: string },
  { rejectValue: string; state: RootState }
>(
  'sellerProducts/fetchByShop',
  async ({ shopId }, { rejectWithValue }) => {
    if (!shopId) {
      return rejectWithValue('No active shop context found for this account.')
    }

    try {
      let pageCursor = 1
      let total = 0
      const collected: CatalogProductReadItem[] = []

      do {
        const response = await sellerProductApi.listCatalogProducts({
          page: pageCursor,
          limit: PAGE_LIMIT,
        })

        const payload = response.data
        const items = payload.items ?? []
        total = payload.total ?? items.length
        collected.push(...items)
        pageCursor += 1
      } while (collected.length < total)

      return collected
        .filter((item) => resolveShopId(item) === shopId)
        .map(mapCatalogProductToUi)
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Unable to load products right now. Please try again.'
      return rejectWithValue(message)
    }
  },
  {
    condition: ({ shopId }, { getState }) => {
      const state = getState()
      const productsState = state.sellerProducts

      // Deduplicate redundant calls in development/strict-mode.
      if (productsState.status === 'loading' && productsState.activeShopId === shopId) {
        return false
      }
      return true
    },
  },
)
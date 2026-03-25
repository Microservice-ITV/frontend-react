import { createAsyncThunk } from '@reduxjs/toolkit'
import { sellerProductApi, type CatalogProductReadItem } from '../api/sellerProductApi'
import type { Product, ProductStatus } from '../types/productTypes'

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

const formatCreatedDate = (value?: string) => {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const mapCatalogProductToUi = (item: CatalogProductReadItem): Product => {
  const computedStatus: ProductStatus = item.isActive ? 'active' : 'archived'
  return {
    id: item.productId,
    title: item.title || item.slug,
    description: item.description || 'No description',
    category: item.categoryId || 'Uncategorized',
    status: computedStatus,
    stock: Number.isFinite(item.stock) ? item.stock : 0,
    price: formatPrice(Number(item.price || 0), item.currency || 'USD'),
    created: formatCreatedDate(item.createdAt),
  }
}

export const fetchSellerProductsByShop = createAsyncThunk<
  Product[],
  { shopId: string },
  { rejectValue: string }
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
        .filter((item) => item.shopId === shopId)
        .map(mapCatalogProductToUi)
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Unable to load products right now. Please try again.'
      return rejectWithValue(message)
    }
  },
)
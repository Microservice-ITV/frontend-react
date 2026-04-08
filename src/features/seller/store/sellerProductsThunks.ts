import { createAsyncThunk } from '@reduxjs/toolkit'
import { sellerProductApi, type ProductServiceProductListItem } from '../api/sellerProductApi'
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

const normalizeIsoDate = (value?: string | { $date?: string }): string | undefined => {
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

const mapProductServiceRowToUi = (item: ProductServiceProductListItem): Product => {
  const computedStatus: ProductStatus = item.isActive ? 'active' : 'archived'
  const resolvedCategoryId = item.categoryId ?? item.category?.id ?? ''
  const resolvedCategoryName =
    item.category?.name ?? item.category?.title ?? 'Uncategorized'
  const stockRaw = item.stock
  const stock =
    typeof stockRaw === 'number' && Number.isFinite(stockRaw)
      ? stockRaw
      : Number.isFinite(Number(stockRaw))
        ? Number(stockRaw)
        : 0

  return {
    id: item.id,
    title: item.name || item.slug,
    description: item.description ?? 'No description',
    categoryId: resolvedCategoryId,
    categoryName: resolvedCategoryName,
    status: computedStatus,
    stock,
    price: formatPrice(Number(item.price ?? 0), 'USD'),
    created: formatCreatedDate(item.createdAt),
  }
}

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
      const collected: ProductServiceProductListItem[] = []
      let page = 1
      let totalPages = 1

      do {
        const response = await sellerProductApi.listProductsByShop({
          shopId,
          page,
          limit: PAGE_LIMIT,
        })

        const body = response.data
        const items = body.data ?? []
        const pagination = body.pagination
        collected.push(...items)
        totalPages = Math.max(1, pagination?.totalPages ?? 1)
        page += 1
      } while (page <= totalPages)

      return collected.map(mapProductServiceRowToUi)
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Unable to load products right now. Please try again.'
      return rejectWithValue(message)
    }
  },
)

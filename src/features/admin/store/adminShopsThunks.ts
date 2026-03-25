import { createAsyncThunk } from '@reduxjs/toolkit'
import { adminShopApi, type ShopReadItem } from '../api/adminShopApi'
import type { AdminShopRow, ShopStatus } from '../types/shopTypes'

const PAGE_LIMIT = 100

const formatDate = (value?: string) => {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const mapShopsToRows = (items: ShopReadItem[]): AdminShopRow[] =>
  items
    .map((shop) => {
      const status: ShopStatus = shop.isActive ? 'active' : 'inactive'
      return {
        id: shop.id,
        name: shop.name,
        description:
          shop.description ||
          `${shop._count?.products ?? 0} product${(shop._count?.products ?? 0) > 1 ? 's' : ''} in catalog`,
        slug: shop.slug,
        status,
        parent: '—',
        created: formatDate(shop.createdAt),
        updated: formatDate(shop.updatedAt),
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))

export const fetchAdminShops = createAsyncThunk<
  AdminShopRow[],
  void,
  { rejectValue: string }
>(
  'adminShops/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      let pageCursor = 1
      let totalPages = 1
      const collected: ShopReadItem[] = []

      do {
        const response = await adminShopApi.listShops({
          page: pageCursor,
          limit: PAGE_LIMIT,
        })

        const payload = response.data
        const items = payload.data ?? []
        totalPages = payload.pagination?.totalPages ?? 1
        collected.push(...items)
        pageCursor += 1
      } while (pageCursor <= totalPages)

      return mapShopsToRows(collected)
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Unable to load shops right now. Please try again.'
      return rejectWithValue(message)
    }
  },
)
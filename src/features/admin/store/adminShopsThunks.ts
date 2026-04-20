import { createAsyncThunk } from '@reduxjs/toolkit'
import { adminShopApi, type ShopReadItem } from '../api/adminShopApi'
import type { AdminShopRow, AdminShopStatus } from '../types/shopTypes'

const PAGE_LIMIT = 100

const formatDate = (value?: string) => {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const ownerHint = (shop: ShopReadItem): string => {
  const parts = [shop.userName, shop.sellerContactEmail, shop.sellerContactPhone].filter(
    (p): p is string => typeof p === 'string' && p.trim().length > 0,
  )
  return parts.length > 0 ? parts.join(' · ') : '—'
}

const mapPendingRow = (shop: ShopReadItem): AdminShopRow => ({
  id: shop.id,
  name: shop.name,
  description:
    shop.description?.trim() ||
    `Awaiting approval · ${ownerHint(shop)}`,
  slug: shop.slug,
  status: 'pending',
  ownerLabel: ownerHint(shop),
  created: formatDate(shop.createdAt),
  updated: formatDate(shop.updatedAt),
})

const mapCatalogRow = (shop: ShopReadItem): AdminShopRow => {
  const status: AdminShopStatus = shop.isActive ? 'active' : 'inactive'
  return {
    id: shop.id,
    name: shop.name,
    description:
      shop.description?.trim() ||
      `${shop._count?.products ?? 0} product${(shop._count?.products ?? 0) !== 1 ? 's' : ''} in catalog`,
    slug: shop.slug,
    status,
    ownerLabel: ownerHint(shop),
    created: formatDate(shop.createdAt),
    updated: formatDate(shop.updatedAt),
  }
}

async function collectPaged(
  fetchPage: (page: number) => Promise<{ data: ShopReadItem[]; totalPages: number }>,
): Promise<ShopReadItem[]> {
  let pageCursor = 1
  let totalPages = 1
  const collected: ShopReadItem[] = []

  do {
    const { data, totalPages: tp } = await fetchPage(pageCursor)
    totalPages = tp
    collected.push(...data)
    pageCursor += 1
  } while (pageCursor <= totalPages)

  return collected
}

export const fetchAdminShops = createAsyncThunk<AdminShopRow[], void, { rejectValue: string }>(
  'adminShops/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const [pendingItems, catalogItems] = await Promise.all([
        collectPaged(async (page) => {
          const response = await adminShopApi.listPendingShops({ page, limit: PAGE_LIMIT })
          const payload = response.data
          return {
            data: payload.data ?? [],
            totalPages: payload.pagination?.totalPages ?? 1,
          }
        }),
        collectPaged(async (page) => {
          const response = await adminShopApi.listShops({ page, limit: PAGE_LIMIT })
          const payload = response.data
          return {
            data: payload.data ?? [],
            totalPages: payload.pagination?.totalPages ?? 1,
          }
        }),
      ])

      const byId = new Map<string, AdminShopRow>()
      for (const item of pendingItems) {
        byId.set(item.id, mapPendingRow(item))
      }
      for (const item of catalogItems) {
        byId.set(item.id, mapCatalogRow(item))
      }

      return Array.from(byId.values()).sort((a, b) => {
        const rank = { pending: 0, inactive: 1, active: 2 } as const
        const d = rank[a.status] - rank[b.status]
        if (d !== 0) return d
        return a.name.localeCompare(b.name)
      })
    } catch (error: unknown) {
      const message = adminShopApi.getApiErrorMessage(
        error,
        'Unable to load shops right now. Please try again.',
      )
      return rejectWithValue(message)
    }
  },
)

export const setShopApproval = createAsyncThunk<
  void,
  { shopId: string; approved: boolean },
  { rejectValue: string }
>('adminShops/setApproval', async ({ shopId, approved }, { dispatch, rejectWithValue }) => {
  try {
    await adminShopApi.setShopApproval(shopId, approved)
    await dispatch(fetchAdminShops()).unwrap()
  } catch (error: unknown) {
    return rejectWithValue(
      adminShopApi.getApiErrorMessage(error, 'Could not update shop approval. Try again.'),
    )
  }
})
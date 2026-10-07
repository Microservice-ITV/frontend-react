import { promotionClient } from '@/lib/api/promotionClient'
import { productClient } from '@/lib/api/productClient'
import type {
  BundleKind,
  BundleMatchResult,
  BundleRecord,
  BundleStatus,
  BundleUpsertPayload,
} from '../types/bundleTypes'

type Envelope<T> = { success?: boolean; data: T; pagination?: BundlePagination }

export interface BundlePagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface BundleProductOption {
  id: string
  name: string
  price: number
  image: string | null
  shopId: string | null
}

const messageFrom = (error: unknown): string => {
  const err = error as {
    response?: { data?: { message?: string | string[] } }
    message?: string
  }
  const message = err.response?.data?.message
  if (Array.isArray(message)) return message.join(' ')
  return message || err.message || 'Something went wrong'
}

export { messageFrom as bundleErrorMessage }

export const bundleApi = {
  async list(params: {
    page?: number
    limit?: number
    status?: BundleStatus | 'all'
    kind?: BundleKind | 'all'
    shopId?: string
  }) {
    const response = await promotionClient.get<Envelope<BundleRecord[]>>('/promotions/bundles', {
      params,
    })
    return {
      data: response.data.data ?? [],
      pagination: response.data.pagination ?? {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1,
      },
    }
  },

  async get(id: string) {
    const response = await promotionClient.get<Envelope<BundleRecord>>(`/promotions/bundles/${id}`)
    return response.data.data
  },

  async create(payload: BundleUpsertPayload) {
    const response = await promotionClient.post<Envelope<BundleRecord>>('/promotions/bundles', payload)
    return response.data.data
  },

  async update(id: string, payload: BundleUpsertPayload) {
    const response = await promotionClient.patch<Envelope<BundleRecord>>(`/promotions/bundles/${id}`, payload)
    return response.data.data
  },

  async publish(id: string) {
    const response = await promotionClient.post<Envelope<BundleRecord>>(`/promotions/bundles/${id}/publish`)
    return response.data.data
  },

  async pause(id: string) {
    const response = await promotionClient.post<Envelope<BundleRecord>>(`/promotions/bundles/${id}/pause`)
    return response.data.data
  },

  async resume(id: string) {
    const response = await promotionClient.post<Envelope<BundleRecord>>(`/promotions/bundles/${id}/resume`)
    return response.data.data
  },

  async end(id: string) {
    const response = await promotionClient.post<Envelope<BundleRecord>>(`/promotions/bundles/${id}/end`)
    return response.data.data
  },

  async remove(id: string) {
    await promotionClient.delete(`/promotions/bundles/${id}`)
  },

  async storefront(params: { kind?: BundleKind; productId?: string; limit?: number }) {
    const response = await promotionClient.get<Envelope<BundleRecord[]>>('/promotions/bundles/storefront', {
      params,
    })
    return response.data.data ?? []
  },

  async match(items: Array<{
    product_id: string
    shop_id: string
    unit_price: number
    quantity: number
    selected?: boolean
  }>) {
    const response = await promotionClient.post<Envelope<BundleMatchResult>>('/promotions/bundles/match', {
      items,
    })
    return response.data.data
  },

  async searchProducts(query: { search?: string; shopId?: string; limit?: number }) {
    const response = await productClient.get<{
      data?: Array<{
        id: string
        name: string
        price: number
        images?: string[]
        shop?: { id?: string }
        shopId?: string
      }>
    }>('/products', {
      params: {
        page: 1,
        limit: query.limit ?? 24,
        isActive: true,
        ...(query.shopId ? { shopId: query.shopId } : {}),
        ...(query.search ? { search: query.search } : {}),
      },
    })
    return (response.data.data ?? []).map((row): BundleProductOption => ({
      id: row.id,
      name: row.name,
      price: Number(row.price) || 0,
      image: row.images?.[0] ?? null,
      shopId: row.shop?.id ?? row.shopId ?? null,
    }))
  },
}

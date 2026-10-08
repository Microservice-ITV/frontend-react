import { promotionClient } from '@/lib/api/promotionClient'
import { productClient } from '@/lib/api/productClient'

export type PromotionAssetKind = 'rewards' | 'conditions' | 'targets' | 'codes' | 'usageLimits'

export type PromotionRecord = {
  id: string
  owner_type: 'PLATFORM' | 'SELLER'
  shop_id: string | null
  scope: 'PRODUCT' | 'CATEGORY' | 'SHOP' | 'ORDER' | 'SHIPPING'
  name: string
  description: string | null
  promotion_type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'BUY_X_GET_Y' | 'FREE_SHIPPING' | 'BUNDLE'
  priority: number
  stackable: boolean
  start_at: string
  end_at: string | null
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'EXPIRED'
  created_at: string
  updated_at: string
}

export type PromotionRewardRecord = {
  id: string
  promotion_id: string
  reward_type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING'
  percentage: string | number | null
  fixed_amount: string | number | null
  max_discount_amount: string | number | null
  created_at: string
}

export type PromotionConditionRecord = {
  id: string
  promotion_id: string
  condition_type: string
  operator: string
  value: Record<string, unknown>
  created_at: string
}

export type PromotionTargetRecord = {
  id: string
  promotion_id: string
  target_type: 'PRODUCT' | 'CATEGORY' | 'BRAND' | 'SHOP'
  target_id: string
}

export type PromotionCodeRecord = {
  id: string
  promotion_id: string
  code: string
  status: 'ACTIVE' | 'DISABLED' | 'USED'
  reserved_by_user_id: string | null
  used_by_user_id: string | null
  used_order_id: string | null
  used_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

export type PromotionUsageLimitRecord = {
  id: string
  promotion_id: string
  limit_type: 'PER_USER' | 'GLOBAL' | 'SHOP_BUDGET'
  max_count: number | null
  max_amount: number | string | null
  shop_id: string | null
  created_at: string
}

export type PromotionTargetCatalogProduct = {
  id: string
  name: string
  categoryId?: string | null
  category?: { id: string; name: string } | null
  brandId?: string | null
  brand?: { id: string; name: string } | null
}

const resourcePath: Record<PromotionAssetKind, string> = {
  rewards: '/promotion-rewards',
  conditions: '/promotion-conditions',
  targets: '/promotion-targets',
  codes: '/promotion-codes',
  usageLimits: '/promotion-usage-limits',
}

export const promotionApi = {
  async listPromotions(shopId?: string): Promise<PromotionRecord[]> {
    const response = await promotionClient.get<
      PromotionRecord[] | { data?: PromotionRecord[] } | null
    >('/promotions', {
      params: shopId ? { shop_id: shopId } : undefined,
    })
    const payload = response.data
    if (Array.isArray(payload)) return payload
    if (payload && Array.isArray(payload.data)) return payload.data
    return []
  },
  async createPromotion(payload: unknown): Promise<PromotionRecord> {
    const response = await promotionClient.post<PromotionRecord>('/promotions', payload)
    return response.data
  },
  async updatePromotion(id: string, payload: unknown): Promise<PromotionRecord> {
    const response = await promotionClient.patch<PromotionRecord>(`/promotions/${id}`, payload)
    return response.data
  },
  async list<T>(kind: PromotionAssetKind, promotionId?: string): Promise<T[]> {
    const response = await promotionClient.get<T[] | { data?: T[] } | null>(resourcePath[kind], {
      params: promotionId ? { promotion_id: promotionId } : undefined,
    })
    const payload = response.data
    if (Array.isArray(payload)) return payload
    if (payload && Array.isArray(payload.data)) return payload.data
    return []
  },
  async listTargetCatalogProducts(shopId?: string): Promise<PromotionTargetCatalogProduct[]> {
    const limit = 100
    let page = 1
    let totalPages = 1
    const products: PromotionTargetCatalogProduct[] = []

    do {
      const response = await productClient.get<{
        data?: PromotionTargetCatalogProduct[]
        pagination?: { totalPages?: number }
      }>('/products', {
        params: {
          page,
          limit,
          isActive: true,
          ...(shopId ? { shopId } : {}),
        },
      })
      products.push(...(response.data.data ?? []))
      totalPages = response.data.pagination?.totalPages ?? page
      page += 1
    } while (page <= totalPages)

    return products
  },
  async resolveTargetNames(
    targets: Array<{ target_type: PromotionTargetRecord['target_type']; target_id: string }>,
  ): Promise<Map<string, string>> {
    const uniqueTargets = Array.from(
      new Map(
        targets.map((target) => [
          `${target.target_type}:${target.target_id}`,
          target,
        ]),
      ).values(),
    )
    const resolved = new Map<string, string>()
    const batchSize = 8

    for (let offset = 0; offset < uniqueTargets.length; offset += batchSize) {
      const batch = uniqueTargets.slice(offset, offset + batchSize)
      await Promise.all(batch.map(async (target) => {
        const resource = target.target_type === 'PRODUCT'
          ? 'products'
          : target.target_type === 'CATEGORY'
            ? 'categories'
            : target.target_type === 'BRAND'
              ? 'brands'
              : 'shops'
        try {
          const response = await productClient.get<{ data?: { name?: string } | null }>(
            `/${resource}/${encodeURIComponent(target.target_id)}`,
          )
          const name = response.data.data?.name?.trim()
          if (name) resolved.set(`${target.target_type}:${target.target_id}`, name)
        } catch {
          // Keep the target ID as the display fallback if its catalog record is unavailable.
        }
      }))
    }

    return resolved
  },
  async create<T>(kind: PromotionAssetKind, payload: unknown): Promise<T> {
    const response = await promotionClient.post<T>(resourcePath[kind], payload)
    return response.data
  },
  async update<T>(kind: PromotionAssetKind, id: string, payload: unknown): Promise<T> {
    const response = await promotionClient.patch<T>(`${resourcePath[kind]}/${id}`, payload)
    return response.data
  },
  async remove(kind: PromotionAssetKind, id: string): Promise<void> {
    await promotionClient.delete(`${resourcePath[kind]}/${id}`)
  },
}

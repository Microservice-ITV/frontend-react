import { promotionClient } from '@/lib/api/promotionClient'

export type PromotionAssetKind = 'rewards' | 'conditions' | 'targets'

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

const resourcePath: Record<PromotionAssetKind, string> = {
  rewards: '/promotion-rewards',
  conditions: '/promotion-conditions',
  targets: '/promotion-targets',
}

export const promotionApi = {
  async listPromotions(): Promise<PromotionRecord[]> {
    const response = await promotionClient.get<
      PromotionRecord[] | { data?: PromotionRecord[] } | null
    >('/promotions')
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
  async list<T>(kind: PromotionAssetKind): Promise<T[]> {
    const response = await promotionClient.get<T[] | { data?: T[] } | null>(resourcePath[kind])
    const payload = response.data
    if (Array.isArray(payload)) return payload
    if (payload && Array.isArray(payload.data)) return payload.data
    return []
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

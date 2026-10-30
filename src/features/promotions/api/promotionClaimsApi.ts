import { promotionClient } from '@/lib/api/promotionClient'
import type { PromotionRewardRecord } from './promotionApi'

export type PromotionClaimSettings = {
  promotion_id: string
  enabled: boolean
  minimum_order_amount: string
  claim_deadline_days: number | null
}

export type MyPromotionClaim = {
  id: string
  promotion_id: string
  promotion_name: string
  description: string | null
  rewards: PromotionRewardRecord[]
  order_id: string
  qualifying_amount: string
  claim_expires_at: string | null
  claimed_at: string | null
  code: string | null
  code_expires_at: string | null
  promotion_end_at: string | null
  state:
    | 'CLAIMABLE'
    | 'AVAILABLE'
    | 'USED'
    | 'EXPIRED'
    | 'DISABLED'
    | 'UNAVAILABLE'
}

export const promotionClaimsApi = {
  async listSettings(shopId?: string): Promise<PromotionClaimSettings[]> {
    return (
      await promotionClient.get('/promotion-claims/settings', {
        params: shopId ? { shop_id: shopId } : undefined,
      })
    ).data
  },
  async removeSettings(promotionId: string): Promise<void> {
    await promotionClient.delete(`/promotion-claims/settings/${promotionId}`)
  },
  async settings(promotionId: string): Promise<PromotionClaimSettings> {
    return (
      await promotionClient.get(`/promotion-claims/settings/${promotionId}`)
    ).data
  },
  async saveSettings(
    promotionId: string,
    settings: {
      enabled: boolean
      minimum_order_amount: number
      claim_deadline_days: number | null
    },
  ): Promise<PromotionClaimSettings> {
    return (
      await promotionClient.put(
        `/promotion-claims/settings/${promotionId}`,
        settings,
      )
    ).data
  },
  async mine(): Promise<MyPromotionClaim[]> {
    return (await promotionClient.get('/promotion-claims/mine')).data
  },
  async claim(
    id: string,
  ): Promise<{ id: string; promotion_id: string; code: string }> {
    return (await promotionClient.post(`/promotion-claims/${id}/claim`)).data
  },
}

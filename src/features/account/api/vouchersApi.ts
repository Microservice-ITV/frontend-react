import { promotionClient } from '@/lib/api/promotionClient'

export type CustomerVoucher = {
  id: string
  promotion_id: string
  code: string
  status: 'ACTIVE' | 'USED' | 'DISABLED'
  awarded_order_id: string | null
  used_at: string | null
  expires_at: string | null
  created_at: string
  promotion?: { name?: string; description?: string | null; end_at?: string | null }
}

export const vouchersApi = {
  async mine(): Promise<CustomerVoucher[]> {
    const response = await promotionClient.get<CustomerVoucher[]>('/me/vouchers')
    return Array.isArray(response.data) ? response.data : []
  },
}

import { orderClient } from '@/lib/api/orderClient'

export type CustomerQuantityApprovalItem = {
  product_id: string
  variant_id?: string | null
  shop_id?: string | null
  title: string
  sku?: string | null
  qty: number
  price: number
  line_total: number
  image_url?: string | null
}

export type CustomerQuantityApproval = {
  checkout_id: string
  status: 'pending' | 'approved' | 'rejected' | string
  quantity: number
  merchandise_total: number
  rejection_reason?: string | null
  order_placed?: boolean
  items: CustomerQuantityApprovalItem[]
  created_at?: string | null
}

export const quantityApprovalApi = {
  async list(userId: string): Promise<CustomerQuantityApproval[]> {
    const response = await orderClient.get<{ approvals?: CustomerQuantityApproval[] }>(
      '/orders/my-quantity-approvals',
      { params: { user_id: userId } },
    )
    return Array.isArray(response.data.approvals) ? response.data.approvals : []
  },

  async detail(userId: string, checkoutId: string): Promise<CustomerQuantityApproval> {
    const response = await orderClient.get<CustomerQuantityApproval>(
      `/orders/my-quantity-approvals/${checkoutId}`,
      { params: { user_id: userId } },
    )
    return response.data
  },
}

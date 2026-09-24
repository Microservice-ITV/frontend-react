import { orderClient } from '@/lib/api/orderClient'
import type { AxiosResponse } from 'axios'
import type { CheckoutResponse, CheckoutStatusResponse } from '../types/checkoutTypes'
import { promotionClient } from '@/lib/api/promotionClient'

export type CheckoutShopShippingPayload = {
  shop_id: string
  shipping_fee: number
}

export type CheckoutAddressPayload = {
  full_name: string
  phone_no: string
  email?: string | null
  country_code: string
  country: string
  state: string
  city: string
  district: string
  ward: string
  address_line_1: string
  address_line_2?: string | null
  postal_code?: string | null
  latitude?: number | null
  longitude?: number | null
  delivery_note?: string | null
  /** Aggregate shipping from calculate API (`totalShippingFee`) or checkout totals */
  shipping_total: number
  /** Per-shop fees from calculate API, aligned with cart shops */
  shop_shippings: CheckoutShopShippingPayload[]
  /** Optional one-time voucher / promo code */
  promo_code?: string | null
}

export type PromoCodeStatus =
  | 'VALID'
  | 'INVALID'
  | 'EXPIRED'
  | 'USED'
  | 'DISABLED'
  | 'RESERVED'
  | 'LIMIT_REACHED'
  | 'NOT_APPLICABLE'

export type PromotionQuoteResponse = {
  discount_total: number
  final_total: number
  promotion_ids: string[]
  promo_code?: string | null
  promo_code_status?: PromoCodeStatus | null
  promo_code_message?: string | null
}

export const checkoutApi = {
  async quotePromotions(payload: {
    checkout_id: string
    user_id: string
    items: Array<{
      product_id: string
      shop_id: string
      unit_price: number
      quantity: number
    }>
    subtotal: number
    shipping_total: number
    promo_code?: string | null
  }): Promise<PromotionQuoteResponse> {
    const body = {
      ...payload,
      promo_code: payload.promo_code?.trim()
        ? payload.promo_code.trim().toUpperCase()
        : undefined,
    }
    const response = await promotionClient.post('/promotions/quote', body)
    return response.data
  },

  createCheckoutSession(data: {
    user_id: string
    items: { product_id: string; qty: number; variant_id?: string }[]
    idempotency_key: string
    delivery_address?: any
  }): Promise<AxiosResponse<CheckoutResponse>> {
    return orderClient.post<CheckoutResponse>('/orders/checkout', data, {
      headers: {
        'Idempotency-Key': data.idempotency_key,
      },
    })
  },

  completeCheckoutSession(checkoutId: string, _paymentData?: any): Promise<AxiosResponse<any>> {
    return orderClient.get(`/orders/checkout-sessions/${checkoutId}`)
  },

  getSagaStatus(sagaId: string): Promise<AxiosResponse<any>> {
    return orderClient.get(`/orders/checkout-sessions/${sagaId}`)
  },

  getSagaStatistics(): Promise<AxiosResponse<any>> {
    return Promise.reject(new Error('Saga statistics are unavailable'))
  },

  updateCheckoutAddress(
    checkoutId: string,
    payload: CheckoutAddressPayload,
  ): Promise<AxiosResponse<{
    checkout_id?: string
    message?: string
    address_updated_at?: string
    grand_total?: number
    shipping_total?: number
    promotion_discount_total?: number
    promo_code?: string | null
    promo_code_status?: PromoCodeStatus | null
    promo_code_message?: string | null
    payment?: { client_secret?: string }
    already_succeeded?: boolean
  }>> {
    return orderClient.put(`/orders/checkout/${checkoutId}/address`, payload)
  },

  async getCheckoutSession(checkoutId: string): Promise<AxiosResponse<CheckoutStatusResponse>> {
    try {
      const res = await orderClient.get<CheckoutStatusResponse | { data: CheckoutStatusResponse }>(
        `/orders/checkout-sessions/${checkoutId}`,
      )
      const raw = res.data as CheckoutStatusResponse | { data: CheckoutStatusResponse }
      const normalized: CheckoutStatusResponse = 'data' in raw ? raw.data : raw
      return { ...res, data: normalized }
    } catch (error: any) {
      if (error?.response?.status === 404) {
        try {
          const res = await orderClient.get<CheckoutStatusResponse | { data: CheckoutStatusResponse }>(
            `/orders/checkout/${checkoutId}/status`,
          )
          const raw = res.data as CheckoutStatusResponse | { data: CheckoutStatusResponse }
          const normalized: CheckoutStatusResponse = 'data' in raw ? raw.data : raw
          return { ...res, data: normalized }
        } catch (innerError: any) {
          if (innerError?.response?.status === 404) {
            const res = await orderClient.get<
              CheckoutStatusResponse | { data: CheckoutStatusResponse }
            >(`/checkouts/${checkoutId}/status`)
            const raw = res.data as CheckoutStatusResponse | { data: CheckoutStatusResponse }
            const normalized: CheckoutStatusResponse = 'data' in raw ? raw.data : raw
            return { ...res, data: normalized }
          }
          throw innerError
        }
      }
      throw error
    }
  },
}
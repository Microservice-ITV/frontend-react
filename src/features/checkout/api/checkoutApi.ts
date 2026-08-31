import { orderClient } from '@/lib/api/orderClient'
import type { AxiosResponse } from 'axios'
import type { CheckoutResponse, CheckoutStatusResponse } from '../types/checkoutTypes'

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
}

export const checkoutApi = {
  createCheckoutSession(data: {
    user_id: string
    items: { product_id: string; qty: number; variant_id?: string }[]
    idempotency_key: string
  }): Promise<AxiosResponse<CheckoutResponse>> {
    return orderClient.post<CheckoutResponse>('/orders/checkout', data, {
      headers: {
        'Idempotency-Key': data.idempotency_key,
      },
    })
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
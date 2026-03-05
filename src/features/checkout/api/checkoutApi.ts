import { orderClient } from '@/lib/api/orderClient'
import type { AxiosResponse } from 'axios'
import type { CheckoutResponse, CheckoutStatusResponse } from '../types/checkoutTypes'

export const checkoutApi = {
  createCheckoutSession(data: {
    user_id: string
    items: { product_id: string; qty: number }[]
    idempotency_key: string
  }): Promise<AxiosResponse<CheckoutResponse>> {
    return orderClient.post<CheckoutResponse>('/orders/checkout', data, {
      headers: {
        'Idempotency-Key': data.idempotency_key,
      },
    })
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


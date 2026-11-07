import axios from 'axios'
import { orderClient } from '@/lib/api/orderClient'

export type CheckoutPlaceOrderCount = {
  place_order_count: number
  using_default: boolean
}

export const checkoutPlaceOrderCountError = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const body = data as { error?: unknown; message?: unknown; errors?: Record<string, unknown> }
      if (typeof body.error === 'string' && body.error.trim()) return body.error
      const fieldErrors = body.errors?.place_order_count
      if (Array.isArray(fieldErrors)) {
        const message = fieldErrors.find((value): value is string => typeof value === 'string' && value.trim() !== '')
        if (message) return message
      }
      if (typeof body.message === 'string' && body.message.trim()) return body.message
    }
  }
  return error instanceof Error && error.message.trim() ? error.message : fallback
}

const readCount = (
  payload: Partial<CheckoutPlaceOrderCount> | undefined,
  fallback: number,
): CheckoutPlaceOrderCount => {
  const count = Number(payload?.place_order_count)
  return {
    place_order_count: Number.isInteger(count) && count >= 1 ? count : fallback,
    using_default: payload?.using_default !== false,
  }
}

export const checkoutPlaceOrderCountApi = {
  async get(): Promise<CheckoutPlaceOrderCount> {
    const response = await orderClient.get<CheckoutPlaceOrderCount>('/orders/checkout-place-order-count')
    return readCount(response.data, 3)
  },

  async create(placeOrderCount: number): Promise<CheckoutPlaceOrderCount> {
    const response = await orderClient.post<CheckoutPlaceOrderCount>('/orders/checkout-place-order-count', {
      place_order_count: placeOrderCount,
    })
    return readCount(response.data, placeOrderCount)
  },

  async update(placeOrderCount: number): Promise<CheckoutPlaceOrderCount> {
    const response = await orderClient.put<CheckoutPlaceOrderCount>('/orders/checkout-place-order-count', {
      place_order_count: placeOrderCount,
    })
    return readCount(response.data, placeOrderCount)
  },

  async remove(): Promise<CheckoutPlaceOrderCount> {
    const response = await orderClient.delete<CheckoutPlaceOrderCount>('/orders/checkout-place-order-count')
    return readCount(response.data, 3)
  },
}

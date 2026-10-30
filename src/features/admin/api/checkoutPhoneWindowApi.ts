import axios from 'axios'
import { orderClient } from '@/lib/api/orderClient'

export type CheckoutPhoneWindow = {
  window_minutes: number
}

export const checkoutPhoneWindowError = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const body = data as { error?: unknown; message?: unknown; errors?: Record<string, unknown> }
      if (typeof body.error === 'string' && body.error.trim()) return body.error
      const fieldErrors = body.errors?.window_minutes
      if (Array.isArray(fieldErrors)) {
        const message = fieldErrors.find((value): value is string => typeof value === 'string' && value.trim() !== '')
        if (message) return message
      }
      if (typeof body.message === 'string' && body.message.trim()) return body.message
    }
  }
  return error instanceof Error && error.message.trim() ? error.message : fallback
}

const readMinutes = (payload: CheckoutPhoneWindow | undefined, fallback: number): number => {
  const minutes = Number(payload?.window_minutes)
  return Number.isInteger(minutes) && minutes >= 1 ? minutes : fallback
}

export const checkoutPhoneWindowApi = {
  async get(): Promise<CheckoutPhoneWindow> {
    const response = await orderClient.get<CheckoutPhoneWindow>('/orders/checkout-phone-window')
    return { window_minutes: readMinutes(response.data, 5) }
  },

  async save(windowMinutes: number): Promise<CheckoutPhoneWindow> {
    const response = await orderClient.put<CheckoutPhoneWindow>('/orders/checkout-phone-window', {
      window_minutes: windowMinutes,
    })
    return { window_minutes: readMinutes(response.data, windowMinutes) }
  },
}

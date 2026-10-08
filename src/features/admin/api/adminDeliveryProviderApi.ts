import axios from 'axios'
import { deliveryClient } from '@/lib/api/deliveryClient'

export type DeliveryProvider = {
  id: string
  code: string
  name: string
  active: boolean
}

export type DeliveryProviderPayload = Pick<DeliveryProvider, 'code' | 'name' | 'active'>

export function getDeliveryProviderApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as { error?: unknown; message?: unknown } | undefined
    if (typeof responseData?.error === 'string' && responseData.error.trim()) return responseData.error
    if (typeof responseData?.message === 'string' && responseData.message.trim()) return responseData.message
    if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error')) {
      return 'Cannot reach the Delivery Service. Check its connection, then try again.'
    }
    if (error.message.trim()) return error.message
  }
  return error instanceof Error && error.message.trim() ? error.message : fallback
}

export const adminDeliveryProviderApi = {
  async list(): Promise<DeliveryProvider[]> {
    const response = await deliveryClient.get<{ providers: DeliveryProvider[] }>('/delivery-providers')
    return response.data.providers
  },

  async create(payload: DeliveryProviderPayload): Promise<DeliveryProvider> {
    const response = await deliveryClient.post<{ provider: DeliveryProvider }>('/admin/delivery-providers', payload)
    return response.data.provider
  },

  async update(id: string, payload: DeliveryProviderPayload): Promise<DeliveryProvider> {
    const response = await deliveryClient.patch<{ provider: DeliveryProvider }>(
      `/admin/delivery-providers/${encodeURIComponent(id)}`,
      payload,
    )
    return response.data.provider
  },
}

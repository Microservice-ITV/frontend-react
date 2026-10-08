import axios from 'axios'
import { accountingClient } from '@/lib/api/accountingClient'
import { deliveryClient } from '@/lib/api/deliveryClient'

export type DeliveryChargingBasis = 'PER_ORDER' | 'PER_DAY'

export type DeliveryProviderFeeRule = {
  id: string
  providerId: string
  chargingBasis: DeliveryChargingBasis
  amount: string
  currency: string
  active: boolean
  effectiveFrom: string | null
  effectiveTo: string | null
  createdAt: string
  updatedAt: string
}

export type DeliveryProviderOption = {
  id: string
  code: string
  name: string
  active: boolean
}

export type DeliveryProviderFeePayload = Omit<DeliveryProviderFeeRule, 'id' | 'createdAt' | 'updatedAt'>

export function getDeliveryProviderFeeApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as { error?: unknown; message?: unknown } | undefined
    if (typeof responseData?.error === 'string' && responseData.error.trim()) return responseData.error
    if (typeof responseData?.message === 'string' && responseData.message.trim()) return responseData.message
    if (error.message.trim()) return error.message
  }
  return error instanceof Error && error.message.trim() ? error.message : fallback
}

export const adminDeliveryProviderFeeApi = {
  async listFeeRules(): Promise<DeliveryProviderFeeRule[]> {
    const response = await accountingClient.get<{ feeRules: DeliveryProviderFeeRule[] }>('/delivery-provider-fees')
    return response.data.feeRules
  },

  async getFeeRule(id: string): Promise<DeliveryProviderFeeRule> {
    const response = await accountingClient.get<{ feeRule: DeliveryProviderFeeRule }>(
      `/delivery-provider-fees/${encodeURIComponent(id)}`,
    )
    return response.data.feeRule
  },

  async createFeeRule(payload: DeliveryProviderFeePayload): Promise<DeliveryProviderFeeRule> {
    const response = await accountingClient.post<{ feeRule: DeliveryProviderFeeRule}>('/delivery-provider-fees', payload)
    return response.data.feeRule
  },

  async updateFeeRule(id: string, payload: DeliveryProviderFeePayload): Promise<DeliveryProviderFeeRule> {
    const response = await accountingClient.patch<{ feeRule: DeliveryProviderFeeRule }>(
      `/delivery-provider-fees/${encodeURIComponent(id)}`,
      payload,
    )
    return response.data.feeRule
  },

  async setFeeRuleActive(id: string, active: boolean): Promise<DeliveryProviderFeeRule> {
    const response = await accountingClient.patch<{ feeRule: DeliveryProviderFeeRule }>(
      `/delivery-provider-fees/${encodeURIComponent(id)}/status`,
      { active },
    )
    return response.data.feeRule
  },

  async listDeliveryProviders(): Promise<DeliveryProviderOption[]> {
    const response = await deliveryClient.get<{ providers: DeliveryProviderOption[] }>('/delivery-providers')
    return response.data.providers
  },
}

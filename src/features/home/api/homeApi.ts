import { publicClient } from '@/lib/api/publicClient'
import type { HomeQuickActionsResponse } from '../store/homeTypes'
import type { AxiosResponse } from 'axios'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const parseRetryAfterMs = (value: unknown, fallbackMs: number): number => {
  const asNumber = Number(value)
  if (Number.isFinite(asNumber) && asNumber > 0) {
    return asNumber * 1000
  }
  return fallbackMs
}

const requestActiveFeaturesWithRetry = async (
  retriesLeft = 2,
  fallbackDelayMs = 1000,
): Promise<AxiosResponse<HomeQuickActionsResponse>> => {
  try {
    return await publicClient.get<HomeQuickActionsResponse>('/home-features', {
      params: { page: 1, limit: 100, isActive: 'true' },
    })
  } catch (error: any) {
    const status = error?.response?.status
    if (status === 429 && retriesLeft > 0) {
      const retryAfterMs = parseRetryAfterMs(error?.response?.headers?.['retry-after'], fallbackDelayMs)
      await wait(retryAfterMs)
      return requestActiveFeaturesWithRetry(retriesLeft - 1, fallbackDelayMs * 2)
    }
    throw error
  }
}

export const homeApi = {
  getQuickActions: () => requestActiveFeaturesWithRetry(),
}
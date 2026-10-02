import { publicClient } from '@/lib/api/publicClient'
import type { Category } from '../types/categoryTypes'
import type { AxiosResponse } from 'axios'

interface CategoriesApiResponse {
  success?: boolean
  data?: Category[]
  items?: Category[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const parseRetryAfterMs = (value: unknown, fallbackMs: number): number => {
  const asNumber = Number(value)
  if (Number.isFinite(asNumber) && asNumber > 0) {
    return asNumber * 1000
  }
  return fallbackMs
}

const requestCategoriesWithRetry = async (
  retriesLeft = 2,
  fallbackDelayMs = 1000,
): Promise<AxiosResponse<CategoriesApiResponse>> => {
  try {
    return await publicClient.get<CategoriesApiResponse>('/categories', {
      params: { page: 1, limit: 100 },
    })
  } catch (error: any) {
    const status = error?.response?.status
    if (status === 429 && retriesLeft > 0) {
      const retryAfterMs = parseRetryAfterMs(error?.response?.headers?.['retry-after'], fallbackDelayMs)
      await wait(retryAfterMs)
      return requestCategoriesWithRetry(retriesLeft - 1, fallbackDelayMs * 2)
    }
    throw error
  }
}

export const categoryApi = {
  getAll: () => requestCategoriesWithRetry(),
  getPage: (page: number, limit = 100) =>
    publicClient.get<CategoriesApiResponse>('/categories', {
      params: { page, limit },
    }),
}
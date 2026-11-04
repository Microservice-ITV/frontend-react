import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'

type RetryableConfig = InternalAxiosRequestConfig & {
  __retry429Count?: number
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const parseRetryAfterMs = (value: unknown, fallbackMs: number): number => {
  const asNumber = Number(value)
  if (Number.isFinite(asNumber) && asNumber > 0) {
    // Retry-After may be seconds
    return asNumber < 1000 ? asNumber * 1000 : asNumber
  }
  return fallbackMs
}

const isIdempotentMethod = (method?: string) => {
  const m = (method ?? 'get').toLowerCase()
  return m === 'get' || m === 'head' || m === 'options'
}

/**
 * Quietly retry idempotent requests on 429 so home refresh bursts do not
 * surface "Request failed with status code 429" to shoppers.
 */
export const setupRetryOn429 = (
  client: AxiosInstance,
  options: { maxRetries?: number; baseDelayMs?: number } = {},
) => {
  const maxRetries = options.maxRetries ?? 3
  const baseDelayMs = options.baseDelayMs ?? 800

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const config = error.config as RetryableConfig | undefined
      const status = error.response?.status

      if (!config || status !== 429 || !isIdempotentMethod(config.method)) {
        return Promise.reject(error)
      }

      const retryCount = config.__retry429Count ?? 0
      if (retryCount >= maxRetries) {
        return Promise.reject(error)
      }

      config.__retry429Count = retryCount + 1
      const retryAfterMs = parseRetryAfterMs(
        error.response?.headers?.['retry-after'],
        baseDelayMs * 2 ** retryCount,
      )
      await wait(retryAfterMs)
      return client.request(config)
    },
  )
}

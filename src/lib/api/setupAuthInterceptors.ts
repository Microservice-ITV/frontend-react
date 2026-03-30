import type { AxiosInstance } from 'axios'
import { store } from '@/app/store'
import { logout, refreshAccessToken } from '@/features/auth/store/authThunks'

type RetryableConfig = {
  _retry?: boolean
  url?: string
  headers?: Record<string, string>
}

type SetupAuthInterceptorsOptions = {
  skipAuthForPaths?: string[]
  enableRefreshRetry?: boolean
}

let isRefreshing = false
let failedQueue: Array<{
  resolve: () => void
  reject: (error: unknown) => void
}> = []

const processQueue = (error?: unknown) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error)
      return
    }
    promise.resolve()
  })
  failedQueue = []
}

const matchesAnyPath = (url: string | undefined, paths: string[]) =>
  Boolean(url && paths.some((path) => url.includes(path)))

export const setupAuthInterceptors = (
  client: AxiosInstance,
  options: SetupAuthInterceptorsOptions = {},
) => {
  const skipAuthForPaths = options.skipAuthForPaths ?? []
  const enableRefreshRetry = options.enableRefreshRetry ?? true

  client.interceptors.request.use((config) => {
    const token = store.getState().auth.accessToken
    const shouldSkipAuth = matchesAnyPath(config.url, skipAuthForPaths)

    if (token && config.headers && !shouldSkipAuth) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  if (!enableRefreshRetry) {
    return
  }

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = (error?.config ?? {}) as RetryableConfig
      const { hasSession } = store.getState().auth
      const shouldSkipRefresh = matchesAnyPath(originalRequest.url, skipAuthForPaths)

      if (error?.response?.status !== 401 || shouldSkipRefresh) {
        return Promise.reject(error)
      }

      if (!hasSession) {
        return Promise.reject(error)
      }

      if (originalRequest._retry) {
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise<void>((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(() => client(originalRequest))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const newAccessToken = await store.dispatch(refreshAccessToken()).unwrap()
        if (!newAccessToken) {
          await store.dispatch(logout())
          throw new Error('Refresh token unavailable or expired')
        }
        processQueue()
        return client(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError)
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    },
  )
}
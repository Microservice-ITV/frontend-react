import type { AxiosInstance } from 'axios'

// Lazily import the store and auth thunks to break the circular dependency:
// setupAuthInterceptors -> store -> ... -> authThunks -> authApi -> authClient -> setupAuthInterceptors
// Static imports at module scope would leave `setupAuthInterceptors` uninitialized when
// authClient calls it during module evaluation.
let storePromise: Promise<typeof import('@/app/store')> | null = null
let authThunksPromise: Promise<typeof import('@/features/auth/store/authThunks')> | null = null

const getStore = (): Promise<typeof import('@/app/store')> => {
    storePromise ??= import('@/app/store')
    return storePromise
}

const getAuthThunks = (): Promise<typeof import('@/features/auth/store/authThunks')> => {
    authThunksPromise ??= import('@/features/auth/store/authThunks')
    return authThunksPromise
}

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

  client.interceptors.request.use(async (config) => {
    const { store } = await getStore()
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
      const { store } = await getStore()
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
        const { refreshAccessToken, logout } = await getAuthThunks()
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
import axios from 'axios'
import { AUTH_SERVICE_BASE_URL } from './apiConfig'
import { store } from '@/app/store'
import { refreshAccessToken, logout } from '@/features/auth/store/authThunks'

// This file was previously named authApi and is now renamed to clarify
// that it represents a low-level HTTP client (transport layer).

export const authClient = axios.create({
  baseURL: AUTH_SERVICE_BASE_URL,
  withCredentials: true,
})

authClient.interceptors.request.use((config) => {
  const isAuthEndpoint =
    config.url?.includes('/login') ||
    config.url?.includes('/register') ||
    config.url?.includes('/refresh') ||
    config.url?.includes('/logout')

  const token = store.getState().auth.accessToken
  // `/refresh` and `/logout` rely on HttpOnly cookies, not the current
  // Authorization header. Skipping the header here avoids sending an already
  // expired access token to endpoints that are meant to restore the session.
  if (token && config.headers && !isAuthEndpoint) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let failedQueue: any[] = []

const processQueue = (error: any) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve()))
  failedQueue = []
}

authClient.interceptors.response.use(
  (r) => r,
  async (error) => {
    const originalRequest: any = error.config

    const isAuthEndpoint =
      originalRequest.url?.includes('/login') ||
      originalRequest.url?.includes('/register') ||
      originalRequest.url?.includes('/refresh') ||
      originalRequest.url?.includes('/logout')

    const { hasSession } = store.getState().auth

    if (error.response?.status === 401 && !hasSession) {
      return Promise.reject(error)
    }

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) =>
          failedQueue.push({ resolve, reject }),
        ).then(() => authClient(originalRequest))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // One refresh request restores the session for every queued request.
        const newAccessToken = await store.dispatch(refreshAccessToken()).unwrap()
        if (!newAccessToken) {
          // If refresh returns no token, the server no longer considers this
          // browser session valid, so we must fully log out on the client too.
          await store.dispatch(logout())
          throw new Error('Refresh token unavailable or expired')
        }
        processQueue(null)
        return authClient(originalRequest)
      } catch (err) {
        processQueue(err)
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)


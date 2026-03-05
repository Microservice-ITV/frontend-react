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
  const token = store.getState().auth.accessToken
  if (token && config.headers) {
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
        await store.dispatch(refreshAccessToken()).unwrap()
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


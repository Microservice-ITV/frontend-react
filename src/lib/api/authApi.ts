import axios, { AxiosRequestConfig } from 'axios'
import { AUTH_SERVICE_BASE_URL } from './apiConfig'
import { store } from '@/app/store'
import { refreshAccessToken, logout } from '@/features/auth/store/authThunks'

interface AxiosRequestConfigWithRetry extends AxiosRequestConfig {
    _retry?: boolean
}

export const authApi = axios.create({
    baseURL: AUTH_SERVICE_BASE_URL,
    withCredentials: true,
})

/* =========================
   REQUEST INTERCEPTOR
   ========================= */
authApi.interceptors.request.use((config) => {
    const token = store.getState().auth.accessToken
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})


/* =========================
   RESPONSE INTERCEPTOR
   ========================= */
let isRefreshing = false
let failedQueue: any[] = []

const processQueue = (error: any) => {
    failedQueue.forEach(p => error ? p.reject(error) : p.resolve())
    failedQueue = []
}


/* =========================
  REFRESH TOKEN INTERCEPTOR
   ========================= */
authApi.interceptors.response.use(
    r => r,
    async (error) => {
        const originalRequest = error.config as AxiosRequestConfigWithRetry

        const isAuthEndpoint =
            originalRequest.url?.includes('/login')
            || originalRequest.url?.includes('/register')
            || originalRequest.url?.includes('/refresh')
            || originalRequest.url?.includes('/logout')

        // read auth state ONCE
        const { hasSession } = store.getState().auth

        // if no session, STOP immediately
        if (error.response?.status === 401 && !hasSession) {
            return Promise.reject(error)
        }

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
            if (isRefreshing) {
                return new Promise((resolve, reject) =>
                    failedQueue.push({ resolve, reject })
                ).then(() => authApi(originalRequest))
            }

            originalRequest._retry = true
            isRefreshing = true

            try {
                await store.dispatch(refreshAccessToken()).unwrap()
                processQueue(null)
                return authApi(originalRequest)
            } catch (err) {
                processQueue(err)
                return Promise.reject(error)
            } finally {
                isRefreshing = false
            }
        }

        return Promise.reject(error)
    }
)
